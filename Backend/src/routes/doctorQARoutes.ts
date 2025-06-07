import express from 'express';
import { verifyToken, verifyStaff } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';
import {
  getLeastBookedDoctor,
  createDoctorQA,
  getAllDoctorQAs,
  getDoctorQAById,
  getMyDoctorQAs,
  getDoctorQAByDoctorId,
  updatePaymentStatus,
  doctorConfirmQA,
  scheduleQA,
  updateQAStatus,
  deleteDoctorQA
} from '../controllers/doctorQAController';

const router = express.Router();

// =============== SPECIFIC ROUTES FIRST (Tránh conflict với :id) ===============
// GET /api/doctor-qa/least-booked-doctor - Tìm bác sĩ có ít slot booked nhất (STAFF/MANAGER/ADMIN)
router.get('/doctor-qa/least-booked-doctor', verifyToken, verifyStaff, getLeastBookedDoctor);

// GET /api/doctor-qa/my-requests - Lấy yêu cầu tư vấn của user đang đăng nhập
router.get('/doctor-qa/my-requests', verifyToken, getMyDoctorQAs);

// =============== USER ROUTES (Cần auth) ===============
// POST /api/doctor-qa - Tạo yêu cầu tư vấn mới
router.post('/doctor-qa', verifyToken, createDoctorQA);

// GET /api/doctor-qa - Lấy tất cả yêu cầu tư vấn (có thể filter) - STAFF/MANAGER/ADMIN
router.get('/doctor-qa', verifyToken, verifyStaff, getAllDoctorQAs);

// =============== DOCTOR ROUTES (Cần auth doctor) ===============
// GET /api/doctor-qa/doctor/:doctorId - Lấy yêu cầu tư vấn của bác sĩ cụ thể
router.get('/doctor-qa/doctor/:doctorId', verifyToken, getDoctorQAByDoctorId);

// =============== PARAMETERIZED ROUTES LAST ===============
// GET /api/doctor-qa/:id - Lấy yêu cầu tư vấn theo ID (user chỉ thấy của mình)
router.get('/doctor-qa/:id', verifyToken, getDoctorQAById);

// PUT /api/doctor-qa/:id/confirm - Bác sĩ confirm/reject yêu cầu tư vấn
router.put('/doctor-qa/:id/confirm', verifyToken, doctorConfirmQA);

// PUT /api/doctor-qa/:id/schedule - Staff xếp lịch cụ thể (STAFF/MANAGER/ADMIN)
router.put('/doctor-qa/:id/schedule', verifyToken, verifyStaff, scheduleQA);

// PUT /api/doctor-qa/:id/status - Cập nhật trạng thái tổng quát (STAFF/MANAGER/ADMIN)
router.put('/doctor-qa/:id/status', verifyToken, verifyStaff, updateQAStatus);

// DELETE /api/doctor-qa/:id - Xóa yêu cầu tư vấn (STAFF/MANAGER/ADMIN)
router.delete('/doctor-qa/:id', verifyToken, verifyStaff, deleteDoctorQA);

// =============== PAYMENT GATEWAY ROUTES ===============
// PUT /api/doctor-qa/:id/payment - Cập nhật trạng thái thanh toán (webhook)
router.put('/doctor-qa/:id/payment', updatePaymentStatus);

export default router; 