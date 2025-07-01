import express from 'express';
import { getManagementReports } from '../controllers/reportsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// GET /reports/management - reports for admin/manager
router.get('/management', authMiddleware, roleMiddleware(['admin', 'manager']), getManagementReports);

export default router;