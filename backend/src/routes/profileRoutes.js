import { Router } from "express";
import multer from 'multer';
import { updateProfile, uploadAvatar, deleteAvatar } from "../controllers/profileController.js";
import { authenticate, requireAnyRole } from "../middleware/auth.js";
import { invalidateCache } from "../middleware/redisCache.js";

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

router.put("/me", authenticate, requireAnyRole("student", "faculty", "admin"), invalidateCache(req => [`admin:students:${req.user.sub}`, `admin:students:*`]), updateProfile);
router.post("/avatar", authenticate, upload.single('avatar'), invalidateCache(req => [`admin:students:${req.user.sub}`, `admin:students:*`]), uploadAvatar);
router.delete("/avatar", authenticate, invalidateCache(req => [`admin:students:${req.user.sub}`, `admin:students:*`]), deleteAvatar);

export default router;
