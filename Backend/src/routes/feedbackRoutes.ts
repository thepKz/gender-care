import express from 'express';
import {
  createFeedback,
  getFeedbackByAppointment,
  getUserFeedbacks,
  updateFeedback,
  getDoctorFeedbacks
} from '../controllers/feedbackController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// POST /api/feedbacks - Tạo feedback mới cho appointment (Customer only)
// Require authentication - chỉ customer được phép tạo feedback
router.post('/', verifyToken, createFeedback);

// GET /api/feedbacks/appointment/:appointmentId - Lấy feedback của appointment cụ thể
// Require authentication - user chỉ xem feedback của appointment mình
router.get('/appointment/:appointmentId', verifyToken, getFeedbackByAppointment);

// GET /api/feedbacks/user - Lấy tất cả feedback của user hiện tại
// Require authentication - user xem feedback của mình
router.get('/user', verifyToken, getUserFeedbacks);

// PUT /api/feedbacks/:id - Cập nhật feedback (nếu cho phép)
// Require authentication - user chỉ update feedback của mình
router.put('/:id', verifyToken, updateFeedback);

// GET /api/feedbacks/doctor/:doctorId - Lấy tất cả feedback của doctor (public)
// Public endpoint - để hiển thị trên profile bác sĩ
router.get('/doctor/:doctorId', getDoctorFeedbacks);

export default router; 