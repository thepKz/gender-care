import express from "express";
import {
    createCategory,
    deleteCategory,
    getAllCategories,
    getCategoryById,
    updateCategory
} from "../controllers/categoryController";

const router = express.Router();

// GET /api/categories - Lấy tất cả danh mục
router.get("/", getAllCategories);

// GET /api/categories/:id - Lấy chi tiết danh mục
router.get("/:id", getCategoryById);

// POST /api/categories - Tạo danh mục mới
router.post("/", createCategory);

// PUT /api/categories/:id - Cập nhật danh mục
router.put("/:id", updateCategory);

// DELETE /api/categories/:id - Xóa danh mục
router.delete("/:id", deleteCategory);

export default router; 