import { Router } from "express";
import { getPublicLandingData, updateLandingData } from "../controllers/landingController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", getPublicLandingData);
router.put("/", authenticate, requireRole("admin"), updateLandingData);

export default router;
