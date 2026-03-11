import { Router } from "express";
import {
    listStudents,
    getStudent,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteStudent,
    handleAssignStudentToBatch,
    handleRemoveStudentFromBatch,
} from "../controllers/studentController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// All student routes require admin authentication
router.use(authenticate, requireRole("admin"));

// Student CRUD
router.get("/", listStudents);
router.get("/:id", getStudent);
router.post("/", handleCreateStudent);
router.put("/:id", handleUpdateStudent);
router.delete("/:id", handleDeleteStudent);

// Batch assignment
router.post("/:id/batches", handleAssignStudentToBatch);
router.delete("/:id/batches/:batchId", handleRemoveStudentFromBatch);

export default router;
