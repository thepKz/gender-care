import express from 'express';
import {
  getAllConfigs,
  getPublicConfigs,
  getConfigByKey,
  setConfig,
  deleteConfig,
  clearConfigCache
} from '../controllers/systemConfigController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireAdminOnly } from '../middleware/roleHierarchy';

const router = express.Router();

/**
 * @route GET /api/system-configs/public
 * @desc Lấy các configs công khai (timeout configs)
 * @access Public
 */
router.get('/public', getPublicConfigs);

// Apply auth middleware to protected routes
router.use(authMiddleware);

/**
 * @route GET /api/system-configs
 * @desc Lấy tất cả system configs
 * @access Admin only
 */
router.get('/', requireAdminOnly, getAllConfigs);

/**
 * @route GET /api/system-configs/:key
 * @desc Lấy config theo key
 * @access Admin only
 */
router.get('/:key', requireAdminOnly, getConfigByKey);

/**
 * @route POST /api/system-configs
 * @desc Tạo hoặc cập nhật config
 * @access Admin only
 */
router.post('/', requireAdminOnly, setConfig);

/**
 * @route DELETE /api/system-configs/:key
 * @desc Xóa config
 * @access Admin only
 */
router.delete('/:key', requireAdminOnly, deleteConfig);

/**
 * @route POST /api/system-configs/clear-cache
 * @desc Clear config cache
 * @access Admin only
 */
router.post('/clear-cache', requireAdminOnly, clearConfigCache);

export default router;
