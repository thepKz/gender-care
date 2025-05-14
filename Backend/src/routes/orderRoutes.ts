import express from "express";
import {
    createOrder,
    getAllOrders,
    getOrderById,
    getUserOrders,
    searchOrders,
    updateOrderStatus
} from "../controllers/orderController";

const router = express.Router();

// GET /api/orders - Lấy tất cả đơn hàng (cho admin)
router.get("/", getAllOrders);

// GET /api/orders/search - Tìm kiếm đơn hàng
router.get("/search", searchOrders);

// GET /api/orders/user/:userId - Lấy đơn hàng của người dùng
router.get("/user/:userId", getUserOrders);

// GET /api/orders/:id - Lấy chi tiết đơn hàng
router.get("/:id", getOrderById);

// POST /api/orders/user/:userId - Tạo đơn hàng mới
router.post("/user/:userId", createOrder);

// PUT /api/orders/:id/status - Cập nhật trạng thái đơn hàng
router.put("/:id/status", updateOrderStatus);

export default router; 