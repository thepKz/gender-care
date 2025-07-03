import express from 'express';
import { getManagementReports, getDetailedReport, exportDetailedReport, seedSampleData, getAnalyticsReports } from '../controllers/reportsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// GET /reports/management - reports for admin/manager
router.get('/management', authMiddleware, roleMiddleware(['admin', 'manager']), getManagementReports);

// POST /reports/detailed - Get detailed, filterable report data
router.post('/detailed', authMiddleware, roleMiddleware(['admin', 'manager']), getDetailedReport);

// POST /reports/export - Export detailed report data to Excel
router.post('/export', authMiddleware, roleMiddleware(['admin', 'manager']), exportDetailedReport);

// POST /reports/seed-sample-data - Generate sample data for dashboard (Admin only)
router.post('/seed-sample-data', authMiddleware, roleMiddleware(['admin']), seedSampleData);

router.get('/analytics', authMiddleware, getAnalyticsReports);

export default router;