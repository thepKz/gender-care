import { Router } from 'express';
import * as staffController from '../controllers/staffController';
import { verifyToken } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { requireRole } from '../middleware/roleHierarchy';

const router = Router();

// ===== STAFF CRUD ROUTES =====

// Lấy danh sách tất cả nhân viên - MANAGER/ADMIN
router.get('/', verifyToken, requireRole('manager'), staffController.getAll);

// Lấy thông tin nhân viên theo ID - MANAGER/ADMIN
router.get('/:id', verifyToken, requireRole('manager'), staffController.getById);

// Tạo nhân viên mới - chỉ admin và manager được phép
router.post('/', verifyToken, roleMiddleware(['admin', 'manager']), staffController.create);

// Cập nhật thông tin nhân viên - MANAGER/ADMIN
router.put('/:id', verifyToken, requireRole('manager'), staffController.update);

// Xóa nhân viên - chỉ admin và manager được phép (high risk operation)
router.delete('/:id', verifyToken, roleMiddleware(['admin', 'manager']), staffController.remove);

export default router; 