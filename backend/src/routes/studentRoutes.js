import { Router } from "express";
import { checkCache, invalidateCache } from "../middleware/redisCache.js";
import {
    listStudents,
    getStudent,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteStudent,
    handleAssignStudentToBatch,
    handleRemoveStudentFromBatch,
    handleUpdateStudentRating,
} from "../controllers/studentController.js";
import { authenticate, requireRole, requireAnyRole } from "../middleware/auth.js";

const router = Router();

// All student routes require authentication
router.use(authenticate);

// Student CRUD
// GET operations allowed for admin and faculty
router.get("/", requireAnyRole("admin", "faculty"), checkCache(req => `admin:students:query:${JSON.stringify(req.query)}`, 600), listStudents);
router.get("/:id", requireAnyRole("admin", "faculty"), checkCache(req => `admin:students:${req.params.id}`, 1800), getStudent);

// Rating update allowed for admin and faculty
router.put("/:id/rating", requireAnyRole("admin", "faculty"), invalidateCache(req => [`admin:students:*`]), handleUpdateStudentRating);

// Write operations restricted to admin
router.post("/", requireRole("admin"), invalidateCache(['admin:students:*']), handleCreateStudent);
router.put("/:id", requireRole("admin"), invalidateCache(req => [`admin:students:*`, `student:${req.params.id}:*`]), handleUpdateStudent);
router.delete("/:id", requireRole("admin"), invalidateCache(req => [`admin:students:*`, `student:${req.params.id}:*`]), handleDeleteStudent);

// Batch assignment restricted to admin
router.post("/:id/batches", requireRole("admin"), invalidateCache(req => [`admin:students:*`, `student:${req.params.id}:*`, `batch:*`]), handleAssignStudentToBatch);
router.delete("/:id/batches/:batchId", requireRole("admin"), invalidateCache(req => [`admin:students:*`, `student:${req.params.id}:*`, `batch:*`]), handleRemoveStudentFromBatch);

export default router;
