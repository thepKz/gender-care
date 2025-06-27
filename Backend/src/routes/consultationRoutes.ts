import express from 'express';
import { 
  checkAvailableDoctors, 
  transferConsultation 
} from '../controllers/consultationController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/consultations/:id/check-available-doctors
 * Kiểm tra các bác sĩ available trong cùng slot với consultation
 */
router.get('/:id/check-available-doctors', verifyToken, checkAvailableDoctors);

/**
 * POST /api/consultations/:id/transfer
 * Transfer consultation sang bác sĩ khác
 */
router.post('/:id/transfer', verifyToken, transferConsultation);

export default router; 