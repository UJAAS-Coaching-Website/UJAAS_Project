import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { listFaculties } from "../controllers/facultyController.js";

const router = Router();

// Protected routes (active admin only)
router.use(authenticate, requireRole("admin"));

// GET /api/faculties
router.get("/", listFaculties);

export default router;
