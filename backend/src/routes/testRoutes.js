import { Router } from "express";
import { authenticate, requireRole, requireAnyRole } from "../middleware/auth.js";
import {
    listTests,
    getTest,
    listMyAttemptResults,
    getMyTestAttemptSummary,
    startMyTestAttempt,
    saveMyAttemptProgress,
    submitMyAttempt,
    getAttemptResult,
    getAttemptQuestionExplanation,
    getTestAnalysis,
    handleCreateTest,
    handleUpdateTestStatus,
    handleDeleteTest,
    handleUpdateTest
} from "../controllers/testController.js";

const router = Router();

router.get("/attempts/mine", authenticate, requireRole("student"), listMyAttemptResults);
router.get("/attempts/:attemptId/result", authenticate, requireAnyRole("admin", "faculty", "student"), getAttemptResult);
router.get("/attempts/:attemptId/questions/:questionId/explanation", authenticate, requireAnyRole("admin", "faculty", "student"), getAttemptQuestionExplanation);
router.patch("/attempts/:attemptId/progress", authenticate, requireRole("student"), saveMyAttemptProgress);
router.post("/attempts/:attemptId/submit", authenticate, requireRole("student"), submitMyAttempt);
router.get("/:id/attempts/analysis", authenticate, requireAnyRole("admin", "faculty"), getTestAnalysis);
router.get("/:id/attempts", authenticate, requireRole("student"), getMyTestAttemptSummary);
router.post("/:id/attempts/start", authenticate, requireRole("student"), startMyTestAttempt);

// Allow read access for admins, faculty, and students with role-aware filtering
router.get("/", authenticate, requireAnyRole("admin", "faculty", "student"), listTests);
router.get("/:id", authenticate, requireAnyRole("admin", "faculty", "student"), getTest);

// Modification routes
router.post("/", authenticate, requireRole("admin"), handleCreateTest);
router.put("/:id", authenticate, requireAnyRole("admin", "faculty"), handleUpdateTest);
router.patch("/:id/status", authenticate, requireRole("admin"), handleUpdateTestStatus);
router.delete("/:id", authenticate, requireRole("admin"), handleDeleteTest);

export default router;
