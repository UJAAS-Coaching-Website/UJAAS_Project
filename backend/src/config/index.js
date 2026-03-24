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
export const accessTtlSeconds = 15 * 60;
export const refreshTtlSeconds = 7 * 24 * 60 * 60;
