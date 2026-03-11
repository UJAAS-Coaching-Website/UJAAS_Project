import { Router } from "express";
import {
    handleGetChapters,
    handleGetChapterById,
    handleCreateChapter,
    handleUpdateChapter,
    handleDeleteChapter
} from "../controllers/chapterController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Get chapters (open to authenticated users, usually with ?batch_id=&subject_name=)
router.get("/", handleGetChapters);
router.get("/:id", handleGetChapterById);

// Admin-only modifying routes
router.post("/", requireRole("admin"), handleCreateChapter);
router.put("/:id", requireRole("admin"), handleUpdateChapter);
router.delete("/:id", requireRole("admin"), handleDeleteChapter);

export default router;
