import { Router } from 'express';
import * as doctorController from '../controllers/doctorController';
import * as doctorScheduleController from '../controllers/doctorScheduleController';
import { verifyToken, verifyStaff } from '../middleware/auth';

const router = Router();

router.get('/', doctorController.getAll);

// PUBLIC: Tìm tất cả bác sĩ có lịch trống theo ngày/timeSlot (chỉ Free status)
router.get('/available', doctorScheduleController.getAvailableDoctors);

// STAFF: Tìm tất cả bác sĩ và slots theo ngày (tất cả status)
router.get('/available/staff', verifyToken, verifyStaff, doctorScheduleController.getAvailableDoctorsForStaff);

router.get('/:id', doctorController.getById);
router.post('/', doctorController.create);
router.put('/:id', doctorController.update);
router.delete('/:id', doctorController.remove);

// PUBLIC: Xem lịch bác sĩ (chỉ Free status - để customer chọn doctor)
router.get('/:id/schedules', doctorScheduleController.getDoctorSchedules);

// STAFF: Xem tất cả lịch bác sĩ (tất cả status)
router.get('/:id/schedules/staff', verifyToken, verifyStaff, doctorScheduleController.getDoctorSchedulesForStaff);

// PUBLIC: Xem slots trống theo ngày (chỉ Free status - để customer chọn giờ)  
router.get('/:id/available-slots', doctorScheduleController.getAvailableSlots);

// STAFF: Xem tất cả slots theo ngày (tất cả status)
router.get('/:id/available-slots/staff', verifyToken, verifyStaff, doctorScheduleController.getAvailableSlotsForStaff);

// STAFF ONLY: Tạo lịch cho bác sĩ (chỉ staff/manager/admin)
router.post('/:id/schedules', verifyToken, verifyStaff, doctorScheduleController.createDoctorSchedule);

// STAFF ONLY: Cập nhật booking status (khi customer đặt lịch)
router.put('/:id/schedules', verifyToken, verifyStaff, doctorScheduleController.updateDoctorSchedule);

// STAFF ONLY: Xóa lịch bác sĩ (set tất cả slots thành Absent)
router.delete('/:id/schedules/:scheduleId', verifyToken, verifyStaff, doctorScheduleController.deleteDoctorSchedule);

export default router;
