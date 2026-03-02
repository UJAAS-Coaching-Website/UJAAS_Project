import {
    accessCookieName,
    refreshCookieName,
    accessTtlSeconds,
    refreshTtlSeconds,
    nodeEnv,
} from "../config/index.js";

export function setAccessCookie(res, token) {
    res.cookie(accessCookieName, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: nodeEnv === "production",
        maxAge: accessTtlSeconds * 1000,
        path: "/",
    });
}

export function setRefreshCookie(res, token) {
    res.cookie(refreshCookieName, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: nodeEnv === "production",
        maxAge: refreshTtlSeconds * 1000,
        path: "/",
    });
}

export function clearAuthCookies(res) {
    const cookieOptions = {
        httpOnly: true,
        sameSite: "lax",
        secure: nodeEnv === "production",
        path: "/",
    };
    res.clearCookie(accessCookieName, cookieOptions);
    res.clearCookie(refreshCookieName, cookieOptions);
}
