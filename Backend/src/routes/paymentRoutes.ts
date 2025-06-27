import express from 'express';
import appointmentPaymentController from '../controllers/appointmentPaymentController';
import consultationPaymentController from '../controllers/consultationPaymentController';
import paymentController from '../controllers/paymentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// ✅ APPOINTMENT PAYMENT ROUTES - Protected routes require authentication
router.post('/appointments/:appointmentId/create', authMiddleware, appointmentPaymentController.createPaymentLink);
router.get('/appointments/:appointmentId/status', authMiddleware, appointmentPaymentController.checkPaymentStatus);
router.post('/appointments/:appointmentId/cancel', authMiddleware, appointmentPaymentController.cancelPayment);

// ✅ CONSULTATION PAYMENT ROUTES - Protected routes require authentication  
router.post('/consultations/:doctorQAId/create', authMiddleware, consultationPaymentController.createPaymentLink);
router.get('/consultations/:doctorQAId/status', authMiddleware, consultationPaymentController.checkPaymentStatus);
router.post('/consultations/:doctorQAId/cancel', authMiddleware, consultationPaymentController.cancelPayment);

// ✅ FAST CONFIRM ROUTES - For PayOS return URL processing
router.post('/appointments/:appointmentId/fast-confirm', authMiddleware, paymentController.fastConfirmPayment);
router.post('/consultations/:qaId/fast-confirm', authMiddleware, paymentController.fastConfirmConsultationPayment);

// ✅ NEW: Force check payment and assign doctor route
router.post('/appointments/:appointmentId/force-check', authMiddleware, paymentController.forceCheckPaymentAndAssignDoctor);

// ✅ SHARED WEBHOOK ROUTE - No auth required (PayOS calls this)
router.post('/webhook', paymentController.payosWebhook);

// ✅ LEGACY ROUTES - Keep for backward compatibility (will be deprecated)
router.post('/appointments/:appointmentId/payment', authMiddleware, appointmentPaymentController.createPaymentLink);
router.get('/appointments/:appointmentId/payment/status', authMiddleware, appointmentPaymentController.checkPaymentStatus);
router.post('/consultations/:qaId/payment', authMiddleware, consultationPaymentController.createPaymentLink);

export default router; 