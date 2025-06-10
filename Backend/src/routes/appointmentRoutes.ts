import { Router } from 'express';
import {
    getAllAppointments,
    createAppointment,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus,
    updatePaymentStatus
} from '../controllers/appointmentController';
import { verifyToken, verifyAdmin, verifyCustomer, verifyStaff, verifyDoctor } from '../middleware';

const router = Router();

/**
 * @route   GET /api/appointments
 * @desc    Lấy danh sách cuộc hẹn (có phân trang và lọc)
 * @access  Public
 */
router.get('/', getAllAppointments);

/**
 * @route   POST /api/appointments
 * @desc    Tạo cuộc hẹn mới
 * @access  Private (Customer, Staff)
 */
router.post('/', verifyToken, createAppointment);

/**
 * @route   GET /api/appointments/:id
 * @desc    Lấy chi tiết cuộc hẹn theo ID
 * @access  Public
 */
router.get('/:id', getAppointmentById);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Cập nhật thông tin cuộc hẹn
 * @access  Private (Staff)
 */
router.put('/:id', verifyToken, verifyStaff, updateAppointment);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Hủy cuộc hẹn (soft delete)
 * @access  Private (Staff)
 */
router.delete('/:id', verifyToken, verifyStaff, deleteAppointment);

/**
 * @route   PUT /api/appointments/:id/status
 * @desc    Cập nhật trạng thái cuộc hẹn
 * @access  Private (Staff)
 */
router.put('/:id/status', verifyToken, verifyStaff, updateAppointmentStatus);

/**
 * @route   PUT /api/appointments/:id/payment
 * @desc    Cập nhật trạng thái thanh toán (pending_payment -> confirmed)
 * @access  Private (Customer)
 */
router.put('/:id/payment', verifyToken, verifyCustomer, updatePaymentStatus);

export default router; 