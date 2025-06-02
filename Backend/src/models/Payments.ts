import mongoose from 'mongoose';

export interface IPayments {
  userId: mongoose.Types.ObjectId;
  billId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: "credit_card" | "bank_transfer" | "mobile_payment" | "cash";
  paymentGateway?: string;
  transactionId?: string;
  status: "pending" | "completed" | "failed" | "refunded";
  failureReason?: string;
  paymentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentsSchema = new mongoose.Schema<IPayments>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  billId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Bills', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  paymentMethod: { 
    type: String, 
    enum: ["credit_card", "bank_transfer", "mobile_payment", "cash"],
    required: true 
  },
  paymentGateway: { 
    type: String 
  },
  transactionId: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending" 
  },
  failureReason: { 
    type: String 
  },
  paymentAt: { 
    type: Date 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
PaymentsSchema.index({ userId: 1 });
PaymentsSchema.index({ billId: 1 });
PaymentsSchema.index({ status: 1 });
PaymentsSchema.index({ transactionId: 1 });
PaymentsSchema.index({ paymentAt: -1 });

const Payments = mongoose.model<IPayments>('Payments', PaymentsSchema);

export default Payments; 