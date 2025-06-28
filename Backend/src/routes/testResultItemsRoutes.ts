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
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'staff']),
  testResultItemsController.getAllTestResultItems
);

// GET /api/test-result-items/summary/:appointmentId - Lấy summary theo appointment
router.get(
  '/summary/:appointmentId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'staff']),
  testResultItemsController.getTestResultItemsSummary
);

// GET /api/test-result-items/appointment/:appointmentId - Lấy items theo appointment ID
router.get(
  '/appointment/:appointmentId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'staff', 'customer']),
  testResultItemsController.getTestResultItemsByAppointmentId
);

// GET /api/test-result-items/:id - Lấy test result item theo ID
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'staff', 'customer']),
  testResultItemsController.getTestResultItemById
);

// POST /api/test-result-items/bulk - Tạo nhiều test result items cùng lúc (Doctor, Nursing Staff, Staff)
router.post(
  '/bulk',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'staff']),
  testResultItemsController.createMultipleTestResultItems
);

// POST /api/test-result-items - Tạo test result item mới (Doctor, Nursing Staff, Staff)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'staff']),
  testResultItemsController.createTestResultItem
);

// PUT /api/test-result-items/:id - Cập nhật test result item (Doctor, Nursing Staff, Staff)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'staff']),
  testResultItemsController.updateTestResultItem
);

// DELETE /api/test-result-items/:id - Xóa test result item (Doctor, Nursing Staff, Staff)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'staff']),
  testResultItemsController.deleteTestResultItem
);

// GET /api/test-result-items/template/:serviceId - Lấy template cho việc nhập kết quả xét nghiệm (Doctor, Nursing Staff, Staff)
router.get(
  '/template/:serviceId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'staff']),
  testResultItemsController.getTestResultTemplateForService
);

export default router; 