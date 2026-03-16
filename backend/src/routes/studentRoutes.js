import { Router } from "express";
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
router.get("/", requireAnyRole("admin", "faculty"), listStudents);
router.get("/:id", requireAnyRole("admin", "faculty"), getStudent);

// Rating update allowed for admin and faculty
router.put("/:id/rating", requireAnyRole("admin", "faculty"), handleUpdateStudentRating);

// Write operations restricted to admin
router.post("/", requireRole("admin"), handleCreateStudent);
router.put("/:id", requireRole("admin"), handleUpdateStudent);
router.delete("/:id", requireRole("admin"), handleDeleteStudent);

// Batch assignment restricted to admin
router.post("/:id/batches", requireRole("admin"), handleAssignStudentToBatch);
router.delete("/:id/batches/:batchId", requireRole("admin"), handleRemoveStudentFromBatch);

export default router;
