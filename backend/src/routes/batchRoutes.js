import { Router } from "express";
import {
    listBatches,
    getBatch,
    handleCreateBatch,
    handleUpdateBatch,
    handleDeleteBatch,
    handleAssignStudent,
    handleRemoveStudent,
    handleAssignFaculty,
    handleRemoveFaculty,
    handleGetBatchStudents,
    handleGetBatchFaculty,
} from "../controllers/batchController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// All batch routes require admin authentication
router.use(authenticate, requireRole("admin"));

// Batch CRUD
router.get("/", listBatches);
router.get("/:id", getBatch);
router.post("/", handleCreateBatch);
router.put("/:id", handleUpdateBatch);
router.delete("/:id", handleDeleteBatch);

// Student assignment
router.get("/:id/students", handleGetBatchStudents);
router.post("/:id/students", handleAssignStudent);
router.delete("/:id/students/:studentId", handleRemoveStudent);

// Faculty assignment
router.get("/:id/faculty", handleGetBatchFaculty);
router.post("/:id/faculty", handleAssignFaculty);
router.delete("/:id/faculty/:facultyId", handleRemoveFaculty);

export default router;
