import { Router } from "express";
import { authenticate, requireAnyRole, requireRole } from "../middleware/auth.js";
import {
    handleListDpps,
    handleGetDpp,
    handleGetMyDppAttemptSummary,
    handleStartMyDppAttempt,
    handleSubmitMyDppAttempt,
    handleGetDppAttemptSummaryResult,
    handleGetDppAttemptResult,
    handleGetDppAttemptQuestionExplanation,
    handleGetDppAnalysis,
    handleCreateDpp,
    handleUpdateDpp,
    handleDeleteDpp,
} from "../controllers/dppController.js";

const router = Router();

router.use(authenticate);

router.get("/attempts/:attemptId/summary", requireAnyRole("admin", "faculty", "student"), handleGetDppAttemptSummaryResult);
router.get("/attempts/:attemptId/result", requireAnyRole("admin", "faculty", "student"), handleGetDppAttemptResult);
router.get("/attempts/:attemptId/questions/:questionId/explanation", requireAnyRole("admin", "faculty", "student"), handleGetDppAttemptQuestionExplanation);
router.get("/:id/attempts/analysis", requireAnyRole("admin", "faculty"), handleGetDppAnalysis);
router.get("/:id/attempts", requireRole("student"), handleGetMyDppAttemptSummary);
router.post("/:id/attempts/start", requireRole("student"), handleStartMyDppAttempt);
router.post("/:id/submit", requireRole("student"), handleSubmitMyDppAttempt);

router.get("/", requireAnyRole("admin", "faculty", "student"), handleListDpps);
router.get("/:id", requireAnyRole("admin", "faculty", "student"), handleGetDpp);

router.post("/", requireRole("faculty"), handleCreateDpp);
router.put("/:id", requireRole("faculty"), handleUpdateDpp);
router.delete("/:id", requireRole("faculty"), handleDeleteDpp);

export default router;
