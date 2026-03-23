import { Router } from "express";
import multer from "multer";
import { checkCache, invalidateCache } from "../middleware/redisCache.js";
import {
    listBatches,
    getBatch,
    handleCreateBatch,
    handleUpdateBatch,
    handleDeleteBatch,
    handlePermanentDeleteBatch,
    handleAssignStudent,
    handleRemoveStudent,
    handleAssignFaculty,
    handleRemoveFaculty,
    handleGetBatchStudents,
    handleGetBatchFaculty,
    handleCreateBatchNotification,
    handleRemoveBatchSubject,
    handleUploadBatchTimetable,
    handleDeleteBatchTimetable,
} from "../controllers/batchController.js";
import { authenticate, requireRole, requireAnyRole } from "../middleware/auth.js";

const router = Router();
const ALLOWED_TIMETABLE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);

const timetableUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_TIMETABLE_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error("Unsupported timetable format. Allowed formats: JPG, PNG, WEBP, GIF."));
    },
});

// All batch routes require authentication
router.use(authenticate);

// Batch CRUD (Read-only for all, write for admin)
router.get("/", checkCache('global:batches:list', 600), listBatches);
router.get("/:id", checkCache(req => `batch:${req.params.id}:details`, 600), getBatch);
router.post("/", requireRole("admin"), invalidateCache(['global:batches:list']), handleCreateBatch);
router.put("/:id", requireRole("admin"), invalidateCache(req => ['global:batches:list', `batch:${req.params.id}:*`]), handleUpdateBatch);
router.delete("/:id", requireRole("admin"), invalidateCache(req => ['global:batches:list', `batch:${req.params.id}:*`]), handleDeleteBatch);
router.delete("/:id/permanent", requireRole("admin"), invalidateCache(req => ['global:batches:list', `batch:${req.params.id}:*`]), handlePermanentDeleteBatch);

// Student assignment (Admin only)
router.get("/:id/students", requireRole("admin"), checkCache(req => `batch:${req.params.id}:students`, 600), handleGetBatchStudents);
router.post("/:id/students", requireRole("admin"), invalidateCache(req => [`batch:${req.params.id}:students`, `admin:students:*`]), handleAssignStudent);
router.delete("/:id/students/:studentId", requireRole("admin"), invalidateCache(req => [`batch:${req.params.id}:students`, `admin:students:*`]), handleRemoveStudent);

// Faculty assignment (Admin only)
router.get("/:id/faculty", requireRole("admin"), checkCache(req => `batch:${req.params.id}:faculty`, 600), handleGetBatchFaculty);
router.post("/:id/faculty", requireRole("admin"), invalidateCache(req => [`batch:${req.params.id}:faculty`, `admin:faculty:*`]), handleAssignFaculty);
router.delete("/:id/faculty/:facultyId", requireRole("admin"), invalidateCache(req => [`batch:${req.params.id}:faculty`, `admin:faculty:*`]), handleRemoveFaculty);

// Batch Notifications (Admin and Faculty)
router.post("/:id/notifications", requireAnyRole("admin", "faculty"), handleCreateBatchNotification);

// Batch subject removal (Admin only)
router.delete("/:id/subjects/:subjectId", requireRole("admin"), invalidateCache(req => ['global:batches:list', `batch:${req.params.id}:*`]), handleRemoveBatchSubject);

// Batch timetable upload/delete (Admin only)
router.post("/:id/timetable", requireRole("admin"), invalidateCache(req => ['global:batches:list', `batch:${req.params.id}:*`]), (req, res) => {
    timetableUpload.single("image")(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ message: "Timetable image is too large. Maximum allowed size is 5MB." });
            }
            if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(400).json({ message: "Please upload exactly one image." });
            }
            return res.status(400).json({ message: error.message || "Upload failed." });
        }

        if (error) {
            return res.status(400).json({ message: error.message || "Upload failed." });
        }

        return handleUploadBatchTimetable(req, res);
    });
});
router.delete("/:id/timetable", requireRole("admin"), handleDeleteBatchTimetable);

export default router;
