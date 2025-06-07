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

// GET /api/test-categories/dropdown - Lấy test categories cho dropdown (Doctor và Nursing Staff)
router.get(
  '/dropdown',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff', 'admin']),
  testCategoriesController.getTestCategoriesForDropdown
);

// GET /api/test-categories/:id - Lấy test category theo ID (Authenticated users)
router.get(
  '/:id',
  authMiddleware,
  testCategoriesController.getTestCategoryById
);

// POST /api/test-categories - Tạo test category mới (Chỉ Admin và Nursing Staff)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'nursing_staff']),
  testCategoriesController.createTestCategory
);

// PUT /api/test-categories/:id - Cập nhật test category (Chỉ Admin và Nursing Staff)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'nursing_staff']),
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