import { Router } from "express";
import {
    handleGetNotes,
    handleGetNoteById,
    handleCreateNote,
    handleUpdateNote,
    handleDeleteNote
} from "../controllers/noteController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Get notes (open to authenticated users, requires ?chapter_id=)
router.get("/", handleGetNotes);
router.get("/:id", handleGetNoteById);

// Admin and Faculty can manage notes
const canManageContent = (req, res, next) => {
    if (req.user?.role === "admin" || req.user?.role === "faculty") {
        return next();
    }
    return res.status(403).json({ message: "forbidden" });
};

router.post("/", canManageContent, handleCreateNote);
router.put("/:id", canManageContent, handleUpdateNote);
router.delete("/:id", canManageContent, handleDeleteNote);

export default router;
