export function getDeviceIdFromRequest(req) {
    const raw = req?.headers?.["x-device-id"];
    if (!raw) return null;
    if (Array.isArray(raw)) {
        return raw[0]?.trim() || null;
    }
    return String(raw).trim() || null;
}
