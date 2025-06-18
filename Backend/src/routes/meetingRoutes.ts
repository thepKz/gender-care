import express from 'express';
import { verifyToken, verifyStaff } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';
import {
  createMeetLink,
  getMeetingByQaId,
  updateMeetingLink,
  joinMeetingNotification,
  completeMeeting,
  getMeetingsByDoctorId,
  getMeetingsByUserId
} from '../controllers/meetingController';

const router = express.Router();

// =============== SPECIFIC ROUTES FIRST (Tránh conflict với :qaId) ===============

// GET /api/meetings/doctor/:doctorId - Lấy meetings của doctor (DOCTOR/STAFF/MANAGER/ADMIN)
router.get('/meetings/doctor/:doctorId', verifyToken, getMeetingsByDoctorId);

// GET /api/meetings/user/:userId - Lấy meetings của user (USER - chỉ xem của mình)
router.get('/meetings/user/:userId', verifyToken, getMeetingsByUserId);

// =============== MEETING CREATION & MANAGEMENT (STAFF/MANAGER/ADMIN) ===============

// POST /api/meetings/create-meet-link - Tạo Google Meet link cho consultation (STAFF)
router.post('/meetings/create-meet-link', verifyToken, verifyStaff, createMeetLink);

// =============== PARAMETERIZED ROUTES LAST ===============

// GET /api/meetings/:qaId - Lấy thông tin meeting theo qaId (USER/DOCTOR/STAFF)
router.get('/meetings/:qaId', verifyToken, getMeetingByQaId);

// PUT /api/meetings/:qaId/update-link - Update meeting link (STAFF/MANAGER/ADMIN)
router.put('/meetings/:qaId/update-link', verifyToken, verifyStaff, updateMeetingLink);

// POST /api/meetings/:qaId/join-notification - Notify participant join meeting (USER/DOCTOR)
router.post('/meetings/:qaId/join-notification', verifyToken, joinMeetingNotification);

// PUT /api/meetings/:qaId/complete - Hoàn thành meeting (DOCTOR/STAFF/MANAGER/ADMIN)
router.put('/meetings/:qaId/complete', verifyToken, completeMeeting);

export default router; 