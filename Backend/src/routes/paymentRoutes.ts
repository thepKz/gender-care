import express from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const paymentController = new PaymentController();

// Protected routes - require authentication
router.post('/appointments/:appointmentId/payment', authMiddleware, paymentController.createPaymentLink);
router.get('/appointments/:appointmentId/payment/status', authMiddleware, paymentController.checkPaymentStatus);
router.post('/appointments/:appointmentId/payment/cancel', authMiddleware, paymentController.cancelPayment);

// Public webhook route - không cần auth vì PayOS gọi
router.post('/payos/webhook', paymentController.payosWebhook);

export default router; 