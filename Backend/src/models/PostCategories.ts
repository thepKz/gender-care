import mongoose from 'mongoose';

export interface IPostCategories {
  postId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
}

const PostCategoriesSchema = new mongoose.Schema<IPostCategories>({
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BlogPosts', 
    required: true 
  },
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BlogCategories', 
    required: true 
  }
}, { timestamps: false }); // Không cần timestamps

// Tạo index để tối ưu hóa truy vấn
PostCategoriesSchema.index({ postId: 1 });
PostCategoriesSchema.index({ categoryId: 1 });
PostCategoriesSchema.index({ postId: 1, categoryId: 1 }, { unique: true }); // Composite unique

const PostCategories = mongoose.model<IPostCategories>('PostCategories', PostCategoriesSchema);

export default PostCategories; 