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

// Admin-only modifying routes
router.post("/", requireRole("admin"), handleCreateNote);
router.put("/:id", requireRole("admin"), handleUpdateNote);
router.delete("/:id", requireRole("admin"), handleDeleteNote);

export default router;
