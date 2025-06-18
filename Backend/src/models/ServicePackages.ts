import mongoose from 'mongoose';

export interface IServicePackages {
  name: string;
  description?: string;
  priceBeforeDiscount: number;
  price: number;
  serviceIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  durationInDays: number;       // 🔹 Thời hạn sử dụng tính theo ngày (30, 90...)
  maxUsages: number;           // 🔹 Số lượt được dùng tối đa cho toàn gói
  maxProfiles: number[];       // 🔹 [1, 2, 4] - Số người tối đa có thể sử dụng gói
  isMultiProfile: boolean;     // 🔹 Gói này có hỗ trợ nhiều hồ sơ không
  createdAt: Date;
  updatedAt: Date;
}

const ServicePackagesSchema = new mongoose.Schema<IServicePackages>({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  priceBeforeDiscount: { 
    type: Number, 
    required: true,
    min: 0
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  serviceIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Services' 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  durationInDays: {
    type: Number,
    required: true,
    default: 30,
    min: 1
  },
  maxUsages: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  maxProfiles: [{
    type: Number,
    required: true,
    min: 1
  }],
  isMultiProfile: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
ServicePackagesSchema.index({ name: 1 });
ServicePackagesSchema.index({ isActive: 1 });
ServicePackagesSchema.index({ price: 1 });

const ServicePackages = mongoose.model<IServicePackages>('ServicePackages', ServicePackagesSchema);

export default ServicePackages; 