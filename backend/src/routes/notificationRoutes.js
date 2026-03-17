import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { 
    getStudentNotifications, 
    markNotificationRead, 
    deleteNotificationForStudent,
    createMultiBatchNotification 
} from "../services/notificationService.js";

const router = Router();

// Student: Get notifications
router.get("/", authenticate, requireRole("student"), async (req, res) => {
    try {
        const notifications = await getStudentNotifications(req.user.sub);
        res.status(200).json({ status: "success", notifications });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Student: Mark as read
router.put("/:id/read", authenticate, requireRole("student"), async (req, res) => {
    try {
        await markNotificationRead(req.user.sub, req.params.id);
        res.status(200).json({ status: "success" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Student: Delete (hide forever)
router.delete("/:id", authenticate, requireRole("student"), async (req, res) => {
    try {
        await deleteNotificationForStudent(req.user.sub, req.params.id);
        res.status(200).json({ status: "success" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Admin/Faculty: Manual Broadcast
router.post("/broadcast", authenticate, async (req, res) => {
    try {
        const { batchIds, title, message, type = 'notice' } = req.body;
        if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
            return res.status(400).json({ status: "error", message: "At least one batch must be selected." });
        }
        
        await createMultiBatchNotification(batchIds, {
            senderId: req.user.sub,
            type,
            title,
            message
        });
        
        res.status(200).json({ status: "success" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

export default router;
