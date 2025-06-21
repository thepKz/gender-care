import express from 'express';
import paymentController from '../controllers/paymentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Protected routes - require authentication
router.post('/appointments/:appointmentId/payment', authMiddleware, paymentController.createPaymentLink);
router.get('/appointments/:appointmentId/payment/status', authMiddleware, paymentController.checkPaymentStatus);
router.post('/appointments/:appointmentId/payment/cancel', authMiddleware, paymentController.cancelPayment);

// Public webhook route - không cần auth vì PayOS gọi
router.post('/payos/webhook', paymentController.payosWebhook);

// Fast confirm payment với status=PAID từ PayOS URL
router.put('/fast-confirm', authMiddleware, paymentController.fastConfirmPayment);

export default router; 