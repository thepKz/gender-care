import { Router } from 'express';
import testResultsController from '../controllers/testResultsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Routes cho TestResults

// GET /api/test-results - Lấy tất cả test results (Admin, Doctor, Nursing Staff)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff']),
  testResultsController.getAllTestResults
);

// GET /api/test-results/stats/:year/:month - Thống kê theo tháng (Admin, Manager)
router.get(
  '/stats/:year/:month',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  testResultsController.getTestResultStatsByMonth
);

// GET /api/test-results/appointment-test/:appointmentTestId - Lấy test results theo appointment test ID
router.get(
  '/appointment-test/:appointmentTestId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff']),
  testResultsController.getTestResultsByAppointmentTestId
);

// GET /api/test-results/customer/:customerId - Lấy test results theo customer ID
router.get(
  '/customer/:customerId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'customer']),
  testResultsController.getTestResultsByCustomerId
);

// GET /api/test-results/:id - Lấy test result theo ID
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'customer']),
  testResultsController.getTestResultById
);

// POST /api/test-results - Tạo test result mới (Doctor, Nursing Staff)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  testResultsController.createTestResult
);

// PUT /api/test-results/:id - Cập nhật test result (Doctor, Nursing Staff)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  testResultsController.updateTestResult
);

// DELETE /api/test-results/:id - Xóa test result (Doctor, Admin)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['doctor', 'admin']),
  testResultsController.deleteTestResult
);

export default router; 