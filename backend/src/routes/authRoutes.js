import { Router } from "express";
import { login, me, refresh, logout } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.get("/me", authenticate, me);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
