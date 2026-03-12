import { Router } from "express";
import { authenticate, requireRole, requireAnyRole } from "../middleware/auth.js";
import {
    listTests,
    getTest,
    handleCreateTest,
    handleUpdateTestStatus,
    handleDeleteTest,
    handleUpdateTest
} from "../controllers/testController.js";

const router = Router();

// Allow read access for both admins and faculty
router.get("/", authenticate, requireAnyRole("admin", "faculty"), listTests);
router.get("/:id", authenticate, requireAnyRole("admin", "faculty"), getTest);

// Modification routes strictly for admin
router.post("/", authenticate, requireRole("admin"), handleCreateTest);
router.put("/:id", authenticate, requireRole("admin"), handleUpdateTest);
router.patch("/:id/status", authenticate, requireRole("admin"), handleUpdateTestStatus);
router.delete("/:id", authenticate, requireRole("admin"), handleDeleteTest);

export default router;
