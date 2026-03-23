import { Router } from "express";
import { checkCache, invalidateCache } from "../middleware/redisCache.js";
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

router.get("/attempts/mine", authenticate, requireRole("student"), checkCache(req => `student:${req.user?.id}:test_attempts`, 600), listMyAttemptResults);
router.get("/attempts/:attemptId/result", authenticate, requireAnyRole("admin", "faculty", "student"), checkCache(req => `attempts:${req.params.attemptId}:result`, 3600), getAttemptResult);
router.get("/attempts/:attemptId/questions/:questionId/explanation", authenticate, requireAnyRole("admin", "faculty", "student"), checkCache(req => `attempts:${req.params.attemptId}:expl:${req.params.questionId}`, 3600), getAttemptQuestionExplanation);
router.patch("/attempts/:attemptId/progress", authenticate, requireRole("student"), saveMyAttemptProgress); // Exclude from invalidation due to high frequency, TTL expires.
router.post("/attempts/:attemptId/submit", authenticate, requireRole("student"), invalidateCache(req => [`student:${req.user?.id}:test_attempts`, `attempts:${req.params.attemptId}:*`, `test:${req.body?.testId}:analysis`]), submitMyAttempt);
router.get("/:id/attempts/analysis", authenticate, requireAnyRole("admin", "faculty"), checkCache(req => `test:${req.params.id}:analysis`, 600), getTestAnalysis);
router.get("/:id/attempts", authenticate, requireRole("student"), checkCache(req => `student:${req.user?.id}:test:${req.params.id}:summary`, 600), getMyTestAttemptSummary);
router.post("/:id/attempts/start", authenticate, requireRole("student"), invalidateCache(req => [`student:${req.user?.id}:*`]), startMyTestAttempt);

// Allow read access for admins, faculty, and students with role-aware filtering
router.get("/", authenticate, requireAnyRole("admin", "faculty", "student"), checkCache(req => `tests:list:user:${req.user?.id || 'anon'}:role:${req.user?.role || 'anon'}`, 600), listTests);
router.get("/:id", authenticate, requireAnyRole("admin", "faculty", "student"), checkCache(req => `test:${req.params.id}:details`, 3600), getTest);

// Modification routes
router.post("/", authenticate, requireRole("admin"), invalidateCache(['tests:list:*']), handleCreateTest);
router.put("/:id", authenticate, requireAnyRole("admin", "faculty"), invalidateCache(req => ['tests:list:*', `test:${req.params.id}:*`]), handleUpdateTest);
router.patch("/:id/status", authenticate, requireRole("admin"), invalidateCache(req => ['tests:list:*', `test:${req.params.id}:*`]), handleUpdateTestStatus);
router.delete("/:id", authenticate, requireRole("admin"), invalidateCache(req => ['tests:list:*', `test:${req.params.id}:*`]), handleDeleteTest);

export default router;
