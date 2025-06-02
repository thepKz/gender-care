import express from "express";
import {
    getAppointments,
    createAppointment,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus
} from "../controllers/appointmentController";
import { verifyToken } from "../middleware/auth";

const router = express.Router();

// Tất cả appointment routes đều cần authentication
router.use(verifyToken);

// GET /appointments - Lấy danh sách cuộc hẹn của user
router.get("/", getAppointments);

// POST /appointments - Đặt lịch hẹn mới
router.post("/", createAppointment);

// GET /appointments/:id - Lấy chi tiết cuộc hẹn
router.get("/:id", getAppointmentById);

// PUT /appointments/:id - Cập nhật cuộc hẹn
router.put("/:id", updateAppointment);

// DELETE /appointments/:id - Hủy cuộc hẹn
router.delete("/:id", deleteAppointment);

// PUT /appointments/:id/status - Thay đổi trạng thái cuộc hẹn (staff/doctor only)
router.put("/:id/status", updateAppointmentStatus);

export default router; 