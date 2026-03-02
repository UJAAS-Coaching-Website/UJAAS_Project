import { Router } from "express";
import { checkDb } from "../db/index.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const status = await checkDb();
        const label = status.ok ? "UP" : "DOWN";
        res.status(status.ok ? 200 : 503).send(`Database is ${label}`);
    } catch {
        res.status(503).send("Database is DOWN");
    }
});

export default router;
