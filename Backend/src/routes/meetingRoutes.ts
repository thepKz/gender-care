import express from 'express';
import { verifyToken, verifyStaff, verifyDoctor } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';
import {
  createMeetLink,
  getMeetingByQaId,
  updateMeetingLink,
  joinMeetingNotification,
  completeMeeting,
  getMeetingsByDoctorId,
  getMeetingsByUserId,
  updateDoctorJoinStatus,
  sendCustomerInvite,
  getMyMeetings
} from '../controllers/meetingController';

const router = express.Router();

// =============== SPECIFIC ROUTES FIRST (Tránh conflict với :qaId) ===============

// GET /api/meetings/doctor/my-meetings - Lấy meetings của doctor hiện tại (DOCTOR ONLY - tự động từ token)
router.get('/doctor/my-meetings', verifyToken, verifyDoctor, getMyMeetings);

// GET /api/meetings/doctor/:doctorId - Lấy meetings của doctor (DOCTOR ONLY - chỉ xem của mình) - LEGACY
router.get('/doctor/:doctorId', verifyToken, verifyDoctor, getMeetingsByDoctorId);

// GET /api/meetings/user/:userId - Lấy meetings của user (USER - chỉ xem của mình)
router.get('/user/:userId', verifyToken, getMeetingsByUserId);

// =============== MEETING CREATION & MANAGEMENT (STAFF/MANAGER/ADMIN) ===============

// POST /api/meetings/create-meet-link - Tạo Google Meet link cho consultation (STAFF)
router.post('/create-meet-link', verifyToken, verifyStaff, createMeetLink);

// =============== PARAMETERIZED ROUTES LAST ===============

// GET /api/meetings/:qaId - Lấy thông tin meeting theo qaId (USER/DOCTOR/STAFF)
router.get('/:qaId', verifyToken, getMeetingByQaId);

// PUT /api/meetings/:qaId/update-link - Update meeting link (STAFF/MANAGER/ADMIN)
router.put('/:qaId/update-link', verifyToken, verifyStaff, updateMeetingLink);

// POST /api/meetings/:qaId/join-notification - Notify participant join meeting (USER/DOCTOR)
router.post('/:qaId/join-notification', verifyToken, joinMeetingNotification);

// ➕ ADD: POST /api/meetings/:qaId/doctor-join - Update status khi doctor join (DOCTOR ONLY)
router.post('/:qaId/doctor-join', verifyToken, verifyDoctor, updateDoctorJoinStatus);

// ➕ ADD: POST /api/meetings/:qaId/send-customer-invite - Gửi thư mời customer (DOCTOR ONLY)
router.post('/:qaId/send-customer-invite', verifyToken, verifyDoctor, sendCustomerInvite);

// PUT /api/meetings/:qaId/complete - Hoàn thành meeting (DOCTOR/STAFF/MANAGER/ADMIN)
router.put('/:qaId/complete', verifyToken, completeMeeting);

export default router; 