import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOrigin } from "./config/index.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

const app = express();

// ── Global middleware ──────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
    })
);
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use(healthRoutes);

export default app;
