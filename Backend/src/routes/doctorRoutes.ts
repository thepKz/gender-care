import { Router } from 'express';
import * as doctorController from '../controllers/doctorController';
import { verifyToken, verifyAdmin, verifyStaff } from '../middleware/auth';

const router = Router();

// Xem danh sách bác sĩ - tất cả mọi người đều được phép (kể cả guest)
router.get('/', doctorController.getAll);

// Xem thông tin bác sĩ theo ID - tất cả mọi người đều được phép (kể cả guest)  
router.get('/:id', doctorController.getById);

// Xem thông tin liên hệ bác sĩ - chỉ staff/admin được phép
router.get('/:id/contact', verifyToken, verifyStaff, doctorController.getContactInfo);

// Tạo bác sĩ mới - chỉ admin được phép
router.post('/', verifyToken, verifyAdmin, doctorController.create);

// Cập nhật thông tin bác sĩ - chỉ staff/admin được phép
router.put('/:id', verifyToken, verifyStaff, doctorController.update);

// Xóa bác sĩ - chỉ staff/admin được phép
router.delete('/:id', verifyToken, verifyStaff, doctorController.remove);

export default router;
