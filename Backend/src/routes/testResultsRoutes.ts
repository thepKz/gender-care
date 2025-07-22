import express from 'express';
import testResultsController from '../controllers/testResultsController';
import { verifyToken } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// GET /api/test-results - Lấy tất cả test results (BỎ KIỂM TRA ROLE)
router.get('/', 
  verifyToken, 
  testResultsController.getAllTestResults
);

// GET /api/test-results/:id - Lấy test result theo ID (BỎ KIỂM TRA ROLE)
router.get('/:id', 
  verifyToken, 
  testResultsController.getTestResultById
);

// POST /api/test-results - Tạo test result mới (Doctor/Nursing Staff/Staff)
router.post('/', 
  verifyToken, 
  roleMiddleware(['doctor', 'manager', 'staff']), 
  testResultsController.createTestResult
);

// PUT /api/test-results/:id - Cập nhật test result (Doctor/Nursing Staff/Staff)
router.put('/:id', 
  verifyToken, 
  roleMiddleware(['doctor', 'manager', 'staff']), 
  testResultsController.updateTestResult
);

// DELETE /api/test-results/:id - Xóa test result (Admin/Manager only)
router.delete('/:id', 
  verifyToken, 
  roleMiddleware(['admin', 'manager']), 
  testResultsController.deleteTestResult
);

// GET /api/test-results/appointment/:appointmentId - Lấy test results theo appointment (BỎ KIỂM TRA ROLE)
router.get('/appointment/:appointmentId', 
  verifyToken, 
  testResultsController.getTestResultsByAppointmentId
);

// GET /api/test-results/profile/:profileId - Lấy test results theo profile (BỎ KIỂM TRA ROLE)
router.get('/profile/:profileId', 
  verifyToken, 
  testResultsController.getTestResultsByProfileId
);

// GET /api/test-results/stats/:year/:month - Lấy thống kê test results theo tháng (BỎ KIỂM TRA ROLE)
router.get('/stats/:year/:month', 
  verifyToken, 
  testResultsController.getTestResultStatsByMonth
);

// GET /api/test-results/check/:appointmentId - Kiểm tra test result existence (BỎ KIỂM TRA ROLE)
router.get('/check/:appointmentId', 
  verifyToken, 
  testResultsController.checkTestResultsByAppointment
);

export default router; 