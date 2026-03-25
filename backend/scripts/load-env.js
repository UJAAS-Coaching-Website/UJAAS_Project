import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded relative to backend/, regardless of current working directory
const envPath = path.join(__dirname, "..", ".env");
const hasEnvFile = fs.existsSync(envPath);
const result = dotenv.config({ path: envPath });

// Debug (safe): do not print secrets, just presence info
console.log(
  `[env] load-env.js path=${envPath} exists=${hasEnvFile} loaded=${
    result.error ? "false" : "true"
  }`
);
