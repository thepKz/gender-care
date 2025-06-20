import mongoose from 'mongoose';

export interface IPackagePurchases {
  userId: mongoose.Types.ObjectId;       // Ai là người mua
  profileId: mongoose.Types.ObjectId;    // Hồ sơ bệnh án nào sử dụng gói này
  packageId: mongoose.Types.ObjectId;    // FK đến ServicePackages._id
  billId: mongoose.Types.ObjectId;       // Liên kết hóa đơn thanh toán
  activatedAt: Date;                     // 🔹 Ngày bắt đầu sử dụng gói
  expiredAt: Date;                       // 🔹 Ngày hết hạn (tính từ activatedAt + durationInDays)
  remainingUsages: number;               // 🔹 Số lượt còn lại có thể dùng
  totalAllowedUses: number;              // 🔹 Tổng lượt ban đầu được dùng
  isActive: boolean;                     // 🔹 Gói còn hiệu lực hay đã hết hạn/lượt
  createdAt?: Date;
  updatedAt?: Date;
}

const PackagePurchasesSchema = new mongoose.Schema<IPackagePurchases>({
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
  packageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ServicePackage', 
    required: true 
  },
  billId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Bills', 
    required: true 
  },
  activatedAt: {
    type: Date,
    required: true,
    default: Date.now,
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'activatedAt cannot be in the future'
    }
  },
  expiredAt: {
    type: Date,
    required: true,
    validate: {
      validator: function(value: Date) {
        return value > this.activatedAt;
      },
      message: 'expiredAt must be after activatedAt'
    }
  },
  remainingUsages: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value) && value >= 0 && value <= this.totalAllowedUses;
      },
      message: 'remainingUsages must be a non-negative integer not exceeding totalAllowedUses'
    }
  },
  totalAllowedUses: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value) && value >= 1;
      },
      message: 'totalAllowedUses must be a positive integer'
    }
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  }
}, { timestamps: true });

// Pre-save middleware để tự động tính expiredAt và validate logic
PackagePurchasesSchema.pre('save', async function(next) {
  try {
    // Nếu document mới và chưa có expiredAt, tính từ package
    if (this.isNew && !this.expiredAt) {
      const ServicePackage = mongoose.model('ServicePackage');
      const packageDoc = await ServicePackage.findById(this.packageId);
      
      if (!packageDoc) {
        return next(new Error('Package not found'));
      }
      
      // Set expiredAt dựa trên activatedAt + durationInDays
      const expiredDate = new Date(this.activatedAt);
      expiredDate.setDate(expiredDate.getDate() + (packageDoc.durationInDays || 30));
      this.expiredAt = expiredDate;
      
      // Set totalAllowedUses từ package nếu chưa có
      if (!this.totalAllowedUses) {
        this.totalAllowedUses = packageDoc.maxUsages || 1;
      }
      
      // Set remainingUsages nếu chưa có
      if (this.remainingUsages === undefined) {
        this.remainingUsages = this.totalAllowedUses;
      }
    }
    
    // Tự động update isActive dựa trên expiry và usage
    const now = new Date();
    this.isActive = (
      this.expiredAt > now && 
      this.remainingUsages > 0
    );
    
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method để consume một lượt sử dụng
PackagePurchasesSchema.methods.consumeUsage = function() {
  if (!this.isActive) {
    throw new Error('Package is not active');
  }
  
  if (this.remainingUsages <= 0) {
    throw new Error('No remaining usages');
  }
  
  this.remainingUsages -= 1;
  
  // Update isActive status
  const now = new Date();
  this.isActive = (
    this.expiredAt > now && 
    this.remainingUsages > 0
  );
  
  return this.save();
};

// Virtual để check xem package có expired không
PackagePurchasesSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiredAt;
});

// Virtual để check xem package có exhausted usage không
PackagePurchasesSchema.virtual('isExhausted').get(function() {
  return this.remainingUsages <= 0;
});

// Index để tối ưu hóa truy vấn
PackagePurchasesSchema.index({ userId: 1 });
PackagePurchasesSchema.index({ profileId: 1 });
PackagePurchasesSchema.index({ packageId: 1 });
PackagePurchasesSchema.index({ billId: 1 });
PackagePurchasesSchema.index({ isActive: 1 });
PackagePurchasesSchema.index({ expiredAt: 1 });
PackagePurchasesSchema.index({ userId: 1, isActive: 1 });
PackagePurchasesSchema.index({ profileId: 1, isActive: 1 });

const PackagePurchases = mongoose.model<IPackagePurchases>('PackagePurchases', PackagePurchasesSchema);

export default PackagePurchases; 