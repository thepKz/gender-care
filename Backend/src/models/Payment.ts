import mongoose, { Schema } from "mongoose";

export interface IPayment {
  orderId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: "credit_card" | "paypal" | "bank_transfer";
  status: "pending" | "completed" | "failed";
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { 
      type: Schema.Types.ObjectId, 
      ref: "Order", 
      required: true 
    },
    amount: { type: Number, required: true },
    paymentMethod: { 
      type: String, 
      enum: ["credit_card", "paypal", "bank_transfer"], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ["pending", "completed", "failed"], 
      default: "pending"
    },
  },
  { timestamps: true }
);

// Tạo index cho orderId để tối ưu hóa truy vấn
paymentSchema.index({ orderId: 1 });

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment; 