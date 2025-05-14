import express from "express";
import {
    addToWishlist,
    checkWishlistItem,
    clearWishlist,
    getWishlist,
    removeFromWishlist
} from "../controllers/wishlistController";

const router = express.Router();

// GET /api/wishlists/:userId - Lấy danh sách yêu thích của người dùng
router.get("/:userId", getWishlist);

// GET /api/wishlists/:userId/check/:productId - Kiểm tra sản phẩm có trong danh sách yêu thích không
router.get("/:userId/check/:productId", checkWishlistItem);

// POST /api/wishlists/:userId - Thêm sản phẩm vào danh sách yêu thích
router.post("/:userId", addToWishlist);

// DELETE /api/wishlists/:userId/:itemId - Xóa sản phẩm khỏi danh sách yêu thích
router.delete("/:userId/:itemId", removeFromWishlist);

// DELETE /api/wishlists/:userId - Xóa toàn bộ danh sách yêu thích
router.delete("/:userId", clearWishlist);

export default router; 