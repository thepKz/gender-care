import express from 'express';
import * as medicationRemindersController from '../controllers/medicationRemindersController';
import { verifyToken } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// User tạo reminder từ medical record
router.post('/',
  verifyToken,
  roleMiddleware(['customer']),
  medicationRemindersController.createMedicationReminder
);

// User xem reminders của mình
router.get('/my',
  verifyToken,
  roleMiddleware(['customer']),
  medicationRemindersController.getMyMedicationReminders
);

// User xem chi tiết reminder
router.get('/:id',
  verifyToken,
  medicationRemindersController.getMedicationReminderById
);

// User cập nhật reminder
router.put('/:id',
  verifyToken,
  roleMiddleware(['customer']),
  medicationRemindersController.updateMedicationReminder
);

// User tạm dừng/kích hoạt reminder
router.patch('/:id/status',
  verifyToken,
  roleMiddleware(['customer']),
  medicationRemindersController.toggleReminderStatus
);

// User xóa reminder
router.delete('/:id',
  verifyToken,
  roleMiddleware(['customer']),
  medicationRemindersController.deleteMedicationReminder
);

// Staff xem tất cả reminders
router.get('/staff/all',
  verifyToken,
  roleMiddleware(['staff', 'manager', 'admin']),
  medicationRemindersController.getAllMedicationReminders
);

export default router; 