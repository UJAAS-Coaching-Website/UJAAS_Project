import crypto from "node:crypto";

const HASH_KEYLEN = 64;
const HASH_ALGO = "sha512";
const HASH_PREFIX = "scrypt";

export function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, HASH_KEYLEN).toString("hex");
    return `${HASH_PREFIX}:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
    if (!storedHash || typeof storedHash !== "string") {
        return false;
    }

    const parts = storedHash.split(":");

    // Backward compatibility with earlier "salt:hash" format.
    if (parts.length === 2) {
        const [salt, hash] = parts;
        const calculated = crypto.scryptSync(password, salt, HASH_KEYLEN).toString("hex");
        const calculatedBuffer = Buffer.from(calculated, "hex");
        const hashBuffer = Buffer.from(hash, "hex");
        if (calculatedBuffer.length !== hashBuffer.length) {
            return false;
        }
        return crypto.timingSafeEqual(calculatedBuffer, hashBuffer);
    }

    if (parts.length !== 3 || parts[0] !== HASH_PREFIX) {
        return false;
    }

    const [, salt, hash] = parts;
    const calculated = crypto.scryptSync(password, salt, HASH_KEYLEN).toString("hex");
    const calculatedBuffer = Buffer.from(calculated, "hex");
    const hashBuffer = Buffer.from(hash, "hex");
    if (calculatedBuffer.length !== hashBuffer.length) {
        return false;
    }
    return crypto.timingSafeEqual(calculatedBuffer, hashBuffer);
}
