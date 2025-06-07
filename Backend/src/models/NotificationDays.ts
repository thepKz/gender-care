import mongoose from 'mongoose';

export interface INotificationDays {
  reminderId: mongoose.Types.ObjectId;
  notificationTimes: Date;
  status: "pending" | "sent" | "failed" | "taken" | "skipped" | "snoozed";
  reason?: string; // Lý do nếu user skip, snooze hoặc ghi chú khi taken
  takenAt?: Date; // Thời gian user đánh dấu đã uống
  snoozedUntil?: Date; // Thời gian hoãn đến
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationDaysSchema = new mongoose.Schema<INotificationDays>({
  reminderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MedicationReminders', 
    required: true 
  },
  notificationTimes: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "sent", "failed", "taken", "skipped", "snoozed"],
    default: "pending",
    required: true 
  },
  reason: { 
    type: String 
  },
  takenAt: { 
    type: Date 
  },
  snoozedUntil: { 
    type: Date 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
NotificationDaysSchema.index({ reminderId: 1 });
NotificationDaysSchema.index({ notificationTimes: 1 });
NotificationDaysSchema.index({ status: 1 });
NotificationDaysSchema.index({ takenAt: 1 });

const NotificationDays = mongoose.model<INotificationDays>('NotificationDays', NotificationDaysSchema);

export default NotificationDays; 