import { Router } from 'express';
import * as doctorController from '../controllers/doctorController';
import { verifyToken, verifyAdmin, verifyStaff } from '../middleware/auth';

const router = Router();

// Xem danh sách bác sĩ - tất cả mọi người đều được phép (kể cả guest)
router.get('/', doctorController.getAll);

// Xem thông tin chi tiết bác sĩ theo ID - chỉ staff/admin được phép (bao gồm contact info)
router.get('/:id', verifyToken, verifyStaff, doctorController.getById);

// Tạo bác sĩ mới - chỉ admin được phép
router.post('/', verifyToken, verifyAdmin, doctorController.create);

// Cập nhật thông tin bác sĩ - staff/admin được phép
router.put('/:id', verifyToken, verifyStaff, doctorController.update);

// Xóa bác sĩ - chỉ admin được phép (high risk operation)
router.delete('/:id', verifyToken, verifyAdmin, doctorController.remove);

export default router;