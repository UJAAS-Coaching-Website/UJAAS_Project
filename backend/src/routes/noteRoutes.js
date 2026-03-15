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
const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error("Unsupported file format. Allowed formats: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG."));
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

router.post("/upload", canManageContent, (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ message: "File is too large. Maximum allowed size is 50MB." });
            }
            if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(400).json({ message: "Please upload exactly one file." });
            }
            return res.status(400).json({ message: error.message || "Upload failed." });
        }

        if (error) {
            return res.status(400).json({ message: error.message || "Upload failed." });
        }

        return handleUploadNote(req, res, next);
    });
});
router.post("/", canManageContent, handleCreateNote);
router.put("/:id", canManageContent, handleUpdateNote);
router.delete("/:id", canManageContent, handleDeleteNote);

export default router;
