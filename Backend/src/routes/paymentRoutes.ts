import express from "express";
import {
    createPayment,
    getAllPayments,
    getPaymentById,
    updatePaymentStatus
} from "../controllers/paymentController";

const router = express.Router();

// GET /api/payments - Lấy tất cả thanh toán (cho admin)
router.get("/", getAllPayments);

// GET /api/payments/:id - Lấy chi tiết thanh toán
router.get("/:id", getPaymentById);

// POST /api/payments - Tạo thanh toán mới
router.post("/", createPayment);

// PUT /api/payments/:id/status - Cập nhật trạng thái thanh toán
router.put("/:id/status", updatePaymentStatus);

export default router; 