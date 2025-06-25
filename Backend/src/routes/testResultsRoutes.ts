import express from 'express';
import testResultsController from '../controllers/testResultsController';
import { verifyToken } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// GET /api/test-results - Lấy tất cả test results (Admin/Manager/Staff có thể xem)
router.get('/', 
  verifyToken, 
  roleMiddleware(['admin', 'manager', 'staff']), 
  testResultsController.getAllTestResults
);

// GET /api/test-results/:id - Lấy test result theo ID (Doctor/Staff có thể xem)
router.get('/:id', 
  verifyToken, 
  roleMiddleware(['doctor', 'nursing_staff', 'staff', 'admin', 'manager']), 
  testResultsController.getTestResultById
);

// POST /api/test-results - Tạo test result mới (Doctor/Nursing Staff/Staff)
router.post('/', 
  verifyToken, 
  roleMiddleware(['doctor', 'nursing_staff', 'staff']), 
  testResultsController.createTestResult
);

// PUT /api/test-results/:id - Cập nhật test result (Doctor/Nursing Staff/Staff)
router.put('/:id', 
  verifyToken, 
  roleMiddleware(['doctor', 'nursing_staff', 'staff']), 
  testResultsController.updateTestResult
);

// DELETE /api/test-results/:id - Xóa test result (Admin/Manager only)
router.delete('/:id', 
  verifyToken, 
  roleMiddleware(['admin', 'manager']), 
  testResultsController.deleteTestResult
);

// GET /api/test-results/appointment/:appointmentId - Lấy test results theo appointment
router.get('/appointment/:appointmentId', 
  verifyToken, 
  roleMiddleware(['doctor', 'nursing_staff', 'staff', 'admin', 'manager', 'customer']), 
  testResultsController.getTestResultsByAppointmentId
);

// GET /api/test-results/profile/:profileId - Lấy test results theo profile (Customer có thể xem của mình)
router.get('/profile/:profileId', 
  verifyToken, 
  roleMiddleware(['doctor', 'nursing_staff', 'staff', 'admin', 'manager', 'customer']), 
  testResultsController.getTestResultsByProfileId
);

// GET /api/test-results/stats/:year/:month - Lấy thống kê test results theo tháng (Admin/Manager/Staff)
router.get('/stats/:year/:month', 
  verifyToken, 
  roleMiddleware(['admin', 'manager', 'staff']), 
  testResultsController.getTestResultStatsByMonth
);

// GET /api/test-results/check/:appointmentId - Kiểm tra test result existence
router.get('/check/:appointmentId', 
  verifyToken, 
  roleMiddleware(['doctor', 'nursing_staff', 'staff', 'admin', 'manager']), 
  testResultsController.checkTestResultsByAppointment
);

export default router; 