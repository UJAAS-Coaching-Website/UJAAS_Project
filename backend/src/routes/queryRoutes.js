import { Router } from "express";
import { listQueries, submitQuery, patchQueryStatus } from "../controllers/queryController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, requireRole("admin"), listQueries);
router.post("/", submitQuery);
router.patch("/:id", authenticate, requireRole("admin"), patchQueryStatus);

export default router;
