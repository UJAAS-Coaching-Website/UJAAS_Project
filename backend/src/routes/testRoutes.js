import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
    listTests,
    getTest,
    handleCreateTest,
    handleUpdateTestStatus,
    handleDeleteTest,
} from "../controllers/testController.js";

const router = Router();

// Protected routes (admin only)
router.use(authenticate, requireRole("admin"));

router.get("/", listTests);
router.get("/:id", getTest);
router.post("/", handleCreateTest);
router.patch("/:id/status", handleUpdateTestStatus);
router.delete("/:id", handleDeleteTest);

export default router;
