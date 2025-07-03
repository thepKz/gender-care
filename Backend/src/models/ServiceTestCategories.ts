import mongoose from 'mongoose';

export interface IServiceTestCategories {
  serviceId: mongoose.Types.ObjectId;
  testCategoryId: mongoose.Types.ObjectId;
  isRequired: boolean;
  unit?: string; // Đơn vị đo
  targetValue?: string; // Giá trị mục tiêu ideal cho service này
  minValue?: number; // Giá trị tối thiểu cho khoảng dao động
  maxValue?: number; // Giá trị tối đa cho khoảng dao động
  thresholdRules?: Array<{
    from: number | null;
    to: number | null;
    flag: 'very_low' | 'low' | 'normal' | 'mild_high' | 'high' | 'critical';
    message: string;
  }>;
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
  unit: {
    type: String,
    trim: true
  },
  targetValue: {
    type: String,
    trim: true
  },
  minValue: {
    type: Number,
    min: 0
  },
  maxValue: {
    type: Number,
    min: 0
  },
  thresholdRules: [
    {
      from: { type: Number, default: null },
      to: { type: Number, default: null },
      flag: {
        type: String,
        enum: ['very_low', 'low', 'normal', 'mild_high', 'high', 'critical'],
        required: true
      },
      message: { type: String, required: true }
    }
  ]
}, {
  timestamps: true
});

// Tạo index để tối ưu hóa truy vấn
ServiceTestCategoriesSchema.index({ serviceId: 1 });
ServiceTestCategoriesSchema.index({ testCategoryId: 1 });
ServiceTestCategoriesSchema.index({ serviceId: 1, testCategoryId: 1 }, { unique: true });

const ServiceTestCategories = mongoose.model<IServiceTestCategories>('ServiceTestCategories', ServiceTestCategoriesSchema);

export default ServiceTestCategories; 