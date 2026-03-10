import crypto from "node:crypto";
import { pool } from "../db/index.js";
import { signJwt } from "../utils/jwt.js";
import { setAccessCookie, setRefreshCookie } from "../middleware/cookies.js";
import {
    jwtSecret,
    accessTtlSeconds,
    refreshTtlSeconds,
} from "../config/index.js";

export function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export async function isTokenBlacklisted(jti) {
    if (!jti) return false;
    const result = await pool.query(
        "SELECT 1 FROM token_blacklist WHERE jti = $1 AND expires_at > now()",
        [jti]
    );
    return result.rowCount > 0;
}

export async function issueAuthTokens({ userId, role, res, familyId = crypto.randomUUID() }) {
    const accessJti = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();

    const accessToken = signJwt(
        { sub: userId, role, type: "access", jti: accessJti },
        jwtSecret,
        accessTtlSeconds
    );

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
