import mongoose from 'mongoose';

export interface INotificationDays {
  reminderId: mongoose.Types.ObjectId;
  notificationTimes: Date;
  status: "send" | "failed";
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
    enum: ["send", "failed"],
    required: true 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
NotificationDaysSchema.index({ reminderId: 1 });
NotificationDaysSchema.index({ notificationTimes: 1 });
NotificationDaysSchema.index({ status: 1 });

const NotificationDays = mongoose.model<INotificationDays>('NotificationDays', NotificationDaysSchema);

export default NotificationDays; 