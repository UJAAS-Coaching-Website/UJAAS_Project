import { jwtSecret } from "../config/index.js";
import { verifyJwt } from "../utils/jwt.js";
import { parseCookies } from "../utils/cookies.js";
import { isTokenBlacklisted } from "../services/authService.js";
import { accessCookieName } from "../config/index.js";

/**
 * Extract access token from cookie or Authorization header.
 */
export function getTokenFromRequest(req) {
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

/**
 * Express middleware: verifies the access token, attaches `req.user` with the
 * JWT payload, and calls `next()`. Responds 401 if invalid or blacklisted.
 */
export async function authenticate(req, res, next) {
    try {
        const token = getTokenFromRequest(req);
        if (!token) {
            console.log(`Auth failed: No token for ${req.method} ${req.originalUrl}`);
            return res.status(401).json({ message: "unauthorized" });
        }

        const payload = verifyJwt(token, jwtSecret);

        if (!payload?.sub || payload.type !== "access") {
            console.log(`Auth failed: Invalid payload for ${req.method} ${req.originalUrl}`, payload);
            return res.status(401).json({ message: "unauthorized" });
        }

        if (await isTokenBlacklisted(payload.jti)) {
            console.log(`Auth failed: Token blacklisted for ${req.method} ${req.originalUrl}`);
            return res.status(401).json({ message: "unauthorized" });
        }

        req.user = payload;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error.message);
        return res.status(503).json({ message: "service temporarily unavailable" });
    }
}

/**
 * Express middleware factory: checks that `req.user.role` matches
 * the required role. Must be used after `authenticate`.
 */
export function requireRole(role) {
    return (req, res, next) => {
        if (req.user?.role !== role) {
            console.log(`Role check failed: Expected ${role}, got ${req.user?.role} for ${req.method} ${req.originalUrl}`);
            return res.status(403).json({ message: "forbidden" });
        }
        next();
    };
}
