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

// Admin and Faculty can manage chapters
const canManageContent = (req, res, next) => {
    if (req.user?.role === "admin" || req.user?.role === "faculty") {
        return next();
    }
    return res.status(403).json({ message: "forbidden" });
};

router.post("/", canManageContent, handleCreateChapter);
router.put("/:id", canManageContent, handleUpdateChapter);
router.delete("/:id", canManageContent, handleDeleteChapter);

export default router;
