import mongoose from 'mongoose';

export interface IServicePackages extends mongoose.Document {
  name: string;
  description: string;
  priceBeforeDiscount: number;  // Giá gốc được tính tự động từ tổng giá dịch vụ x maxUsages
  price: number;                // Giá đã giảm (nếu có)
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
    min: 0,
    validate: {
      validator: function(value: number) {
        return value >= 0;
      },
      message: 'Price before discount must be non-negative'
    }
  },
  price: { 
    type: Number, 
    required: true,
    min: 0,
    validate: {
      validator: function(value: number) {
        return value >= 0;
      },
      message: 'Price must be non-negative'
    }
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
    min: 1,
    max: 365,
    default: 30,
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value) && value >= 1 && value <= 365;
      },
      message: 'durationInDays must be an integer between 1 and 365'
    }
  },
  maxUsages: {
    type: Number,
    required: true,
    min: 1,
    max: 1000,
    default: 1,
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value) && value >= 1 && value <= 1000;
      },
      message: 'maxUsages must be an integer between 1 and 1000'
    }
  },
  maxProfiles: {
    type: [Number],
    required: true,
    default: [1],
    validate: {
      validator: function(profiles: number[]) {
        // Validate that all numbers are valid profile counts (1-4)
        return profiles.length > 0 && profiles.every(p => Number.isInteger(p) && p >= 1 && p <= 4);
      },
      message: 'maxProfiles must contain valid profile counts (1-4)'
    }
  },
  isMultiProfile: {
    type: Boolean,
    required: true,
    default: false,
    validate: {
      validator: function(value: boolean) {
        if (value === true) {
          // If isMultiProfile is true, maxProfiles should contain values > 1
          return this.maxProfiles && this.maxProfiles.some((p: number) => p > 1);
        }
        return true; // Single profile packages are always valid
      },
      message: 'Multi-profile packages must support more than 1 profile'
    }
  }
}, { timestamps: true });

// Pre-save validation để đảm bảo logic consistency
ServicePackagesSchema.pre('save', function(next) {
  // Validate price <= priceBeforeDiscount
  if (this.price > this.priceBeforeDiscount) {
    return next(new Error('Price cannot be higher than original price (priceBeforeDiscount)'));
  }
  
  // Auto-set isMultiProfile based on maxProfiles
  this.isMultiProfile = this.maxProfiles.some(p => p > 1);
  
  next();
});

// Indexes for performance
ServicePackagesSchema.index({ name: 1 });
ServicePackagesSchema.index({ isActive: 1 });
ServicePackagesSchema.index({ serviceIds: 1 });
ServicePackagesSchema.index({ durationInDays: 1 });
ServicePackagesSchema.index({ maxUsages: 1 });
ServicePackagesSchema.index({ maxProfiles: 1 });
ServicePackagesSchema.index({ isMultiProfile: 1 });

export default mongoose.model<IServicePackages>('ServicePackages', ServicePackagesSchema); 