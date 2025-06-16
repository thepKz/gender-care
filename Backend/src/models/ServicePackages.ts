import mongoose from 'mongoose';

export interface IServicePackages {
  name: string;
  description?: string;
  priceBeforeDiscount: number;
  price: number;
  serviceIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
ServicePackagesSchema.index({ name: 1 });
ServicePackagesSchema.index({ isActive: 1 });
ServicePackagesSchema.index({ price: 1 });

const ServicePackages = mongoose.model<IServicePackages>('ServicePackages', ServicePackagesSchema);

export default ServicePackages; 