import mongoose from 'mongoose';

export interface IPromotions {
  name: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: Date;
  endDate: Date;
  maxUses?: number;
  usedCount: number;
  applicablePackages: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PromotionsSchema = new mongoose.Schema<IPromotions>({
  name: { 
    type: String, 
    required: true 
  },
  code: { 
    type: String, 
    required: true,
    unique: true 
  },
  discountType: { 
    type: String, 
    enum: ["percentage", "fixed"],
    required: true 
  },
  discountValue: { 
    type: Number, 
    required: true,
    min: 0
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  maxUses: { 
    type: Number 
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  applicablePackages: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ServicePackages' 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
PromotionsSchema.index({ code: 1 });
PromotionsSchema.index({ isActive: 1 });
PromotionsSchema.index({ startDate: 1, endDate: 1 });

const Promotions = mongoose.model<IPromotions>('Promotions', PromotionsSchema);

export default Promotions; 