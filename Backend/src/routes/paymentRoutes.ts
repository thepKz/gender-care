import express from 'express';
import paymentController from '../controllers/paymentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// ✅ APPOINTMENT PAYMENT ROUTES - Protected routes require authentication
router.post('/appointments/:appointmentId/payment', authMiddleware, paymentController.createPaymentLink);
router.get('/appointments/:appointmentId/payment/status', authMiddleware, paymentController.checkPaymentStatus);
router.post('/appointments/:appointmentId/payment/cancel', authMiddleware, paymentController.cancelPayment);

// ✅ CONSULTATION PAYMENT ROUTES - Protected routes require authentication  
router.post('/consultations/:qaId/payment', authMiddleware, paymentController.createConsultationPaymentLink);
router.get('/consultations/:qaId/payment/status', authMiddleware, paymentController.checkConsultationPaymentStatus);
router.post('/consultations/:qaId/payment/cancel', authMiddleware, paymentController.cancelConsultationPayment);

// ✅ WEBHOOK ROUTE - Public route (PayOS calls this)
router.post('/payos/webhook', paymentController.payosWebhook);

// ✅ FAST CONFIRM ROUTES - With status=PAID from PayOS URL
router.put('/appointments/fast-confirm', authMiddleware, paymentController.fastConfirmPayment);
router.put('/consultations/fast-confirm', authMiddleware, paymentController.fastConfirmConsultationPayment);

export default router; 