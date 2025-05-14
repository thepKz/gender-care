import express from "express";
import {
    createReview,
    deleteReview,
    getProductReviews,
    getUserReviews,
    searchReviews,
    updateReview
} from "../controllers/reviewController";

const router = express.Router();

// GET /api/reviews/product/:productId - Lấy đánh giá cho một sản phẩm
router.get("/product/:productId", getProductReviews);

// GET /api/reviews/user/:userId - Lấy tất cả đánh giá của một người dùng
router.get("/user/:userId", getUserReviews);

// GET /api/reviews/search - Tìm kiếm đánh giá
router.get("/search", searchReviews);

// POST /api/reviews - Tạo đánh giá mới
router.post("/", createReview);

// PUT /api/reviews/:id - Cập nhật đánh giá
router.put("/:id", updateReview);

// DELETE /api/reviews/:id - Xóa đánh giá
router.delete("/:id", deleteReview);

export default router; 