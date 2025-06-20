import express from 'express';
import { verifyToken, verifyStaff } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { requireRole } from '../middleware/roleHierarchy';
import {
  getLeastBookedDoctor,
  getBestAssignment,
  createDoctorQA,
  getAllDoctorQAs,
  getDoctorQAById,
  getMyDoctorQAs,
  getDoctorQAByDoctorId,
  updatePaymentStatus,
  doctorConfirmQA,
  scheduleQA,
  updateQAStatus,
  deleteDoctorQA,
  getQAMeeting,
  joinQAMeeting,
  completeQAMeeting,

} from '../controllers/doctorQAController';

const router = express.Router();

// =============== SPECIFIC ROUTES FIRST (Tránh conflict với :id) ===============
// GET /api/doctor-qa/best-assignment - Tìm assignment tốt nhất cho slot gần nhất (STAFF/MANAGER/ADMIN)
router.get('/doctor-qa/best-assignment', verifyToken, requireRole('staff'), getBestAssignment);

// GET /api/doctor-qa/least-booked-doctor - Legacy: Tìm bác sĩ có ít slot booked nhất (STAFF/MANAGER/ADMIN)
router.get('/doctor-qa/least-booked-doctor', verifyToken, requireRole('staff'), getLeastBookedDoctor);



// GET /api/doctor-qa/my-requests - Lấy yêu cầu tư vấn của user đang đăng nhập
router.get('/doctor-qa/my-requests', verifyToken, getMyDoctorQAs);

// =============== USER ROUTES (Cần auth) ===============
// POST /api/doctor-qa - Tạo yêu cầu tư vấn mới
router.post('/doctor-qa', verifyToken, createDoctorQA);

// GET /api/doctor-qa - Lấy tất cả yêu cầu tư vấn (có thể filter) - STAFF/MANAGER/ADMIN
router.get('/doctor-qa', verifyToken, requireRole('staff'), getAllDoctorQAs);

// =============== DOCTOR ROUTES (Cần auth doctor) ===============
// GET /api/doctor-qa/doctor/:doctorId - Lấy yêu cầu tư vấn của bác sĩ cụ thể
router.get('/doctor-qa/doctor/:doctorId', verifyToken, getDoctorQAByDoctorId);

// =============== PARAMETERIZED ROUTES LAST ===============
// GET /api/doctor-qa/:id - Lấy yêu cầu tư vấn theo ID (user chỉ thấy của mình)
router.get('/doctor-qa/:id', verifyToken, getDoctorQAById);

// PUT /api/doctor-qa/:id/confirm - Bác sĩ confirm/reject yêu cầu tư vấn
router.put('/doctor-qa/:id/confirm', verifyToken, doctorConfirmQA);

// PUT /api/doctor-qa/:id/schedule - Staff xếp lịch cụ thể (STAFF/MANAGER/ADMIN)
router.put('/doctor-qa/:id/schedule', verifyToken, requireRole('staff'), scheduleQA);

// PUT /api/doctor-qa/:id/status - Cập nhật trạng thái tổng quát (STAFF/MANAGER/ADMIN)
router.put('/doctor-qa/:id/status', verifyToken, requireRole('staff'), updateQAStatus);

// DELETE /api/doctor-qa/:id - Xóa yêu cầu tư vấn (STAFF/MANAGER/ADMIN)
router.delete('/doctor-qa/:id', verifyToken, requireRole('staff'), deleteDoctorQA);

// =============== PAYMENT GATEWAY ROUTES ===============
// PUT /api/doctor-qa/:id/payment - Cập nhật trạng thái thanh toán (webhook)
router.put('/doctor-qa/:id/payment', updatePaymentStatus);

// =============== MEETING INTEGRATION ROUTES ===============
// GET /api/doctor-qa/:id/meeting - Lấy meeting info của QA (USER/DOCTOR/STAFF)
router.get('/doctor-qa/:id/meeting', verifyToken, getQAMeeting);

// POST /api/doctor-qa/:id/join-meeting - Join meeting (USER/DOCTOR)
router.post('/doctor-qa/:id/join-meeting', verifyToken, joinQAMeeting);

// PUT /api/doctor-qa/:id/complete-meeting - Hoàn thành meeting và QA (DOCTOR only)
router.put('/doctor-qa/:id/complete-meeting', verifyToken, completeQAMeeting);



export default router; 