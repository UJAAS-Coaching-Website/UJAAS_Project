import { Router } from "express";
import { checkCache, invalidateCache } from "../middleware/redisCache.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { listFaculties, handleCreateFaculty, handleUpdateFaculty, handleDeleteFaculty } from "../controllers/facultyController.js";

const router = Router();

// Protected routes (active admin only)
router.use(authenticate, requireRole("admin"));

// Faculty CRUD
// Faculty CRUD
router.get("/", checkCache('admin:faculty:list', 3600), listFaculties);
router.post("/", invalidateCache(['admin:faculty:list']), handleCreateFaculty);
router.put("/:id", invalidateCache(req => ['admin:faculty:list', `admin:faculty:${req.params.id}`]), handleUpdateFaculty);
router.delete("/:id", invalidateCache(req => ['admin:faculty:list', `admin:faculty:${req.params.id}`]), handleDeleteFaculty);

export default router;
