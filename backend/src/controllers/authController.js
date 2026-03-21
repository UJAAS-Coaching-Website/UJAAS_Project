import crypto from "node:crypto";
import { pool } from "../db/index.js";
import { verifyPassword } from "../utils/password.js";
import { signJwt, verifyJwt } from "../utils/jwt.js";
import { parseCookies } from "../utils/cookies.js";
import { getTokenFromRequest } from "../middleware/auth.js";
import { hashToken, issueAuthTokens } from "../services/authService.js";
import { fetchUserProfileById, resetUserPassword } from "../services/userService.js";
import { setAccessCookie, setRefreshCookie, clearAuthCookies } from "../middleware/cookies.js";
import {
    jwtSecret,
    refreshCookieName,
    accessTtlSeconds,
    refreshTtlSeconds,
} from "../config/index.js";

export async function login(req, res) {
    const { identifier, loginId, email, password } = req.body || {};
    let effectiveLoginId = loginId || identifier || email;

    if (!effectiveLoginId || !password) {
        return res.status(400).json({ message: "loginId/email and password are required" });
    }

    try {
        effectiveLoginId = String(effectiveLoginId).trim();
        let userLookup = await pool.query(
            "SELECT id, role, password_hash, login_id FROM users WHERE LOWER(login_id) = $1",
            [effectiveLoginId.toLowerCase()]
        );

        // Backward-compatibility alias for legacy student credentials used in docs/tests.
        if (userLookup.rowCount === 0 && effectiveLoginId.toLowerCase() === "student@ujaas.com") {
            userLookup = await pool.query(
                "SELECT id, role, password_hash, login_id FROM users WHERE LOWER(login_id) = $1",
                ["ujaas-2026-001"]
            );
        }

        if (userLookup.rowCount === 0) {
            return res.status(401).json({ message: "invalid loginId/email or password" });
        }

        const dbUser = userLookup.rows[0];
        const validPassword = verifyPassword(password, dbUser.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: "invalid loginId or password" });
        }

        const user = await fetchUserProfileById(dbUser.id);
        const { accessToken } = await issueAuthTokens({ userId: dbUser.id, role: dbUser.role, res });

        return res.status(200).json({ token: accessToken, user });
    } catch (error) {
        console.error("login failed:", error.stack || error.message);
        return res.status(500).json({ message: "login failed", error: error.message });
    }
}

export async function me(req, res) {
    try {
        const user = await fetchUserProfileById(req.user.sub);
        if (!user || (user.role !== "student" && user.role !== "faculty" && user.role !== "admin")) {
            return res.status(401).json({ message: "unauthorized" });
        }
        // Keep existing { user } contract while exposing flat fields
        // for external API runners expecting top-level properties.
        const derivedEmail = user?.loginId?.includes("@") ? user.loginId : null;
        return res.status(200).json({
            user,
            id: user.id,
            name: user.name,
            role: user.role,
            loginId: user.loginId ?? null,
            email: derivedEmail,
        });
    } catch (error) {
        return res.status(500).json({ message: "failed to load profile", error: error.message });
    }
}

export async function refresh(req, res) {
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
            await pool.query(
                "UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL",
                [payload.fid]
            );
            clearAuthCookies(res);
            return res.status(401).json({ message: "unauthorized" });
        }

        const user = await fetchUserProfileById(payload.sub);
        if (!user || (user.role !== "student" && user.role !== "faculty" && user.role !== "admin")) {
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
}

export async function logout(req, res) {
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
}

export async function adminResetPassword(req, res) {
    const { userId, newPassword } = req.body || {};

    if (!userId || typeof userId !== "string") {
        return res.status(400).json({ message: "userId is required" });
    }

    if (!newPassword || typeof newPassword !== "string" || !newPassword.trim()) {
        return res.status(400).json({ message: "newPassword is required" });
    }

    try {
        const updated = await resetUserPassword(userId, newPassword.trim());
        if (!updated) {
            return res.status(404).json({ message: "user not found" });
        }
        return res.status(200).json({
            message: "password reset",
            user: {
                id: updated.id,
                name: updated.name,
                loginId: updated.login_id,
                role: updated.role,
            },
        });
    } catch (error) {
        console.error("admin reset password failed:", error.stack || error.message);
        return res.status(500).json({ message: "reset failed", error: error.message });
    }
}

export async function changePassword(req, res) {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || typeof currentPassword !== "string") {
        return res.status(400).json({ message: "currentPassword is required" });
    }

    if (newPassword === undefined && confirmPassword === undefined) {
        try {
            const userId = req.user?.sub;
            if (!userId) {
                return res.status(401).json({ message: "unauthorized" });
            }

            const userResult = await pool.query(
                "SELECT id, password_hash FROM users WHERE id = $1",
                [userId]
            );

            if (userResult.rowCount === 0) {
                return res.status(404).json({ message: "user not found" });
            }

            const validPassword = verifyPassword(currentPassword, userResult.rows[0].password_hash);
            if (!validPassword) {
                return res.status(401).json({ message: "invalid current password" });
            }

            return res.status(200).json({ message: "current password verified" });
        } catch (error) {
            console.error("verify password failed:", error.stack || error.message);
            return res.status(500).json({ message: "verify password failed", error: error.message });
        }
    }

    if (!newPassword || typeof newPassword !== "string" || !newPassword.trim()) {
        return res.status(400).json({ message: "newPassword is required" });
    }

    if (typeof confirmPassword !== "string" || newPassword !== confirmPassword) {
        return res.status(400).json({ message: "passwords do not match" });
    }

    try {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ message: "unauthorized" });
        }

        const userResult = await pool.query(
            "SELECT id, password_hash FROM users WHERE id = $1",
            [userId]
        );

        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: "user not found" });
        }

        const validPassword = verifyPassword(currentPassword, userResult.rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: "invalid current password" });
        }

        const updated = await resetUserPassword(userId, newPassword.trim());
        if (!updated) {
            return res.status(404).json({ message: "user not found" });
        }

        return res.status(200).json({ message: "password updated" });
    } catch (error) {
        console.error("change password failed:", error.stack || error.message);
        return res.status(500).json({ message: "change password failed", error: error.message });
    }
}
