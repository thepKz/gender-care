import mongoose from 'mongoose';

export interface IServiceTestCategories {
  serviceId: mongoose.Types.ObjectId;
  testCategoryId: mongoose.Types.ObjectId;
  isRequired: boolean;
  customNormalRange?: string; // Range riêng cho service này (override TestCategories.normalRange)
  customUnit?: string;        // Unit riêng cho service này (override TestCategories.unit)
  targetValue?: string;       // Giá trị mục tiêu ideal cho service này
  notes?: string;             // Ghi chú cho staff/doctor
  createdAt?: Date;
  updatedAt?: Date;
}

const ServiceTestCategoriesSchema = new mongoose.Schema<IServiceTestCategories>({
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: true 
  },
  testCategoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TestCategories', 
    required: true 
  },
  isRequired: { 
    type: Boolean, 
    default: true 
  },
  customNormalRange: {
    type: String,
    trim: true
  },
  customUnit: {
    type: String,
    trim: true
  },
  targetValue: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true
});

// Tạo index để tối ưu hóa truy vấn
ServiceTestCategoriesSchema.index({ serviceId: 1 });
ServiceTestCategoriesSchema.index({ testCategoryId: 1 });
ServiceTestCategoriesSchema.index({ serviceId: 1, testCategoryId: 1 }, { unique: true });

const ServiceTestCategories = mongoose.model<IServiceTestCategories>('ServiceTestCategories', ServiceTestCategoriesSchema);

export default ServiceTestCategories; 