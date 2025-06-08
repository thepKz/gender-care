import { Router } from 'express';
import appointmentTestsController from '../controllers/appointmentTestsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Routes cho AppointmentTests

// GET /api/appointment-tests - Lấy tất cả appointment tests (Admin, Doctor, Nursing Staff)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff']),
  appointmentTestsController.getAllAppointmentTests
);

// GET /api/appointment-tests/stats/:year/:month - Thống kê theo tháng (Admin, Manager)
router.get(
  '/stats/:year/:month',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  appointmentTestsController.getTestStatsByMonth
);

// GET /api/appointment-tests/appointment/:appointmentId/total-price - Tính tổng giá
router.get(
  '/appointment/:appointmentId/total-price',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'customer']),
  appointmentTestsController.calculateTotalPriceByAppointment
);

// GET /api/appointment-tests/appointment/:appointmentId - Lấy tests theo appointment ID
router.get(
  '/appointment/:appointmentId',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'customer']),
  appointmentTestsController.getAppointmentTestsByAppointmentId
);

// GET /api/appointment-tests/:id - Lấy appointment test theo ID
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'doctor', 'nursing_staff', 'customer']),
  appointmentTestsController.getAppointmentTestById
);

// POST /api/appointment-tests - Tạo appointment test mới (Doctor, Nursing Staff)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  appointmentTestsController.createAppointmentTest
);

// PUT /api/appointment-tests/:id - Cập nhật appointment test (Doctor, Nursing Staff)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['doctor', 'nursing_staff']),
  appointmentTestsController.updateAppointmentTest
);

// DELETE /api/appointment-tests/:id - Xóa appointment test (Doctor, Admin)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['doctor', 'admin']),
  appointmentTestsController.deleteAppointmentTest
);

export default router; 