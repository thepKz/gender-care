import mongoose from 'mongoose';

export interface IPackagePurchases {
  profileId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  packageId: mongoose.Types.ObjectId;
  billId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const PackagePurchasesSchema = new mongoose.Schema<IPackagePurchases>({
  profileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserProfiles', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  packageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ServicePackages', 
    required: true 
  },
  billId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Bills', 
    required: true 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
PackagePurchasesSchema.index({ profileId: 1 });
PackagePurchasesSchema.index({ userId: 1 });
PackagePurchasesSchema.index({ packageId: 1 });
PackagePurchasesSchema.index({ billId: 1 });

const PackagePurchases = mongoose.model<IPackagePurchases>('PackagePurchases', PackagePurchasesSchema);

export default PackagePurchases; 