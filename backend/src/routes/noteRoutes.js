import { Router } from "express";
import multer from "multer";
import {
    handleGetNotes,
    handleGetNoteById,
    handleCreateNote,
    handleUploadNote,
    handleUpdateNote,
    handleDeleteNote
} from "../controllers/noteController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 1,
    },
});

router.use(authenticate);

// Get notes (open to authenticated users, requires ?chapter_id=)
router.get("/", handleGetNotes);
router.get("/:id", handleGetNoteById);

// Only faculty can manage notes, subject to chapter batch/subject authorization.
const canManageContent = (req, res, next) => {
    if (req.user?.role === "faculty") {
        return next();
    }
    return res.status(403).json({ message: "forbidden" });
};

router.post("/upload", canManageContent, upload.single("file"), handleUploadNote);
router.post("/", canManageContent, handleCreateNote);
router.put("/:id", canManageContent, handleUpdateNote);
router.delete("/:id", canManageContent, handleDeleteNote);

export default router;
