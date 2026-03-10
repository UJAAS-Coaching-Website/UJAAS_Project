import { Router } from "express";
import { updateProfile } from "../controllers/profileController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.put("/me", authenticate, requireRole("student"), updateProfile);

export default router;
