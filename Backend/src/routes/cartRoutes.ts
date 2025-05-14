import express from "express";
import {
    addToCart,
    clearCart,
    getCart,
    removeCartItem,
    updateCartItem
} from "../controllers/cartController";

const router = express.Router();

// GET /api/carts/:userId - Lấy giỏ hàng của người dùng
router.get("/:userId", getCart);

// POST /api/carts/:userId/items - Thêm sản phẩm vào giỏ hàng
router.post("/:userId/items", addToCart);

// PUT /api/carts/:userId/items/:itemId - Cập nhật số lượng sản phẩm trong giỏ hàng
router.put("/:userId/items/:itemId", updateCartItem);

// DELETE /api/carts/:userId/items/:itemId - Xóa sản phẩm khỏi giỏ hàng
router.delete("/:userId/items/:itemId", removeCartItem);

// DELETE /api/carts/:userId - Xóa toàn bộ giỏ hàng
router.delete("/:userId", clearCart);

export default router; 