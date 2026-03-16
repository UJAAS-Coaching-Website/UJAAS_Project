import { Router } from "express";
import { login, me, refresh, logout, adminResetPassword, changePassword } from "../controllers/authController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.get("/me", authenticate, me);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/change-password", authenticate, changePassword);
router.post("/admin/reset-password", authenticate, requireRole("admin"), adminResetPassword);

export default router;
