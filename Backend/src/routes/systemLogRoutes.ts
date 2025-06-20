import express from 'express';
import {
  getSystemLogs,
  getSystemLogStats,
  cleanupOldLogs,
  createTestLog,
  exportLogs
} from '../controllers/systemLogController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireManagerOrAbove, requireAdminOnly } from '../middleware/roleHierarchy';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route GET /api/system-logs
 * @desc Lấy danh sách system logs
 * @access Manager + Admin
 */
router.get('/', requireManagerOrAbove, getSystemLogs);

/**
 * @route GET /api/system-logs/stats
 * @desc Lấy thống kê system logs
 * @access Manager + Admin
 */
router.get('/stats', requireManagerOrAbove, getSystemLogStats);

/**
 * @route POST /api/system-logs/cleanup
 * @desc Xóa logs cũ
 * @access Admin only
 */
router.post('/cleanup', requireAdminOnly, cleanupOldLogs);

/**
 * @route POST /api/system-logs/test
 * @desc Tạo test log
 * @access Admin only
 */
router.post('/test', requireAdminOnly, createTestLog);

/**
 * @route GET /api/system-logs/export
 * @desc Export logs to CSV
 * @access Admin only
 */
router.get('/export', requireAdminOnly, exportLogs);

export default router; 