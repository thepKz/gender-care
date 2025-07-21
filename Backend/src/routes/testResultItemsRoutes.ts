import { Router } from 'express';
import testResultItemsController from '../controllers/testResultItemsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Routes cho TestResultItems

// GET /api/test-result-items - Lấy tất cả test result items (Doctor, Nursing Staff, Staff)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'manager', 'staff']),
  testResultItemsController.getAllTestResultItems
);

// GET /api/test-result-items/summary/:appointmentId - Lấy summary theo appointment
router.get(
  '/summary/:appointmentId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'manager', 'staff']),
  testResultItemsController.getTestResultItemsSummary
);

// GET /api/test-result-items/appointment/:appointmentId - Lấy items theo appointment ID
router.get(
  '/appointment/:appointmentId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'manager', 'staff', 'customer']),
  testResultItemsController.getTestResultItemsByAppointmentId
);

// POST /api/test-result-items/bulk - Tạo nhiều test result items cùng lúc (Doctor, Nursing Staff, Staff)
router.post(
  '/bulk',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'manager', 'staff']),
  testResultItemsController.createMultipleTestResultItems
);

// POST /api/test-result-items - Tạo test result item mới (Doctor, Nursing Staff, Staff)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'manager', 'staff']),
  testResultItemsController.createTestResultItem
);

// PUT /api/test-result-items/:appointmentId/:testCategoryId - Cập nhật test result item theo appointmentId và testCategoryId
router.put(
  '/:appointmentId/:testCategoryId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'manager', 'staff']),
  testResultItemsController.updateTestResultItemByCategory
);

// GET /api/test-result-items/template/:serviceId - Lấy template cho việc nhập kết quả xét nghiệm (Doctor, Nursing Staff, Staff)
router.get(
  '/template/:serviceId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'manager', 'staff']),
  testResultItemsController.getTestResultTemplateForService
);

export default router; 