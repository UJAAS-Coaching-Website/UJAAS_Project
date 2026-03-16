import { Router } from "express";
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
} from "../controllers/batchController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// All batch routes require authentication
router.use(authenticate);

// Batch CRUD (Read-only for all, write for admin)
router.get("/", listBatches);
router.get("/:id", getBatch);
router.post("/", requireRole("admin"), handleCreateBatch);
router.put("/:id", requireRole("admin"), handleUpdateBatch);
router.delete("/:id", requireRole("admin"), handleDeleteBatch);
router.delete("/:id/permanent", requireRole("admin"), handlePermanentDeleteBatch);

// Student assignment (Admin only)
router.get("/:id/students", requireRole("admin"), handleGetBatchStudents);
router.post("/:id/students", requireRole("admin"), handleAssignStudent);
router.delete("/:id/students/:studentId", requireRole("admin"), handleRemoveStudent);

// Faculty assignment (Admin only)
router.get("/:id/faculty", requireRole("admin"), handleGetBatchFaculty);
router.post("/:id/faculty", requireRole("admin"), handleAssignFaculty);
router.delete("/:id/faculty/:facultyId", requireRole("admin"), handleRemoveFaculty);

// Batch Notifications (Admin only)
router.post("/:id/notifications", requireRole("admin"), handleCreateBatchNotification);

// Batch subject removal (Admin only)
router.delete("/:id/subjects/:subjectId", requireRole("admin"), handleRemoveBatchSubject);

export default router;
