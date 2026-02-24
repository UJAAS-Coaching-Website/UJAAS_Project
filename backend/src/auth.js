import crypto from "node:crypto";

const HASH_KEYLEN = 64;
const HASH_ALGO = "sha512";
const HASH_PREFIX = "scrypt";

function base64urlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(value) {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, "=").replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

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

export function signJwt(payload, secret, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedBody = base64urlEncode(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedBody}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

export function verifyJwt(token, secret) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedBody, signature] = parts;
  const data = `${encodedHeader}.${encodedBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(encodedBody));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}
