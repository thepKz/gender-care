import { Router } from 'express';
import * as doctorController from '../controllers/doctorController';
import * as doctorScheduleController from '../controllers/doctorScheduleController';
import { verifyToken, verifyAdmin, verifyStaff } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { requireRole } from '../middleware/roleHierarchy';
import multer from 'multer';

const router = Router();

// ✅ Setup multer cho file upload
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// ===== BASIC DOCTOR CRUD ROUTES =====

// Xem danh sách bác sĩ - tất cả mọi người đều được phép (kể cả guest)
router.get('/', doctorController.getAll);

// ===== STATIC ROUTES FIRST (tránh conflict với /:id) =====

// 🆕 STAFF/MANAGER/ADMIN: Upload doctor image với enhanced validation - Now with hierarchy
router.post('/upload-image', verifyToken, requireRole('staff'), upload.single('image'), doctorController.uploadDoctorImage);

// 🆕 STAFF/MANAGER/ADMIN: Lấy tất cả bác sĩ với feedback + status details - Now with hierarchy
router.get('/details/all', verifyToken, requireRole('staff'), doctorController.getAllWithDetails);

// PUBLIC: Xem thông tin cơ bản bác sĩ (không cần authentication)
router.get('/:id/public', doctorController.getPublicById);

// PUBLIC: Tìm tất cả bác sĩ có lịch trống theo ngày/timeSlot (chỉ Free status)
router.get('/available', doctorScheduleController.getAvailableDoctors);

// PUBLIC: Lấy tất cả lịch làm việc của tất cả bác sĩ (chỉ Free status)
router.get('/schedules/all', doctorScheduleController.getAllDoctorsSchedules);

// DEBUG: Test schedule creation logic (PUBLIC cho dễ test)
router.get('/debug/schedule-logic', doctorScheduleController.debugScheduleCreation);

// ===== DYNAMIC ROUTES WITH :id =====

// Xem thông tin chi tiết bác sĩ theo ID - STAFF/MANAGER/ADMIN - Now with hierarchy
router.get('/:id', verifyToken, requireRole('staff'), doctorController.getById);

// 🆕 STAFF/MANAGER/ADMIN: Lấy thông tin bác sĩ với feedback + status details - Now with hierarchy
router.get('/:id/details', verifyToken, requireRole('staff'), doctorController.getByIdWithDetails);

// 🆕 PUBLIC/STAFF: Lấy chỉ feedback của doctor  
router.get('/:id/feedbacks', doctorController.getDoctorFeedbacks);

// 🆕 STAFF/MANAGER/ADMIN: Lấy chỉ trạng thái của doctor - Now with hierarchy
router.get('/:id/status', verifyToken, requireRole('staff'), doctorController.getDoctorStatus);

// 🆕 MANAGER/ADMIN: Cập nhật trạng thái active/inactive của doctor - Already uses roleMiddleware
router.put('/:id/status', verifyToken, roleMiddleware(['manager', 'admin']), doctorController.updateDoctorStatus);

// Tạo bác sĩ mới - chỉ admin và manager được phép (không bao gồm staff)
router.post('/', verifyToken, roleMiddleware(['admin', 'manager']), doctorController.create);

// Cập nhật thông tin bác sĩ - STAFF/MANAGER/ADMIN - Now with hierarchy
router.put('/:id', verifyToken, requireRole('staff'), doctorController.update);

// Xóa bác sĩ - chỉ admin và manager được phép (không bao gồm staff - high risk operation)
router.delete('/:id', verifyToken, roleMiddleware(['admin', 'manager']), doctorController.remove);

// ===== DOCTOR SCHEDULE ROUTES =====

// ===== PUBLIC ROUTES (không cần xác thực) =====

// PUBLIC: Lấy tất cả lịch làm việc của tất cả bác sĩ (chỉ Free status)
router.get('/schedules/all', doctorScheduleController.getAllDoctorsSchedules);

// STAFF/MANAGER/ADMIN: Lấy tất cả lịch làm việc của tất cả bác sĩ (tất cả status) - Now with hierarchy
router.get('/schedules/all/staff', verifyToken, requireRole('staff'), doctorScheduleController.getAllDoctorsSchedulesForStaff);

// PUBLIC: Tìm tất cả bác sĩ có lịch trống theo ngày/timeSlot (chỉ Free status)
router.get('/available', doctorScheduleController.getAvailableDoctors);

// STAFF/MANAGER/ADMIN: Tìm tất cả bác sĩ và slots theo ngày (tất cả status) - Now with hierarchy
router.get('/available/staff', verifyToken, requireRole('staff'), doctorScheduleController.getAvailableDoctorsForStaff);

// DEBUG: Test schedule creation logic (PUBLIC cho dễ test)
router.get('/debug/schedule-logic', doctorScheduleController.debugScheduleCreation);

// DEBUG: Real test cho thứ 6 - tạo lịch thật để verify
router.post('/:id/debug/test-friday', doctorScheduleController.realTestFridaySchedule);

// PUBLIC: Xem lịch bác sĩ (chỉ Free status - để customer chọn doctor)
router.get('/:id/schedules', doctorScheduleController.getDoctorSchedules);

// PUBLIC: Xem slots trống theo ngày (chỉ Free status - để customer chọn giờ)  
router.get('/:id/available-slots', doctorScheduleController.getAvailableSlots);

// STAFF/MANAGER/ADMIN: Xem tất cả lịch bác sĩ (tất cả status) - Now with hierarchy
router.get('/:id/schedules/staff', verifyToken, requireRole('staff'), doctorScheduleController.getDoctorSchedulesForStaff);

// STAFF/MANAGER/ADMIN: Xem tất cả slots theo ngày (tất cả status) - Now with hierarchy
router.get('/:id/available-slots/staff', verifyToken, requireRole('staff'), doctorScheduleController.getAvailableSlotsForStaff);

// STAFF/MANAGER/ADMIN: Lấy thống kê tất cả bác sĩ - Now with hierarchy
router.get('/statistics/all', verifyToken, requireRole('staff'), doctorScheduleController.getAllDoctorsStatistics);

// STAFF/MANAGER/ADMIN: Lấy thống kê bác sĩ - Now with hierarchy
router.get('/:id/statistics', verifyToken, requireRole('staff'), doctorScheduleController.getDoctorStatistics);

// MANAGER/ADMIN: Book slot cho customer (khi có cuộc gọi đặt lịch) - Admin can now access via hierarchy
router.post('/:id/book-slot', verifyToken, requireRole('manager'), doctorScheduleController.bookSlotForCustomer);

// STAFF/MANAGER/ADMIN: Tạo lịch cho bác sĩ - Now with hierarchy
router.post('/:id/schedules', verifyToken, requireRole('staff'), doctorScheduleController.createDoctorSchedule);

// STAFF/MANAGER/ADMIN: Tạo lịch hàng loạt cho bác sĩ - Now with hierarchy
router.post('/:id/schedules/bulk', verifyToken, requireRole('staff'), doctorScheduleController.createBulkDoctorSchedule);

// MANAGER/ADMIN: Tạo lịch hàng loạt cho nhiều ngày - Admin can now access via hierarchy
router.post('/:id/schedules/bulk-days', verifyToken, requireRole('manager'), doctorScheduleController.createBulkDoctorScheduleForDays);

// MANAGER/ADMIN: Tạo lịch hàng loạt cho cả tháng - Admin can now access via hierarchy
router.post('/:id/schedules/bulk-month', verifyToken, requireRole('manager'), doctorScheduleController.createBulkDoctorScheduleForMonth);

// STAFF/MANAGER/ADMIN: Cập nhật booking status - Now with hierarchy
router.put('/:id/schedules', verifyToken, requireRole('staff'), doctorScheduleController.updateDoctorSchedule);

// MANAGER/ADMIN: Xóa lịch bác sĩ - Admin can now access via hierarchy
router.delete('/:id/schedules/:scheduleId', verifyToken, requireRole('manager'), doctorScheduleController.deleteDoctorSchedule);

export default router;

