import { Router } from 'express';
import testResultItemsController from '../controllers/testResultItemsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Routes cho TestResultItems

// GET /api/test-result-items - Lấy tất cả test result items (Doctor, Nursing Staff)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff']),
  testResultItemsController.getAllTestResultItems
);

// GET /api/test-result-items/summary/:testResultId - Lấy summary theo test result
router.get(
  '/summary/:testResultId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff']),
  testResultItemsController.getTestResultItemsSummary
);

// GET /api/test-result-items/test-result/:testResultId - Lấy items theo test result ID
router.get(
  '/test-result/:testResultId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'customer']),
  testResultItemsController.getTestResultItemsByTestResultId
);

// GET /api/test-result-items/:id - Lấy test result item theo ID
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'customer']),
  testResultItemsController.getTestResultItemById
);

// POST /api/test-result-items/bulk - Tạo nhiều test result items cùng lúc (Doctor, Nursing Staff)
router.post(
  '/bulk',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  testResultItemsController.createMultipleTestResultItems
);

// POST /api/test-result-items - Tạo test result item mới (Doctor, Nursing Staff)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  testResultItemsController.createTestResultItem
);

// PUT /api/test-result-items/:id - Cập nhật test result item (Doctor, Nursing Staff)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  testResultItemsController.updateTestResultItem
);

// DELETE /api/test-result-items/:id - Xóa test result item (Doctor, Nursing Staff)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  testResultItemsController.deleteTestResultItem
);

export default router; 