import express from 'express';
import * as notificationDaysController from '../controllers/notificationDaysController';
import { verifyToken } from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// User cập nhật status notification
router.put('/:id',
  verifyToken,
  roleMiddleware(['customer']),
  notificationDaysController.updateNotificationStatus
);

// User xem notifications của mình
router.get('/my',
  verifyToken,
  roleMiddleware(['customer']),
  notificationDaysController.getMyNotifications
);

// User xem notifications của một reminder cụ thể
router.get('/reminder/:reminderId',
  verifyToken,
  roleMiddleware(['customer']),
  notificationDaysController.getNotificationsByReminderId
);

// User đánh dấu đã uống thuốc
router.patch('/:id/taken',
  verifyToken,
  roleMiddleware(['customer']),
  notificationDaysController.markAsTaken
);

// User bỏ qua lần uống
router.patch('/:id/skipped',
  verifyToken,
  roleMiddleware(['customer']),
  notificationDaysController.markAsSkipped
);

// User hoãn thông báo
router.patch('/:id/snooze',
  verifyToken,
  roleMiddleware(['customer']),
  notificationDaysController.snoozeNotification
);

// Staff xem tất cả notifications
router.get('/staff/all',
  verifyToken,
  roleMiddleware(['staff', 'manager', 'admin']),
  notificationDaysController.getAllNotifications
);

// Staff lấy thống kê notifications
router.get('/staff/statistics',
  verifyToken,
  roleMiddleware(['staff', 'manager', 'admin']),
  notificationDaysController.getNotificationStatistics
);

export default router; 