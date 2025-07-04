import mongoose from 'mongoose';

export interface ITestCategories {
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TestCategoriesSchema = new mongoose.Schema<ITestCategories>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Tạo index để tối ưu hóa truy vấn
TestCategoriesSchema.index({ name: 1 });

const TestCategories = mongoose.model<ITestCategories>('TestCategories', TestCategoriesSchema);

export default TestCategories; 