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
  roleMiddleware(['doctor', 'nursing_staff', 'staff']),
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

// POST /api/test-result-items/auto-evaluate - Tạo test result item với auto-evaluation (Doctor, Nursing Staff)
router.post(
  '/auto-evaluate',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  testResultItemsController.createTestResultItemWithAutoEvaluation
);

// POST /api/test-result-items/bulk-auto-evaluate - Tạo nhiều test result items với auto-evaluation (Doctor, Nursing Staff)
router.post(
  '/bulk-auto-evaluate',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  testResultItemsController.createMultipleTestResultItemsWithAutoEvaluation
);

// GET /api/test-result-items/template/:serviceId - Lấy template cho việc nhập kết quả xét nghiệm (Doctor, Nursing Staff)
router.get(
  '/template/:serviceId',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  testResultItemsController.getTestResultTemplateForService
);

// POST /api/test-result-items/evaluate-value - Auto-evaluate một giá trị (Doctor, Nursing Staff)
router.post(
  '/evaluate-value',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  testResultItemsController.autoEvaluateValue
);

export default router; 