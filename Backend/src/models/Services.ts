import mongoose from 'mongoose';

export interface IServices {
  serviceName: string;
  price: number;
  description?: string;
  isDeleted: boolean;
  serviceType: "consultation" | "test" | "treatmeant" | "other";
  availableAt: string[]; // ["Athome", "Online", "Center"]
}

const ServicesSchema = new mongoose.Schema<IServices>({
  serviceName: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  description: { 
    type: String 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  serviceType: { 
    type: String, 
    enum: ["consultation", "test", "other"],
    required: true 
  },
  availableAt: [{ 
    type: String, 
    enum: ["Athome", "Online", "Center"]
  }]
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
ServicesSchema.index({ serviceName: 1 });
ServicesSchema.index({ serviceType: 1 });
ServicesSchema.index({ isDeleted: 1 });
ServicesSchema.index({ price: 1 });

const Services = mongoose.model<IServices>('Services', ServicesSchema);

export default Services; 