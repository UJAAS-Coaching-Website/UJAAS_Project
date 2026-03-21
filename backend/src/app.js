import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOrigin, frontendOrigin, nodeEnv } from "./config/index.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import landingRoutes from "./routes/landingRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import dppRoutes from "./routes/dppRoutes.js";
import chapterRoutes from "./routes/chapterRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import questionBankRoutes from "./routes/questionBankRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import facultyReviewRoutes from "./routes/facultyReviewRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

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
app.use("/api/dpps", dppRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/question-bank", questionBankRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/faculty-reviews", facultyReviewRoutes);
app.use("/api/notification-center", notificationRoutes);
app.use(healthRoutes);

// In development, forward non-API SPA routes to the frontend dev server.
if (nodeEnv === "development") {
    app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
        try {
            const target = new URL(req.originalUrl || "/", frontendOrigin).toString();
            return res.redirect(302, target);
        } catch {
            return res.status(404).send("Not Found");
        }
    });
}

export default app;
