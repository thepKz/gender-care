import { Router } from 'express';
import testCategoriesController from '../controllers/testCategoriesController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Routes cho TestCategories

// GET /api/test-categories - Lấy tất cả test categories (Public cho authenticated users)
router.get(
  '/',
  authMiddleware,
  testCategoriesController.getAllTestCategories
);

// GET /api/test-categories/all - Lấy TẤT CẢ test categories không có pagination (BỎ KIỂM TRA ROLE)
router.get(
  '/all',
  authMiddleware,
  testCategoriesController.getAllTestCategoriesWithoutPagination
);

// GET /api/test-categories/dropdown - Lấy test categories cho dropdown (BỎ KIỂM TRA ROLE)
router.get(
  '/dropdown',
  authMiddleware,
  testCategoriesController.getTestCategoriesForDropdown
);

// GET /api/test-categories/:id - Lấy test category theo ID (Authenticated users)
router.get(
  '/:id',
  authMiddleware,
  testCategoriesController.getTestCategoryById
);

// POST /api/test-categories - Tạo test category mới (Admin, Nursing Staff, Doctor, Staff)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'nursing_staff', 'doctor', 'staff']),
  testCategoriesController.createTestCategory
);

// PUT /api/test-categories/:id - Cập nhật test category (Admin, Nursing Staff, Doctor, Staff)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'nursing_staff', 'doctor', 'staff']),
  testCategoriesController.updateTestCategory
);

// DELETE /api/test-categories/:id - Xóa test category (Chỉ Admin)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  testCategoriesController.deleteTestCategory
);

export default router; 