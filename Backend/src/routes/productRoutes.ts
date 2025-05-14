import express from "express";
import {
    createProduct,
    deleteProduct,
    getFeaturedProducts,
    getProductById,
    getProducts,
    searchProducts,
    updateProduct
} from "../controllers/productController";

const router = express.Router();

// GET /api/products - Lấy tất cả sản phẩm
router.get("/", getProducts);

// GET /api/products/search - Tìm kiếm sản phẩm
router.get("/search", searchProducts);

// GET /api/products/featured - Lấy sản phẩm nổi bật
router.get("/featured", getFeaturedProducts);

// GET /api/products/:id - Lấy chi tiết sản phẩm
router.get("/:id", getProductById);

// POST /api/products - Tạo sản phẩm mới
router.post("/", createProduct);

// PUT /api/products/:id - Cập nhật sản phẩm
router.put("/:id", updateProduct);

// DELETE /api/products/:id - Xóa sản phẩm
router.delete("/:id", deleteProduct);

export default router; 