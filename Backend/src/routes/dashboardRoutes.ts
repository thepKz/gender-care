import express from 'express';
import { getManagementDashboard, getOperationalDashboard } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// GET /dashboard/management - Dashboard for managers and admins
router.get('/management', authMiddleware, roleMiddleware(['admin', 'manager']), getManagementDashboard);

// GET /dashboard/operational - Dashboard for staff and doctors
router.get('/operational', authMiddleware, roleMiddleware(['staff', 'doctor']), getOperationalDashboard);

export default router; 