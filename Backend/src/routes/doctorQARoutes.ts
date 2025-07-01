import express from 'express';
import { verifyToken, verifyStaff, verifyDoctor } from '../middleware/auth';
import { requireRole, requireAnyRole } from '../middleware/roleHierarchy';
import {
  getLeastBookedDoctor,
  getBestAssignment,
  createDoctorQA,
  checkSlotAvailability,
  getAvailableSlotsForDate,
  getDoctorsWorkloadStatistics,
  createQAWithSelectedSlot,
  getAllDoctorQAs,
  getDoctorQAById,
  getMyDoctorQAs,
  getDoctorQAByDoctorId,
  getMyDoctorQAAsDoctor,
  updatePaymentStatus,
  doctorConfirmQA,
  confirmConsultation,
  scheduleQA,
  updateQAStatus,
  deleteDoctorQA,
  getQAMeeting,
  joinQAMeeting,
  completeQAMeeting,
  manualTriggerScheduling,
  batchProcessPaidQAs,
  cancelConsultationByDoctor,
  cancelConsultationByUser,
  getLiveConsultations,
  getTodayConsultations,
  checkMeetingExistence,
  createMeetingRecord,
  completeConsultationWithMeeting,
  updateMeetingNotes,
  getMeetingDetails
} from '../controllers/doctorQAController';

const router = express.Router();

// =============== SPECIFIC ROUTES FIRST (Tránh conflict với :id) ===============
// ➕ NEW SLOT CHECKING ROUTES
// GET /api/doctor-qa/check-slot/:date/:slotTime - Check if specific slot is available (PUBLIC)
router.get('/doctor-qa/check-slot/:date/:slotTime', checkSlotAvailability);

// GET /api/doctor-qa/available-slots-for-date/:date - Get all 8 slots availability for date (PUBLIC)
router.get('/doctor-qa/available-slots-for-date/:date', getAvailableSlotsForDate);

// GET /api/doctor-qa/doctors-workload - Get doctors workload statistics (STAFF/MANAGER/ADMIN)
router.get('/doctor-qa/doctors-workload', verifyToken, requireRole('staff'), getDoctorsWorkloadStatistics);

// POST /api/doctor-qa/create-with-selected-slot - Create QA with selected slot and auto-assign doctor (USER)
router.post('/doctor-qa/create-with-selected-slot', verifyToken, createQAWithSelectedSlot);

// GET /api/doctor-qa/best-assignment - Tìm assignment tốt nhất cho slot gần nhất (STAFF/MANAGER/ADMIN)
router.get('/doctor-qa/best-assignment', verifyToken, requireRole('staff'), getBestAssignment);

// GET /api/doctor-qa/least-booked-doctor - Legacy: Tìm bác sĩ có ít slot booked nhất (STAFF/MANAGER/ADMIN)
router.get('/doctor-qa/least-booked-doctor', verifyToken, requireRole('staff'), getLeastBookedDoctor);

// GET /api/doctor-qa/live - Lấy consultation đang LIVE hiện tại (DOCTOR/STAFF)
router.get('/doctor-qa/live', verifyToken, getLiveConsultations);

// GET /api/doctor-qa/today - Lấy tất cả consultation HÔM NAY (DOCTOR/STAFF)
router.get('/doctor-qa/today', verifyToken, getTodayConsultations);

// GET /api/doctor-qa/my-requests - Lấy yêu cầu tư vấn của user đang đăng nhập
router.get('/doctor-qa/my-requests', verifyToken, getMyDoctorQAs);

// GET /api/doctor-qa/my - Lấy yêu cầu tư vấn của bác sĩ hiện tại (DOCTOR và STAFF)
router.get('/doctor-qa/my', verifyToken, requireAnyRole(['doctor', 'staff']), getMyDoctorQAAsDoctor);

// =============== USER ROUTES (Cần auth) ===============
// POST /api/doctor-qa - Tạo yêu cầu tư vấn mới (cơ bản, không auto-assign)
router.post('/doctor-qa', verifyToken, createDoctorQA);

// GET /api/doctor-qa - Lấy tất cả yêu cầu tư vấn (có thể filter) - STAFF/MANAGER/ADMIN
router.get('/doctor-qa', verifyToken, requireRole('staff'), getAllDoctorQAs);

// =============== DOCTOR ROUTES (Cần auth doctor) ===============
// GET /api/doctor-qa/doctor/:doctorId - Lấy yêu cầu tư vấn của bác sĩ cụ thể
router.get('/doctor-qa/doctor/:doctorId', verifyToken, getDoctorQAByDoctorId);

// =============== MEETING WORKFLOW ROUTES (NEW) ===============
// GET /api/doctor-qa/:id/check-meeting - Kiểm tra consultation đã có Meeting record chưa (DOCTOR/STAFF)
router.get('/doctor-qa/:id/check-meeting', verifyToken, checkMeetingExistence);

// POST /api/doctor-qa/:id/create-meeting - Tạo hồ sơ Meeting cho consultation (DOCTOR ONLY)
router.post('/doctor-qa/:id/create-meeting', verifyToken, verifyDoctor, createMeetingRecord);

// PUT /api/doctor-qa/:id/complete-consultation - Hoàn thành consultation và meeting (DOCTOR ONLY)
router.put('/doctor-qa/:id/complete-consultation', verifyToken, verifyDoctor, completeConsultationWithMeeting);

// PUT /api/doctor-qa/:id/update-meeting - Cập nhật meeting notes và thông tin (DOCTOR ONLY)
router.put('/doctor-qa/:id/update-meeting', verifyToken, verifyDoctor, updateMeetingNotes);

// GET /api/doctor-qa/:id/meeting-details - Lấy chi tiết meeting của consultation (DOCTOR/STAFF)
router.get('/doctor-qa/:id/meeting-details', verifyToken, getMeetingDetails);

// =============== PARAMETERIZED ROUTES LAST ===============
// GET /api/doctor-qa/:id - Lấy yêu cầu tư vấn theo ID (user chỉ thấy của mình)
router.get('/doctor-qa/:id', verifyToken, getDoctorQAById);

// PUT /api/doctor-qa/:id/confirm-consultation - Xác nhận cuộc tư vấn đã thanh toán (paid -> confirmed)
router.put('/doctor-qa/:id/confirm-consultation', verifyToken, confirmConsultation);

// PUT /api/doctor-qa/:id/cancel-by-doctor - Hủy cuộc tư vấn bởi bác sĩ với lý do (DOCTOR ONLY)
router.put('/doctor-qa/:id/cancel-by-doctor', verifyToken, verifyDoctor, cancelConsultationByDoctor);

// PUT /api/doctor-qa/:id/cancel-by-user - Hủy cuộc tư vấn bởi user (USER ONLY)
router.put('/doctor-qa/:id/cancel-by-user', verifyToken, cancelConsultationByUser);

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

// =============== MANUAL TRIGGER ROUTES ===============
// PUT /api/doctor-qa/:id/manual-schedule - Manually trigger auto-scheduling (STAFF)
router.put('/doctor-qa/:id/manual-schedule', verifyToken, verifyStaff, manualTriggerScheduling);

// POST /api/doctor-qa/batch-process-paid - Batch process tất cả paid QAs (STAFF)
router.post('/doctor-qa/batch-process-paid', verifyToken, verifyStaff, batchProcessPaidQAs);

export default router; 