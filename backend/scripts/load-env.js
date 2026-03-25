import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded relative to backend/, regardless of current working directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });
