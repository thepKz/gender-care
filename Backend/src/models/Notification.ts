import mongoose, { Schema } from "mongoose";

export interface INotification {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  type: "order_update" | "promotion";
  message: string;
  status: "unread" | "read";
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    orderId: { 
      type: Schema.Types.ObjectId, 
      ref: "Order",
      default: null 
    },
    type: { 
      type: String, 
      enum: ["order_update", "promotion"], 
      required: true 
    },
    message: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["unread", "read"], 
      default: "unread"
    },
  },
  { timestamps: true }
);

// Tạo index cho userId để tối ưu hóa truy vấn
notificationSchema.index({ userId: 1 });

const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification; 