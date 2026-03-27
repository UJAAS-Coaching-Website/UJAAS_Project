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

function getProfileCacheKeys(req) {
    const userId = req.user?.sub;
    const role = req.user?.role;

    const keys = [
        `admin:students:${userId}`,
        "admin:students:query:*",
        "admin:students:*",
        "batch:*:students",
    ];

    if (role === "faculty") {
        keys.push(
            `admin:faculty:${userId}`,
            "admin:faculty:list",
            "admin:faculty:*",
            "batch:*:faculty"
        );
    }

    return keys;
}

router.put("/me", authenticate, requireAnyRole("student", "faculty", "admin"), invalidateCache(getProfileCacheKeys), updateProfile);
router.post("/avatar", authenticate, upload.single('avatar'), invalidateCache(getProfileCacheKeys), uploadAvatar);
router.delete("/avatar", authenticate, invalidateCache(getProfileCacheKeys), deleteAvatar);

export default router;
