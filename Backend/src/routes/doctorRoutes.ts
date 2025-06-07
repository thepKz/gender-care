import { Router } from 'express';
import * as doctorController from '../controllers/doctorController';
import * as doctorScheduleController from '../controllers/doctorScheduleController';
import { verifyToken, verifyAdmin, verifyStaff } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// ===== BASIC DOCTOR CRUD ROUTES =====

// Xem danh sách bác sĩ - tất cả mọi người đều được phép (kể cả guest)
router.get('/', doctorController.getAll);

// Xem thông tin chi tiết bác sĩ theo ID - chỉ staff/admin được phép (bao gồm contact info)
router.get('/:id', verifyToken, verifyStaff, doctorController.getById);

// Tạo bác sĩ mới - chỉ admin được phép (high privilege operation)
router.post('/', verifyToken, verifyAdmin, doctorController.create);

// Cập nhật thông tin bác sĩ - staff/admin được phép
router.put('/:id', verifyToken, verifyStaff, doctorController.update);

// Xóa bác sĩ - chỉ admin được phép (high risk operation)
router.delete('/:id', verifyToken, verifyAdmin, doctorController.remove);

// ===== DOCTOR SCHEDULE ROUTES =====

// ===== PUBLIC ROUTES (không cần xác thực) =====

// PUBLIC: Lấy tất cả lịch làm việc của tất cả bác sĩ (chỉ Free status)
router.get('/schedules/all', doctorScheduleController.getAllDoctorsSchedules);

// PUBLIC: Tìm tất cả bác sĩ có lịch trống theo ngày/timeSlot (chỉ Free status)
router.get('/available', doctorScheduleController.getAvailableDoctors);

// DEBUG: Test schedule creation logic (PUBLIC cho dễ test)
router.get('/debug/schedule-logic', doctorScheduleController.debugScheduleCreation);

// DEBUG: Real test cho thứ 6 - tạo lịch thật để verify
router.post('/:id/debug/test-friday', doctorScheduleController.realTestFridaySchedule);

// 🔥 NEW: Test logic với 1 ngày cụ thể
router.get('/debug/test-date', doctorScheduleController.testSingleDate);

// PUBLIC: Xem lịch bác sĩ (chỉ Free status - để customer chọn doctor)
router.get('/:id/schedules', doctorScheduleController.getDoctorSchedules);

// PUBLIC: Xem slots trống theo ngày (chỉ Free status - để customer chọn giờ)  
router.get('/:id/available-slots', doctorScheduleController.getAvailableSlots);

// ===== STAFF/MANAGER/ADMIN ROUTES (cần xác thực + staff/manager/admin role) =====

// STAFF/MANAGER/ADMIN: Lấy tất cả lịch làm việc của tất cả bác sĩ (tất cả status)
router.get('/schedules/all/staff', verifyToken, verifyStaff, doctorScheduleController.getAllDoctorsSchedulesForStaff);

// STAFF/MANAGER/ADMIN: Lấy thống kê tổng của tất cả bác sĩ
router.get('/statistics/all', verifyToken, verifyStaff, doctorScheduleController.getAllDoctorsStatistics);

// STAFF/MANAGER/ADMIN: Tìm tất cả bác sĩ và slots theo ngày (tất cả status)
router.get('/available/staff', verifyToken, verifyStaff, doctorScheduleController.getAvailableDoctorsForStaff);

// STAFF/MANAGER/ADMIN: Xem tất cả lịch bác sĩ (tất cả status)
router.get('/:id/schedules/staff', verifyToken, verifyStaff, doctorScheduleController.getDoctorSchedulesForStaff);

// STAFF/MANAGER/ADMIN: Xem tất cả slots theo ngày (tất cả status)
router.get('/:id/available-slots/staff', verifyToken, verifyStaff, doctorScheduleController.getAvailableSlotsForStaff);

// STAFF/MANAGER/ADMIN: Lấy thống kê bác sĩ (số slot booked, absent, số ngày nghỉ)
router.get('/:id/statistics', verifyToken, verifyStaff, doctorScheduleController.getDoctorStatistics);

// MANAGER ONLY: Book slot cho customer (khi có cuộc gọi đặt lịch)
router.post('/:id/book-slot', verifyToken, roleMiddleware(['manager']), doctorScheduleController.bookSlotForCustomer);

// STAFF/MANAGER/ADMIN: Tạo lịch cho bác sĩ (chỉ staff/manager/admin)
router.post('/:id/schedules', verifyToken, verifyStaff, doctorScheduleController.createDoctorSchedule);

// STAFF/MANAGER/ADMIN: Tạo lịch hàng loạt cho bác sĩ (nhiều ngày cùng lúc) - OPTIMIZED
router.post('/:id/schedules/bulk', verifyToken, verifyStaff, doctorScheduleController.createBulkDoctorSchedule);

// MANAGER ONLY: Tạo lịch hàng loạt cho nhiều ngày (BULK CREATION)
router.post('/:id/schedules/bulk-days', verifyToken, roleMiddleware(['manager']), doctorScheduleController.createBulkDoctorScheduleForDays);

// MANAGER ONLY: Tạo lịch hàng loạt cho cả tháng - trừ T7, CN (BULK CREATION)
router.post('/:id/schedules/bulk-month', verifyToken, roleMiddleware(['manager']), doctorScheduleController.createBulkDoctorScheduleForMonth);

// STAFF/MANAGER/ADMIN: Cập nhật booking status (khi customer đặt lịch)
router.put('/:id/schedules', verifyToken, verifyStaff, doctorScheduleController.updateDoctorSchedule);

// MANAGER ONLY: Xóa lịch bác sĩ (set tất cả slots thành Absent)
router.delete('/:id/schedules/:scheduleId', verifyToken, roleMiddleware(['manager']), doctorScheduleController.deleteDoctorSchedule);

export default router;

