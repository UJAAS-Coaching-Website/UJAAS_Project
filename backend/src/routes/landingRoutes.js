import { Router } from "express";
import { getPublicLandingData, updateLandingData } from "../controllers/landingController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { checkCache, invalidateCache } from "../middleware/redisCache.js";

const router = Router();

router.get("/", checkCache('public:landing', 3600), getPublicLandingData);
router.put("/", authenticate, requireRole("admin"), invalidateCache(['public:landing']), updateLandingData);

export default router;
