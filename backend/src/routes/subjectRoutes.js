import { Router } from "express";
import { handleDeleteSubjectGlobal, handleListSubjects } from "../controllers/subjectController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { checkCache, invalidateCache } from "../middleware/redisCache.js";

const router = Router();

router.use(authenticate, requireRole("admin"));

router.get("/", checkCache('subjects:list', 3600), handleListSubjects);
router.delete("/:id", invalidateCache(['subjects:list']), handleDeleteSubjectGlobal);

export default router;
