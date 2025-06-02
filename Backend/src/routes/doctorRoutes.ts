import { Router } from 'express';
import * as doctorController from '../controllers/doctorController';
import * as doctorScheduleController from '../controllers/doctorScheduleController';
import { verifyToken, verifyStaff } from '../middleware/auth';

const router = Router();

router.get('/', doctorController.getAll);

// NEW: PUBLIC - Tìm tất cả bác sĩ có lịch trống theo ngày/timeSlot
router.get('/available', doctorScheduleController.getAvailableDoctors);

router.get('/:id', doctorController.getById);
router.post('/', doctorController.create);
router.put('/:id', doctorController.update);
router.delete('/:id', doctorController.remove);

// PUBLIC: Xem lịch bác sĩ (không cần đăng nhập - để customer chọn doctor)
router.get('/:id/schedules', doctorScheduleController.getDoctorSchedules);

// PUBLIC: Xem slots trống (không cần đăng nhập - để customer chọn giờ)  
router.get('/:id/available-slots', doctorScheduleController.getAvailableSlots);

// STAFF ONLY: Tạo lịch cho bác sĩ (chỉ staff/manager/admin)
router.post('/:id/schedules', verifyToken, verifyStaff, doctorScheduleController.createDoctorSchedule);

// STAFF ONLY: Cập nhật booking status (khi customer đặt lịch)
router.put('/:id/schedules', verifyToken, verifyStaff, doctorScheduleController.updateDoctorSchedule);

// STAFF ONLY: Xóa lịch bác sĩ
router.delete('/:id/schedules/:scheduleId', verifyToken, verifyStaff, doctorScheduleController.deleteDoctorSchedule);

export default router;
