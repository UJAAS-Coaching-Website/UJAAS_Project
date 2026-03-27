import "dotenv/config";

export const port = process.env.PORT || 4000;
export const nodeEnv = process.env.NODE_ENV || "development";
export const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
export const databaseUrl = process.env.DATABASE_URL;

export const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((v) => v.trim())
    : true;
export const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

export const accessCookieName = "ujaas_token";
export const refreshCookieName = "ujaas_refresh";

function parsePositiveInt(value, fallback) {
    const parsed = Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Keep sessions effectively persistent until explicit logout/revocation.
// Still configurable via env for deployments that need stricter TTL.
const persistentTtlSeconds = 10 * 365 * 24 * 60 * 60; // 10 years

export const accessTtlSeconds = parsePositiveInt(process.env.ACCESS_TTL_SECONDS, persistentTtlSeconds);
export const refreshTtlSeconds = parsePositiveInt(process.env.REFRESH_TTL_SECONDS, persistentTtlSeconds);
