import express from 'express';
import {
  getManagementReports,
  getDetailedReport,
  exportDetailedReport,
  seedSampleData,
  getAnalyticsReports,
  getAdminDashboardReports,
  getRevenueReports,
  getAppointmentOverviewReports,
  getPaymentStatisticsReports,
  getDoctorRankingsReports,
  getPeakTimeAnalysisReports,
  getServicePopularityReports,
  getPackageAnalysisReports,
  exportAdminDashboardReports,
  exportRevenueReports
} from '../controllers/reportsController';
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

// ===== NEW ADMIN DASHBOARD REPORTS ROUTES =====

// GET /reports/admin-dashboard - Comprehensive admin dashboard reports
router.get('/admin-dashboard', authMiddleware, roleMiddleware(['admin', 'manager']), getAdminDashboardReports);

// GET /reports/revenue - Revenue reports by period (week/month/quarter)
router.get('/revenue', authMiddleware, roleMiddleware(['admin', 'manager']), getRevenueReports);

// GET /reports/appointments-overview - Appointment overview statistics
router.get('/appointments-overview', authMiddleware, roleMiddleware(['admin', 'manager']), getAppointmentOverviewReports);

// GET /reports/payment-statistics - PayOS payment statistics
router.get('/payment-statistics', authMiddleware, roleMiddleware(['admin', 'manager']), getPaymentStatisticsReports);

// GET /reports/doctor-rankings - Doctor performance rankings
router.get('/doctor-rankings', authMiddleware, roleMiddleware(['admin', 'manager']), getDoctorRankingsReports);

// GET /reports/peak-times - Peak time analysis
router.get('/peak-times', authMiddleware, roleMiddleware(['admin', 'manager']), getPeakTimeAnalysisReports);

// GET /reports/service-popularity - Service popularity analysis
router.get('/service-popularity', authMiddleware, roleMiddleware(['admin', 'manager']), getServicePopularityReports);

// GET /reports/package-analysis - Package analysis and discounts
router.get('/package-analysis', authMiddleware, roleMiddleware(['admin', 'manager']), getPackageAnalysisReports);

// ===== EXPORT ROUTES =====

// POST /reports/export-admin-dashboard - Export comprehensive admin dashboard
router.post('/export-admin-dashboard', authMiddleware, roleMiddleware(['admin', 'manager']), exportAdminDashboardReports);

// POST /reports/export-revenue - Export revenue reports
router.post('/export-revenue', authMiddleware, roleMiddleware(['admin', 'manager']), exportRevenueReports);

export default router;