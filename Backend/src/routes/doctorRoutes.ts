import { Router } from 'express';
import * as doctorController from '../controllers/doctorController';
import * as doctorScheduleController from '../controllers/doctorScheduleController';
import { verifyToken, verifyStaff } from '../middleware/auth';

const router = Router();

router.get('/', doctorController.getAll);
router.get('/:id', doctorController.getById);
router.post('/', doctorController.create);
router.put('/:id', doctorController.update);
router.delete('/:id', doctorController.remove);

// ===== PUBLIC ROUTES (không cần xác thực) =====

// PUBLIC: Tìm tất cả bác sĩ có lịch trống theo ngày/timeSlot (chỉ Free status)
router.get('/available', doctorScheduleController.getAvailableDoctors);

// PUBLIC: Xem lịch bác sĩ (chỉ Free status - để customer chọn doctor)
router.get('/:id/schedules', doctorScheduleController.getDoctorSchedules);

// PUBLIC: Xem slots trống theo ngày (chỉ Free status - để customer chọn giờ)  
router.get('/:id/available-slots', doctorScheduleController.getAvailableSlots);

// ===== STAFF ONLY ROUTES (cần xác thực + staff role) =====

// STAFF: Lấy thống kê tổng của tất cả bác sĩ
router.get('/statistics/all', verifyToken, verifyStaff, doctorScheduleController.getAllDoctorsStatistics);

// STAFF: Tìm tất cả bác sĩ và slots theo ngày (tất cả status)
router.get('/available/staff', verifyToken, verifyStaff, doctorScheduleController.getAvailableDoctorsForStaff);

// STAFF: Xem tất cả lịch bác sĩ (tất cả status)
router.get('/:id/schedules/staff', verifyToken, verifyStaff, doctorScheduleController.getDoctorSchedulesForStaff);

// STAFF: Xem tất cả slots theo ngày (tất cả status)
router.get('/:id/available-slots/staff', verifyToken, verifyStaff, doctorScheduleController.getAvailableSlotsForStaff);

// STAFF: Lấy thống kê bác sĩ (số slot booked, absent, số ngày nghỉ)
router.get('/:id/statistics', verifyToken, verifyStaff, doctorScheduleController.getDoctorStatistics);

// STAFF ONLY: Book slot cho customer (khi có cuộc gọi đặt lịch)
router.post('/:id/book-slot', verifyToken, verifyStaff, doctorScheduleController.bookSlotForCustomer);

// STAFF ONLY: Tạo lịch cho bác sĩ (chỉ staff/manager/admin)
router.post('/:id/schedules', verifyToken, verifyStaff, doctorScheduleController.createDoctorSchedule);

// STAFF ONLY: Tạo lịch hàng loạt cho bác sĩ (nhiều ngày cùng lúc) - OPTIMIZED
router.post('/:id/schedules/bulk', verifyToken, verifyStaff, doctorScheduleController.createBulkDoctorSchedule);

// STAFF ONLY: Tạo lịch hàng loạt cho nhiều ngày (BULK CREATION)
router.post('/:id/schedules/bulk-days', verifyToken, verifyStaff, doctorScheduleController.createBulkDoctorScheduleForDays);

// STAFF ONLY: Tạo lịch hàng loạt cho cả tháng - trừ T7, CN (BULK CREATION)
router.post('/:id/schedules/bulk-month', verifyToken, verifyStaff, doctorScheduleController.createBulkDoctorScheduleForMonth);

// STAFF ONLY: Cập nhật booking status (khi customer đặt lịch)
router.put('/:id/schedules', verifyToken, verifyStaff, doctorScheduleController.updateDoctorSchedule);

// STAFF ONLY: Xóa lịch bác sĩ (set tất cả slots thành Absent)
router.delete('/:id/schedules/:scheduleId', verifyToken, verifyStaff, doctorScheduleController.deleteDoctorSchedule);

export default router;
