import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { 
    getStudentNotifications, 
    markNotificationRead, 
    deleteNotificationForStudent,
    createMultiBatchNotification,
    getNoticesForSender,
    updateNoticeForSender,
    deleteNoticeForSender
} from "../services/notificationService.js";
import { requireAnyRole } from "../middleware/auth.js";

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

// Admin/Faculty: List own notices
router.get("/mine", authenticate, requireAnyRole("admin", "faculty"), async (req, res) => {
    try {
        const notices = await getNoticesForSender(req.user.sub);
        res.status(200).json({ status: "success", notices });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Admin/Faculty: Update own notice
router.put("/mine/:id", authenticate, requireAnyRole("admin", "faculty"), async (req, res) => {
    try {
        const { title, message, batchIds } = req.body;
        if (!title || !message) {
            return res.status(400).json({ status: "error", message: "title and message are required" });
        }
        if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
            return res.status(400).json({ status: "error", message: "At least one batch must be selected." });
        }
        const updated = await updateNoticeForSender(req.params.id, req.user.sub, { title, message, batchIds });
        if (!updated) {
            return res.status(404).json({ status: "error", message: "notice not found" });
        }
        res.status(200).json({ status: "success" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Admin/Faculty: Delete own notice
router.delete("/mine/:id", authenticate, requireAnyRole("admin", "faculty"), async (req, res) => {
    try {
        const deleted = await deleteNoticeForSender(req.params.id, req.user.sub);
        if (!deleted) {
            return res.status(404).json({ status: "error", message: "notice not found" });
        }
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
