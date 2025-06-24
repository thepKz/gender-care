import mongoose from 'mongoose';

// 🔹 Service item trong gói với quantity
export interface IServiceItem {
  serviceId: mongoose.Types.ObjectId;
  quantity: number;
}

// 🔹 Interface mới đơn giản hóa
export interface IServicePackages {
  name: string;
  description?: string;
  priceBeforeDiscount: number;
  price: number;
  services: IServiceItem[];      // 🔹 NEW: Thay thế serviceIds với quantity
  durationInDays: number;        // 🔹 Thời hạn sử dụng tính theo ngày (30, 90...)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 🔹 Schema cho service item
const ServiceItemSchema = new mongoose.Schema({
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service',
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  }
});

// 🔹 Schema chính đã được đơn giản hóa
const ServicePackagesSchema = new mongoose.Schema<IServicePackages>({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  priceBeforeDiscount: { 
    type: Number, 
    required: true,
    min: [0, 'Price before discount must be non-negative']
  },
  price: { 
    type: Number, 
    required: true,
    min: [0, 'Price must be non-negative']
  },
  services: {
    type: [ServiceItemSchema],
    required: true,
    validate: {
      validator: function(services: IServiceItem[]) {
        return services && services.length > 0;
      },
      message: 'Package must contain at least one service'
    }
  },
  durationInDays: {
    type: Number,
    required: true,
    default: 30,
    min: [1, 'Duration must be at least 1 day'],
    max: [365, 'Duration cannot exceed 365 days']
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// 🔹 Pre-save validation để đảm bảo logic pricing
ServicePackagesSchema.pre('save', function(next) {
  // Validation: price không được cao hơn priceBeforeDiscount
  if (this.price > this.priceBeforeDiscount) {
    return next(new Error('Discounted price cannot be higher than original price'));
  }
  
  // Validation: không có duplicate serviceId trong services array
  const serviceIds = this.services.map(s => s.serviceId.toString());
  const uniqueServiceIds = [...new Set(serviceIds)];
  if (serviceIds.length !== uniqueServiceIds.length) {
    return next(new Error('Duplicate services are not allowed in the same package'));
  }
  
  next();
});

// 🔹 Tạo index để tối ưu hóa truy vấn
ServicePackagesSchema.index({ name: 1 });
ServicePackagesSchema.index({ isActive: 1 });
ServicePackagesSchema.index({ price: 1 });
ServicePackagesSchema.index({ 'services.serviceId': 1 });

// 🔹 Method để tính tổng quantity của tất cả services
ServicePackagesSchema.methods.getTotalServiceQuantity = function(): number {
  return this.services.reduce((total: number, service: IServiceItem) => total + service.quantity, 0);
};

// 🔹 Method để check xem có service nào không
ServicePackagesSchema.methods.hasService = function(serviceId: string): boolean {
  return this.services.some((service: IServiceItem) => 
    service.serviceId.toString() === serviceId
  );
};

// 🔹 Method để lấy quantity của một service cụ thể
ServicePackagesSchema.methods.getServiceQuantity = function(serviceId: string): number {
  const service = this.services.find((s: IServiceItem) => 
    s.serviceId.toString() === serviceId
  );
  return service ? service.quantity : 0;
};

const ServicePackages = mongoose.model<IServicePackages>('ServicePackages', ServicePackagesSchema);

export default ServicePackages; 