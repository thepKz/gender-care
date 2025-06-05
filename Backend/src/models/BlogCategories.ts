import mongoose from 'mongoose';

export interface IBlogCategories {
  name: string;
  slug: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BlogCategoriesSchema = new mongoose.Schema<IBlogCategories>({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  slug: { 
    type: String, 
    required: true,
    unique: true 
  },
  description: { 
    type: String 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
BlogCategoriesSchema.index({ name: 1 });
BlogCategoriesSchema.index({ slug: 1 });

const BlogCategories = mongoose.model<IBlogCategories>('BlogCategories', BlogCategoriesSchema);

export default BlogCategories; 