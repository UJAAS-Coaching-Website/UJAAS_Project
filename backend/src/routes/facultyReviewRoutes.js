import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { 
    startReviewSession, 
    getFacultiesToRate, 
    submitFacultyRatings,
    getActiveSession
} from "../services/facultyReviewService.js";

const router = Router();

// Admin: Start a new 3-day review session
router.post("/trigger", authenticate, requireRole("admin"), async (req, res) => {
    try {
        const session = await startReviewSession(req.user.sub);
        res.status(200).json({ status: "success", session });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Student: Get faculties they can rate in the current session
router.get("/to-rate", authenticate, requireRole("student"), async (req, res) => {
    try {
        const faculties = await getFacultiesToRate(req.user.sub);
        const session = await getActiveSession();
        res.status(200).json({ status: "success", faculties, session });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Student: Submit their ratings
router.post("/submit", authenticate, requireRole("student"), async (req, res) => {
    try {
        const { ratings } = req.body;
        if (!ratings || !Array.isArray(ratings)) {
            return res.status(400).json({ status: "error", message: "Invalid ratings data." });
        }
        await submitFacultyRatings(req.user.sub, ratings);
        res.status(200).json({ status: "success" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

export default router;
