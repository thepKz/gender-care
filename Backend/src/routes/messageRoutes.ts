import express from "express";
import {
    createMessage,
    deleteMessage,
    getAllMessages,
    getMessageById
} from "../controllers/messageController";

const router = express.Router();

// GET /api/messages - Lấy tất cả tin nhắn
router.get("/", getAllMessages);

// GET /api/messages/:id - Lấy chi tiết tin nhắn
router.get("/:id", getMessageById);

// POST /api/messages - Tạo tin nhắn mới
router.post("/", createMessage);

// DELETE /api/messages/:id - Xóa tin nhắn
router.delete("/:id", deleteMessage);

export default router; 