import mongoose from 'mongoose';

export interface IBills {
  userId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  billNumber: string;
  packageId?: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  promotionId?: mongoose.Types.ObjectId;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  status: "pending" | "paid" | "cancelled";
  createdAt?: Date;
  updatedAt?: Date;
}

const BillsSchema = new mongoose.Schema<IBills>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  profileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserProfile', 
    required: true 
  },
  billNumber: { 
    type: String, 
    required: true,
    unique: true 
  },
  packageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ServicePackages' 
  },
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointments' 
  },
  promotionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Promotions' 
  },
  subtotal: { 
    type: Number, 
    required: true,
    min: 0
  },
  discountAmount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  status: { 
    type: String, 
    enum: ["pending", "paid", "cancelled"],
    default: "pending" 
  }
}, { timestamps: true });

// Validation: packageId hoặc appointmentId phải có ít nhất 1 cái
BillsSchema.pre('save', function() {
  if (!this.packageId && !this.appointmentId) {
    throw new Error('Ít nhất một trong packageId hoặc appointmentId phải được cung cấp');
  }
});

// Tạo index để tối ưu hóa truy vấn
BillsSchema.index({ userId: 1 });
BillsSchema.index({ billNumber: 1 });
BillsSchema.index({ status: 1 });
BillsSchema.index({ createdAt: -1 });

const Bills = mongoose.model<IBills>('Bills', BillsSchema);

export default Bills; 