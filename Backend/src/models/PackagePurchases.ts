import mongoose from 'mongoose';

// 🔹 Service đã sử dụng với quantity đã dùng
export interface IUsedService {
  serviceId: mongoose.Types.ObjectId;
  usedQuantity: number;
  maxQuantity: number;    // Copy từ package khi mua
}

// 🔹 Interface cho instance methods
export interface IPackagePurchasesMethods {
  checkAndUpdateStatus(): string;
  useService(serviceId: string, quantity?: number): boolean;
  canUseService(serviceId: string, quantity?: number): boolean;
  getRemainingQuantity(serviceId: string): number;
}

// 🔹 Interface cho PackagePurchases đã đơn giản hóa
export interface IPackagePurchases {
  userId: mongoose.Types.ObjectId;
  packageId: mongoose.Types.ObjectId;
  billId?: mongoose.Types.ObjectId;  // Reference đến Bills
  purchasePrice: number;           // Giá đã mua (có thể khác giá hiện tại)
  status: 'active' | 'expired' | 'used_up';
  purchaseDate: Date;
  expiryDate: Date;               // purchaseDate + durationInDays
  usedServices: IUsedService[];   // Track usage của từng service
  createdAt: Date;
  updatedAt: Date;
}

// 🔹 Model type với methods
export type PackagePurchaseModel = mongoose.Model<IPackagePurchases, {}, IPackagePurchasesMethods>;
export type PackagePurchaseDocument = mongoose.Document<unknown, {}, IPackagePurchases> & 
  IPackagePurchases & 
  IPackagePurchasesMethods & { _id: mongoose.Types.ObjectId };

// 🔹 Schema cho used service
const UsedServiceSchema = new mongoose.Schema({
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service',
    required: true 
  },
  usedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Used quantity cannot be negative']
  },
  maxQuantity: {
    type: Number,
    required: true,
    min: [1, 'Max quantity must be at least 1']
  }
});

// 🔹 Schema đã đơn giản hóa với unique constraint
const PackagePurchasesSchema = new mongoose.Schema<IPackagePurchases, PackagePurchaseModel, IPackagePurchasesMethods>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Users', 
    required: true 
  },
  packageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ServicePackages', 
    required: true 
  },
  billId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Bills' 
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: [0, 'Purchase price must be non-negative']
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'expired', 'used_up'],
      message: 'Status must be: active, expired, or used_up'
    },
    default: 'active'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usedServices: {
    type: [UsedServiceSchema],
    default: []
  }
}, { timestamps: true });

// 🔒 DUPLICATE PREVENTION: Unique constraint để ngăn user mua cùng package nhiều lần khi còn active
PackagePurchasesSchema.index(
  { userId: 1, packageId: 1, status: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'active' },
    name: 'unique_active_user_package' 
  }
);

// 🔒 Performance indexes
PackagePurchasesSchema.index({ userId: 1, status: 1 });
PackagePurchasesSchema.index({ expiryDate: 1, status: 1 });

// 🔹 Method để check trạng thái hiện tại
PackagePurchasesSchema.methods.checkAndUpdateStatus = function(this: PackagePurchaseDocument) {
  const now = new Date();
  
  // Check expiry
  if (now > this.expiryDate) {
    this.status = 'expired';
    return this.status;
  }
  
  // Check if all services used up
  const allUsedUp = this.usedServices.every((service: IUsedService) => 
    service.usedQuantity >= service.maxQuantity
  );
  
  if (allUsedUp) {
    this.status = 'used_up';
    return this.status;
  }
  
  this.status = 'active';
  return this.status;
};

// 🔹 Method để sử dụng service
PackagePurchasesSchema.methods.useService = function(this: PackagePurchaseDocument, serviceId: string, quantity: number = 1): boolean {
  const serviceUsage = this.usedServices.find((service: IUsedService) => 
    service.serviceId.toString() === serviceId
  );
  
  if (!serviceUsage) {
    return false; // Service không có trong package
  }
  
  const remainingQuantity = serviceUsage.maxQuantity - serviceUsage.usedQuantity;
  if (remainingQuantity < quantity) {
    return false; // Không đủ quantity
  }
  
  serviceUsage.usedQuantity += quantity;
  return true;
};

// 🔹 Method để check xem service còn sử dụng được không
PackagePurchasesSchema.methods.canUseService = function(this: PackagePurchaseDocument, serviceId: string, quantity: number = 1): boolean {
  // Check status
  this.checkAndUpdateStatus();
  if (this.status !== 'active') {
    return false;
  }
  
  const serviceUsage = this.usedServices.find((service: IUsedService) => 
    service.serviceId.toString() === serviceId
  );
  
  if (!serviceUsage) {
    return false; // Service không có trong package
  }
  
  const remainingQuantity = serviceUsage.maxQuantity - serviceUsage.usedQuantity;
  return remainingQuantity >= quantity;
};

// 🔹 Method để lấy remaining quantity của service
PackagePurchasesSchema.methods.getRemainingQuantity = function(this: PackagePurchaseDocument, serviceId: string): number {
  const serviceUsage = this.usedServices.find((service: IUsedService) => 
    service.serviceId.toString() === serviceId
  );
  
  if (!serviceUsage) {
    return 0; // Service không có trong package
  }
  
  return Math.max(0, serviceUsage.maxQuantity - serviceUsage.usedQuantity);
};

// 🔹 Create và export model
const PackagePurchases = mongoose.model<IPackagePurchases, PackagePurchaseModel>('PackagePurchases', PackagePurchasesSchema);
export default PackagePurchases; 