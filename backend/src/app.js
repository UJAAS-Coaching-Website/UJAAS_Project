import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOrigin } from "./config/index.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import landingRoutes from "./routes/landingRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import chapterRoutes from "./routes/chapterRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";

const app = express();

// ── Global middleware ──────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
    })
);
app.use(express.json({ limit: "5mb" }));

// ── Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/landing", landingRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/notes", noteRoutes);
app.use(healthRoutes);

export default app;
