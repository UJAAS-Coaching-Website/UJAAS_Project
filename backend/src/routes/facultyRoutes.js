import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { listFaculties, handleCreateFaculty, handleUpdateFaculty, handleDeleteFaculty } from "../controllers/facultyController.js";

const router = Router();

// Protected routes (active admin only)
router.use(authenticate, requireRole("admin"));

// Faculty CRUD
router.get("/", listFaculties);
router.post("/", handleCreateFaculty);
router.put("/:id", handleUpdateFaculty);
router.delete("/:id", handleDeleteFaculty);

export default router;
