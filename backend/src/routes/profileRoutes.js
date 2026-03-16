import { Router } from "express";
import multer from 'multer';
import { updateProfile, uploadAvatar } from "../controllers/profileController.js";
import { authenticate, requireAnyRole } from "../middleware/auth.js";

const router = Router();

const ALLOWED_IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
]);

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB max for original upload
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error('Unsupported image format. Allowed formats: JPG, PNG, WEBP.'));
    }
});

router.put("/me", authenticate, requireAnyRole("student", "faculty", "admin"), updateProfile);
router.post("/avatar", authenticate, upload.single('avatar'), uploadAvatar);

export default router;
