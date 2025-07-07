import { Router } from 'express';
import serviceTestCategoriesController from '../controllers/serviceTestCategoriesController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Routes cho ServiceTestCategories

// GET /api/service-test-categories/service/:serviceId - Lấy test categories cho service (BỎ KIỂM TRA ROLE)
router.get(
  '/service/:serviceId',
  authMiddleware,
  serviceTestCategoriesController.getTestCategoriesByServiceId
);

// GET /api/service-test-categories - Lấy tất cả service test categories (BỎ KIỂM TRA ROLE)
router.get(
  '/',
  authMiddleware,
  serviceTestCategoriesController.getAllServiceTestCategories
);

// POST /api/service-test-categories - Gán test category cho service (Doctor, Staff, Admin)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['doctor', 'staff', 'admin']),
  serviceTestCategoriesController.assignTestCategoryToService
);

// POST /api/service-test-categories/bulk - Gán nhiều test categories cho service (Doctor, Staff, Admin)
router.post(
  '/bulk',
  authMiddleware,
  roleMiddleware(['doctor', 'staff', 'admin']),
  serviceTestCategoriesController.assignMultipleTestCategoriesToService
);

// PUT /api/service-test-categories/:id - Cập nhật service test category (Doctor, Staff, Admin)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['doctor', 'staff', 'admin']),
  serviceTestCategoriesController.updateServiceTestCategory
);

// DELETE /api/service-test-categories/:id - Xóa test category khỏi service (Doctor, Staff, Admin)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['doctor', 'staff', 'admin']),
  serviceTestCategoriesController.removeTestCategoryFromService
);

// DELETE /api/service-test-categories/service/:serviceId - Xóa tất cả test categories của service (Admin only)
router.delete(
  '/service/:serviceId',
  authMiddleware,
  roleMiddleware(['admin']),
  serviceTestCategoriesController.removeAllTestCategoriesFromService
);

export default router; 