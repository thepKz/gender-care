import express from 'express';
import * as medicinesController from '../controllers/medicinesController';
import { verifyToken } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// Lấy danh sách medicines (Doctor, Staff, Manager, Admin only - customer không được xem tất cả)
router.get('/',
  verifyToken,
  roleMiddleware(['doctor', 'staff', 'manager', 'admin']),
  medicinesController.getAllMedicines
);

// Lấy chi tiết medicine (All authenticated users except guest)
router.get('/:id',
  verifyToken,
  roleMiddleware(['customer', 'doctor', 'staff', 'manager', 'admin']),
  medicinesController.getMedicineById
);

// Tạo medicine (Manager/Admin only)
router.post('/',
  verifyToken,
  roleMiddleware(['manager', 'admin']),
  medicinesController.createMedicine
);

// Cập nhật medicine (Manager/Admin only)
router.put('/:id',
  verifyToken,
  roleMiddleware(['manager', 'admin']),
  medicinesController.updateMedicine
);

// Kích hoạt/vô hiệu hóa medicine (Manager/Admin only)
router.patch('/:id/status',
  verifyToken,
  roleMiddleware(['manager', 'admin']),
  medicinesController.toggleMedicineStatus
);

export default router; 