import { Router } from 'express';
import * as userProfileController from '../controllers/userProfileController';
import { verifyToken, verifyStaff } from '../middleware/auth';
import { requireRole } from '../middleware/roleHierarchy';

const router = Router();

// ===== STAFF/MANAGER/ADMIN ROUTES =====

// GET /api/user-profiles - STAFF/MANAGER/ADMIN lấy tất cả profiles (có phân trang và filter)
router.get('/', verifyToken, requireRole('staff'), userProfileController.getAllProfiles);

// GET /api/user-profiles/user/:userId - STAFF/MANAGER/ADMIN lấy profiles theo userId (REMOVED - function không tồn tại)
// router.get('/user/:userId', verifyToken, requireRole('staff'), userProfileController.getProfilesByUserId);

// ===== USER ROUTES =====

// GET /api/user-profiles/my-profiles - User lấy profiles của chính mình
router.get('/my-profiles', verifyToken, userProfileController.getMyProfile);

// POST /api/user-profiles - Tạo profile mới (User hoặc Staff có thể tạo)
router.post('/', verifyToken, userProfileController.createProfile);

// GET /api/user-profiles/:id - Lấy profile theo ID (User chỉ được lấy profile của mình)
router.get('/:id', verifyToken, userProfileController.getProfileById);

// PUT /api/user-profiles/:id - Cập nhật profile (User chỉ được cập nhật profile của mình)
router.put('/:id', verifyToken, userProfileController.updateProfile);

// DELETE /api/user-profiles/:id - Xóa profile (User chỉ được xóa profile của mình)
router.delete('/:id', verifyToken, userProfileController.deleteProfile);

export default router; 