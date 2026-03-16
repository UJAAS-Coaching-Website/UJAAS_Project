import { Router } from "express";
import { handleDeleteSubjectGlobal, handleListSubjects } from "../controllers/subjectController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate, requireRole("admin"));

router.get("/", handleListSubjects);
router.delete("/:id", handleDeleteSubjectGlobal);

export default router;
