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
    getAttemptSummary,
    getAttemptResult,
    getAttemptQuestionExplanation,
    getTestAnalysis,
    getTestStudentAnalysis,
    handleCreateTest,
    handleUpdateTestStatus,
    handleDeleteTest,
    handleUpdateTest
} from "../controllers/testController.js";

const router = Router();

router.get("/attempts/mine", authenticate, requireRole("student"), checkCache(req => `student:${req.user?.sub}:test_attempts`, 600), listMyAttemptResults);
router.get("/attempts/:attemptId/summary", authenticate, requireAnyRole("admin", "faculty", "student"), checkCache(req => `user:${req.user?.role}:${req.user?.sub}:attempts:${req.params.attemptId}:summary`, 3600), getAttemptSummary);
router.get("/attempts/:attemptId/result", authenticate, requireAnyRole("admin", "faculty", "student"), checkCache(req => `user:${req.user?.role}:${req.user?.sub}:attempts:${req.params.attemptId}:result`, 3600), getAttemptResult);
router.get("/attempts/:attemptId/questions/:questionId/explanation", authenticate, requireAnyRole("admin", "faculty", "student"), checkCache(req => `user:${req.user?.role}:${req.user?.sub}:attempts:${req.params.attemptId}:expl:${req.params.questionId}`, 3600), getAttemptQuestionExplanation);
router.patch("/attempts/:attemptId/progress", authenticate, requireRole("student"), saveMyAttemptProgress); // Exclude from invalidation due to high frequency, TTL expires.
router.post(
    "/attempts/:attemptId/submit",
    authenticate,
    requireRole("student"),
    invalidateCache((req) => [
        `student:${req.user?.sub}:test_attempts`,
        `attempts:${req.params.attemptId}:*`,
        `user:*:attempts:${req.params.attemptId}:*`,
        `student:${req.user?.sub}:test:*:summary`,
        "test:*:analysis*",
    ]),
    submitMyAttempt
);
router.get("/:id/attempts/analysis/:studentId", authenticate, requireAnyRole("admin", "faculty"), checkCache(req => `test:${req.params.id}:analysis:student:${req.params.studentId}`, 600), getTestStudentAnalysis);
router.get("/:id/attempts/analysis", authenticate, requireAnyRole("admin", "faculty"), checkCache(req => `test:${req.params.id}:analysis:${String(req.query.search || '').trim().toLowerCase() || 'all'}`, 600), getTestAnalysis);
router.get("/:id/attempts", authenticate, requireRole("student"), checkCache(req => `student:${req.user?.sub}:test:${req.params.id}:summary`, 600), getMyTestAttemptSummary);
router.post("/:id/attempts/start", authenticate, requireRole("student"), invalidateCache(req => [`student:${req.user?.sub}:*`]), startMyTestAttempt);

// Allow read access for admins, faculty, and students with role-aware filtering.
// Do not cache test list/details: status transitions (upcoming -> live) must be visible immediately.
router.get("/", authenticate, requireAnyRole("admin", "faculty", "student"), listTests);
router.get("/:id", authenticate, requireAnyRole("admin", "faculty", "student"), getTest);

// Modification routes
router.post("/", authenticate, requireRole("admin"), invalidateCache(['tests:list:*', 'user:*:attempts:*', 'test:*:analysis*']), handleCreateTest);
router.put("/:id", authenticate, requireAnyRole("admin", "faculty"), invalidateCache(req => ['tests:list:*', `test:${req.params.id}:*`, 'user:*:attempts:*', 'test:*:analysis*']), handleUpdateTest);
router.patch("/:id/status", authenticate, requireRole("admin"), invalidateCache(req => ['tests:list:*', `test:${req.params.id}:*`, 'user:*:attempts:*', 'test:*:analysis*']), handleUpdateTestStatus);
router.delete("/:id", authenticate, requireRole("admin"), invalidateCache(req => ['tests:list:*', `test:${req.params.id}:*`, 'user:*:attempts:*', 'test:*:analysis*']), handleDeleteTest);

export default router;
