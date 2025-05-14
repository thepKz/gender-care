import express from "express";
import {
    createNotification,
    deleteNotification,
    getUserNotifications,
    markAllAsRead,
    markAsRead
} from "../controllers/notificationController";

const router = express.Router();

// GET /api/notifications/user/:userId - Lấy thông báo của người dùng
router.get("/user/:userId", getUserNotifications);

// PUT /api/notifications/:id/read - Đánh dấu thông báo đã đọc
router.put("/:id/read", markAsRead);

// PUT /api/notifications/user/:userId/read-all - Đánh dấu tất cả thông báo đã đọc
router.put("/user/:userId/read-all", markAllAsRead);

// POST /api/notifications - Tạo thông báo mới
router.post("/", createNotification);

// DELETE /api/notifications/:id - Xóa thông báo
router.delete("/:id", deleteNotification);

export default router; 