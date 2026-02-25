import express from "express";
import cors from "cors";
import helmet from "helmet";
import crypto from "node:crypto";
import "dotenv/config";
import { checkDb, pool } from "./server.js";
import { parseCookies, signJwt, verifyJwt, verifyPassword } from "./auth.js";

const app = express();
const port = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((v) => v.trim()) : true;
const accessCookieName = "ujaas_token";
const refreshCookieName = "ujaas_refresh";
const accessTtlSeconds = 15 * 60;
const refreshTtlSeconds = 7 * 24 * 60 * 60;

function toApiUser(row) {
  return {
    id: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    enrolledCourses: row.enrolled_courses ?? [],
    studentDetails:
      row.role === "student"
        ? {
            rollNumber: row.roll_number ?? "",
            batch: row.batch_name ?? "",
            joinDate: row.join_date ?? null,
            phone: row.phone ?? "",
            address: row.address ?? "",
            dateOfBirth: row.date_of_birth ?? null,
            parentContact: row.parent_contact ?? "",
            ratings: {
              attendance: row.attendance ?? 0,
              assignments: row.assignments ?? 0,
              tests: row.tests ?? 0,
              participation: row.participation ?? 0,
              behavior: row.behavior ?? 0,
              engagement: row.engagement ?? 0,
            },
          }
        : null,
  };
}

async function fetchUserProfileById(userId) {
  const query = `
    SELECT
      u.id AS user_id,
      u.name,
      u.email,
      u.role,
      s.roll_number,
      s.phone,
      s.address,
      TO_CHAR(s.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
      s.parent_contact,
      TO_CHAR(s.join_date, 'YYYY-MM-DD') AS join_date,
      COALESCE(r.attendance, 0) AS attendance,
      COALESCE(r.assignments, 0) AS assignments,
      COALESCE(r.tests, 0) AS tests,
      COALESCE(r.participation, 0) AS participation,
      COALESCE(r.behavior, 0) AS behavior,
      COALESCE(r.engagement, 0) AS engagement,
      COALESCE(
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT b.name), NULL),
        ARRAY[]::text[]
      ) AS enrolled_courses,
      MIN(b.year) AS batch_name
    FROM users u
    LEFT JOIN students s ON s.user_id = u.id
    LEFT JOIN ratings r ON r.student_id = s.user_id
    LEFT JOIN student_batches sb ON sb.student_id = s.user_id
    LEFT JOIN batches b ON b.id = sb.batch_id
    WHERE u.id = $1
    GROUP BY
      u.id, u.name, u.email, u.role,
      s.roll_number, s.phone, s.address, s.date_of_birth, s.parent_contact, s.join_date,
      r.attendance, r.assignments, r.tests, r.participation, r.behavior, r.engagement
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0] ? toApiUser(result.rows[0]) : null;
}

function getTokenFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[accessCookieName];
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  return null;
}

function setAccessCookie(res, token) {
  res.cookie(accessCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: accessTtlSeconds * 1000,
    path: "/",
  });
}

function setRefreshCookie(res, token) {
  res.cookie(refreshCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: refreshTtlSeconds * 1000,
    path: "/",
  });
}

function clearAuthCookies(res) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  res.clearCookie(accessCookieName, cookieOptions);
  res.clearCookie(refreshCookieName, cookieOptions);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueAuthTokens({ userId, role, res, familyId = crypto.randomUUID() }) {
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();
  const accessToken = signJwt({ sub: userId, role, type: "access", jti: accessJti }, jwtSecret, accessTtlSeconds);
  const refreshToken = signJwt(
    { sub: userId, role, type: "refresh", jti: refreshJti, fid: familyId },
    jwtSecret,
    refreshTtlSeconds
  );

  await pool.query(
    `
    INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
    VALUES ($1, $2, $3, now() + ($4 || ' seconds')::interval)
    `,
    [userId, hashToken(refreshToken), familyId, refreshTtlSeconds]
  );

  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);

  return { accessToken };
}

async function isTokenBlacklisted(jti) {
  if (!jti) return false;
  const result = await pool.query("SELECT 1 FROM token_blacklist WHERE jti = $1 AND expires_at > now()", [jti]);
  return result.rowCount > 0;
}

async function authenticateAccess(req, res, requiredRole = null) {
  const token = getTokenFromRequest(req);
  const payload = verifyJwt(token, jwtSecret);

  if (!payload?.sub || payload.type !== "access") {
    res.status(401).json({ message: "unauthorized" });
    return null;
  }

  if (await isTokenBlacklisted(payload.jti)) {
    res.status(401).json({ message: "unauthorized" });
    return null;
  }

  if (requiredRole && payload.role !== requiredRole) {
    res.status(403).json({ message: "forbidden" });
    return null;
  }

  return payload;
}

app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  try {
    const userLookup = await pool.query(
      "SELECT id, role, password_hash FROM users WHERE email = $1 AND role IN ('student', 'teacher', 'admin')",
      [email.toLowerCase()]
    );
    if (userLookup.rowCount === 0) {
      return res.status(401).json({ message: "invalid email or password" });
    }

    const dbUser = userLookup.rows[0];
    const validPassword = verifyPassword(password, dbUser.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: "invalid email or password" });
    }

    const user = await fetchUserProfileById(dbUser.id);
    const { accessToken } = await issueAuthTokens({ userId: dbUser.id, role: dbUser.role, res });

    return res.status(200).json({ token: accessToken, user });
  } catch (error) {
    return res.status(500).json({ message: "login failed", error: error.message });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const payload = await authenticateAccess(req, res);
  if (!payload) return;

  try {
    const user = await fetchUserProfileById(payload.sub);
    if (!user || (user.role !== "student" && user.role !== "teacher" && user.role !== "admin")) {
      return res.status(401).json({ message: "unauthorized" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "failed to load profile", error: error.message });
  }
});

app.put("/api/profile/me", async (req, res) => {
  const payload = await authenticateAccess(req, res, "student");
  if (!payload) return;

  const { name, phone, address, dateOfBirth, parentContact } = req.body || {};
  const normalizedName = String(name ?? "").trim();

  if (!normalizedName) {
    return res.status(400).json({ message: "name is required" });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `
        UPDATE users
        SET name = $1
        WHERE id = $2
        `,
        [normalizedName, payload.sub]
      );

      const updateResult = await client.query(
        `
        UPDATE students
        SET
          phone = $1,
          address = $2,
          date_of_birth = NULLIF($3, '')::date,
          parent_contact = $4
        WHERE user_id = $5
        RETURNING user_id
        `,
        [phone ?? "", address ?? "", dateOfBirth ?? "", parentContact ?? "", payload.sub]
      );

      if (updateResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "student profile not found" });
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const user = await fetchUserProfileById(payload.sub);
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "failed to update profile", error: error.message });
  }
});

app.post("/api/auth/refresh", async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = cookies[refreshCookieName];
  const payload = verifyJwt(refreshToken, jwtSecret);

  if (!payload?.sub || payload.type !== "refresh" || !payload.fid) {
    clearAuthCookies(res);
    return res.status(401).json({ message: "unauthorized" });
  }

  const currentHash = hashToken(refreshToken);

  try {
    const current = await pool.query(
      `
      SELECT id, user_id, family_id, revoked_at, expires_at
      FROM refresh_tokens
      WHERE token_hash = $1
      `,
      [currentHash]
    );

    if (current.rowCount === 0) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "unauthorized" });
    }

    const currentToken = current.rows[0];
    if (currentToken.revoked_at || new Date(currentToken.expires_at) <= new Date()) {
      await pool.query("UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL", [
        payload.fid,
      ]);
      clearAuthCookies(res);
      return res.status(401).json({ message: "unauthorized" });
    }

    const user = await fetchUserProfileById(payload.sub);
    if (!user || (user.role !== "student" && user.role !== "teacher" && user.role !== "admin")) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "unauthorized" });
    }

    const accessJti = crypto.randomUUID();
    const nextRefreshJti = crypto.randomUUID();
    const accessToken = signJwt(
      { sub: payload.sub, role: user.role, type: "access", jti: accessJti },
      jwtSecret,
      accessTtlSeconds
    );
    const nextRefreshToken = signJwt(
      { sub: payload.sub, role: user.role, type: "refresh", jti: nextRefreshJti, fid: payload.fid },
      jwtSecret,
      refreshTtlSeconds
    );
    const nextRefreshHash = hashToken(nextRefreshToken);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `
        UPDATE refresh_tokens
        SET revoked_at = now(), replaced_by_hash = $1, last_used_at = now()
        WHERE token_hash = $2 AND revoked_at IS NULL
        `,
        [nextRefreshHash, currentHash]
      );
      await client.query(
        `
        INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
        VALUES ($1, $2, $3, now() + ($4 || ' seconds')::interval)
        `,
        [payload.sub, nextRefreshHash, payload.fid, refreshTtlSeconds]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    setAccessCookie(res, accessToken);
    setRefreshCookie(res, nextRefreshToken);
    return res.status(200).json({ token: accessToken });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(500).json({ message: "refresh failed", error: error.message });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  const accessToken = getTokenFromRequest(req);
  const accessPayload = verifyJwt(accessToken, jwtSecret);
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = cookies[refreshCookieName];
  const refreshPayload = verifyJwt(refreshToken, jwtSecret);

  try {
    if (accessPayload?.jti && accessPayload?.exp) {
      await pool.query(
        "INSERT INTO token_blacklist (jti, expires_at) VALUES ($1, to_timestamp($2)) ON CONFLICT (jti) DO NOTHING",
        [accessPayload.jti, accessPayload.exp]
      );
    }

    if (refreshToken && refreshPayload?.fid) {
      await pool.query(
        "UPDATE refresh_tokens SET revoked_at = now(), last_used_at = now() WHERE token_hash = $1 AND revoked_at IS NULL",
        [hashToken(refreshToken)]
      );
    }
  } catch {
    // Best-effort revoke; still clear client credentials.
  }

  clearAuthCookies(res);
  return res.status(200).json({ message: "logged out" });
});

app.get("/", async (req, res) => {
  try {
    const status = await checkDb();
    const label = status.ok ? "UP" : "DOWN";
    res.status(status.ok ? 200 : 503).send(`Database is ${label}`);
  } catch {
    res.status(503).send("Database is DOWN");
  }
});

app.listen(port, () => {
  // Intentionally minimal: no DB status in console.
  console.log(`Backend listening on port ${port}`);
});
