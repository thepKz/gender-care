import express from 'express';
import { verifyToken, verifyStaff, verifyDoctor } from '../middleware/auth';
import {
  getLeastBookedDoctor,
  getBestAssignment,
  createDoctorQA,
  getAllDoctorQAs,
  getDoctorQAById,
  getMyDoctorQAs,
  getDoctorQAByDoctorId,
  getMyDoctorQAAsDoctor,
  updatePaymentStatus,
  doctorConfirmQA,
  scheduleQA,
  updateQAStatus,
  deleteDoctorQA,
  getQAMeeting,
  joinQAMeeting,
  completeQAMeeting,
  manualTriggerScheduling,
  batchProcessPaidQAs
} from '../controllers/doctorQAController';

const router = express.Router();

// =============== SPECIFIC ROUTES FIRST (Tránh conflict với :id) ===============
// GET /api/doctor-qa/best-assignment - Tìm assignment tốt nhất cho slot gần nhất (STAFF/MANAGER/ADMIN)
router.get('/doctor-qa/best-assignment', verifyToken, verifyStaff, getBestAssignment);

// GET /api/doctor-qa/least-booked-doctor - Legacy: Tìm bác sĩ có ít slot booked nhất (STAFF/MANAGER/ADMIN)
router.get('/doctor-qa/least-booked-doctor', verifyToken, verifyStaff, getLeastBookedDoctor);

// GET /api/doctor-qa/my-requests - Lấy yêu cầu tư vấn của user đang đăng nhập
router.get('/doctor-qa/my-requests', verifyToken, getMyDoctorQAs);

// GET /api/doctor-qa/my - Lấy yêu cầu tư vấn của bác sĩ hiện tại (DOCTOR ONLY)
router.get('/doctor-qa/my', verifyToken, verifyDoctor, getMyDoctorQAAsDoctor);

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

// =============== MEETING INTEGRATION ROUTES ===============
// GET /api/doctor-qa/:id/meeting - Lấy meeting info của QA (USER/DOCTOR/STAFF)
router.get('/doctor-qa/:id/meeting', verifyToken, getQAMeeting);

// POST /api/doctor-qa/:id/join-meeting - Join meeting (USER/DOCTOR)
router.post('/doctor-qa/:id/join-meeting', verifyToken, joinQAMeeting);

// PUT /api/doctor-qa/:id/complete-meeting - Hoàn thành meeting và QA (DOCTOR only)
router.put('/doctor-qa/:id/complete-meeting', verifyToken, completeQAMeeting);

// =============== MANUAL TRIGGER ROUTES ===============
// PUT /api/doctor-qa/:id/manual-schedule - Manually trigger auto-scheduling (STAFF)
router.put('/doctor-qa/:id/manual-schedule', verifyToken, verifyStaff, manualTriggerScheduling);

// POST /api/doctor-qa/batch-process-paid - Batch process tất cả paid QAs (STAFF)
router.post('/doctor-qa/batch-process-paid', verifyToken, verifyStaff, batchProcessPaidQAs);


export default router; 