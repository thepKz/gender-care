import mongoose from 'mongoose';

export interface IBlogPosts {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  authorId: mongoose.Types.ObjectId;
  thumbnail?: string;
  published: boolean;
  publishedAt?: Date;
  likes: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const BlogPostsSchema = new mongoose.Schema<IBlogPosts>({
  title: { 
    type: String, 
    required: true 
  },
  slug: { 
    type: String, 
    required: true,
    unique: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  excerpt: { 
    type: String 
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  thumbnail: { 
    type: String 
  },
  published: { 
    type: Boolean, 
    default: false 
  },
  publishedAt: { 
    type: Date 
  },
  likes: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
BlogPostsSchema.index({ title: 1 });
BlogPostsSchema.index({ slug: 1 });
BlogPostsSchema.index({ authorId: 1 });
BlogPostsSchema.index({ published: 1 });
BlogPostsSchema.index({ publishedAt: -1 });

const BlogPosts = mongoose.model<IBlogPosts>('BlogPosts', BlogPostsSchema);

export default BlogPosts; 