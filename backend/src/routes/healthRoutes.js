import { Router } from "express";
import { checkDb } from "../db/index.js";

const router = Router();

async function getDbHealthPayload() {
    const status = await checkDb();
    const label = status.ok ? "UP" : "DOWN";
    return {
        ok: status.ok,
        label,
        text: `Database is ${label}`,
    };
}

router.get("/", async (req, res) => {
    try {
        const health = await getDbHealthPayload();
        res.status(health.ok ? 200 : 503).send(health.text);
    } catch {
        res.status(503).send("Database is DOWN");
    }
});

// Compatibility health endpoint used by external test runners.
router.get("/root/health", async (req, res) => {
    try {
        const health = await getDbHealthPayload();
        return res.status(health.ok ? 200 : 503).json({
            status: health.ok ? "success" : "error",
            database: health.label,
            message: health.text,
        });
    } catch {
        return res.status(503).json({
            status: "error",
            database: "DOWN",
            message: "Database is DOWN",
        });
    }
});

// Additional compatibility alias expected by some generated API tests.
router.get("/health", async (req, res) => {
    try {
        const health = await getDbHealthPayload();
        return res.status(health.ok ? 200 : 503).json({
            status: health.ok ? "success" : "error",
            database: health.label,
            message: health.text,
        });
    } catch {
        return res.status(503).json({
            status: "error",
            database: "DOWN",
            message: "Database is DOWN",
        });
    }
});

export default router;
