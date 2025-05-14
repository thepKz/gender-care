import express from "express";
import {
  getActivePromotions,
  getAllPromotions,
  getPromotionByCode,
  validatePromotion,
  createPromotion,
  updatePromotion,
  deletePromotion
} from "../controllers/promotionController";

const router = express.Router();

// GET /api/promotions - Lấy tất cả khuyến mãi
router.get("/", getAllPromotions);

// GET /api/promotions/active - Lấy khuyến mãi đang hoạt động
router.get("/active", getActivePromotions);

// GET /api/promotions/code/:code - Lấy chi tiết khuyến mãi theo mã
router.get("/code/:code", getPromotionByCode);

// POST /api/promotions/validate - Kiểm tra mã khuyến mãi
router.post("/validate", validatePromotion);

// POST /api/promotions - Tạo khuyến mãi mới
router.post("/", createPromotion);

// PUT /api/promotions/:id - Cập nhật khuyến mãi
router.put("/:id", updatePromotion);

// DELETE /api/promotions/:id - Xóa khuyến mãi
router.delete("/:id", deletePromotion);

export default router; 