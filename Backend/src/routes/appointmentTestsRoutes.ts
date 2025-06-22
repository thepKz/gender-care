import { Router } from 'express';
import appointmentTestsController from '../controllers/appointmentTestsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { requireRole, requireAnyRole } from '../middleware/roleHierarchy';

const router = Router();

// Routes cho AppointmentTests

// GET /api/appointment-tests - Lấy tất cả appointment tests (Staff, Manager, Admin)  
router.get(
  '/',
  authMiddleware,
  requireRole('staff'), // Now admin and manager can access via hierarchy
  appointmentTestsController.getAllAppointmentTests
);

// GET /api/appointment-tests/stats/:year/:month - Thống kê theo tháng (Manager, Admin)
router.get(
  '/stats/:year/:month',
  authMiddleware,
  requireRole('manager'), // Admin can access via hierarchy
  appointmentTestsController.getTestStatsByMonth
);

// GET /api/appointment-tests/appointment/:appointmentId/total-price - Tính tổng giá
router.get(
  '/appointment/:appointmentId/total-price',
  authMiddleware,
  requireAnyRole(['staff', 'customer']), // Staff + hierarchy + customer
  appointmentTestsController.calculateTotalPriceByAppointment
);

// GET /api/appointment-tests/appointment/:appointmentId - Lấy tests theo appointment ID
router.get(
  '/appointment/:appointmentId',
  authMiddleware,
  requireAnyRole(['staff', 'customer']), // Staff + hierarchy + customer
  appointmentTestsController.getAppointmentTestsByAppointmentId
);

// GET /api/appointment-tests/:id - Lấy appointment test theo ID
router.get(
  '/:id',
  authMiddleware,
  requireAnyRole(['staff', 'customer']), // Staff + hierarchy + customer
  appointmentTestsController.getAppointmentTestById
);

// POST /api/appointment-tests - Tạo appointment test mới (Staff, Manager, Admin)
router.post(
  '/',
  authMiddleware,
  requireRole('staff'), // Now manager and admin can create via hierarchy
  appointmentTestsController.createAppointmentTest
);

// PUT /api/appointment-tests/:id - Cập nhật appointment test (Staff, Manager, Admin)
router.put(
  '/:id',
  authMiddleware,
  requireRole('staff'), // Now manager and admin can update via hierarchy
  appointmentTestsController.updateAppointmentTest
);

// DELETE /api/appointment-tests/:id - Xóa appointment test (Manager, Admin)
router.delete(
  '/:id',
  authMiddleware,
  requireRole('manager'), // Admin can delete via hierarchy
  appointmentTestsController.deleteAppointmentTest
);

export default router; 