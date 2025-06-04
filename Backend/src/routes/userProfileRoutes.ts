import { Router } from 'express';
import * as userProfileController from '../controllers/userProfileController';
import { verifyToken, verifyStaff } from '../middleware/auth';

const router = Router();

// Tạo profile mới - chỉ user đã đăng nhập
router.post('/', verifyToken, userProfileController.createProfile);

// Lấy profile của chính mình - chỉ user đã đăng nhập
router.get('/me', verifyToken, userProfileController.getMyProfile);

// Lấy tất cả profiles - chỉ admin/staff
router.get('/', verifyToken, verifyStaff, userProfileController.getAllProfiles);

// Lấy profile theo ID - owner hoặc admin/staff
router.get('/:id', verifyToken, userProfileController.getProfileById);

// Cập nhật profile - owner hoặc admin/staff
router.put('/:id', verifyToken, userProfileController.updateProfile);

// Xóa profile - owner hoặc admin
router.delete('/:id', verifyToken, userProfileController.deleteProfile);

export default router; 