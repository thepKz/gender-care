import mongoose, { Schema } from "mongoose";

export interface IReview {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    productId: { 
      type: Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    rating: { 
      type: Number, 
      required: true,
      min: 1,
      max: 5
    },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

// Tạo index cho productId để tối ưu hóa truy vấn
reviewSchema.index({ productId: 1 });

// Hook để cập nhật rating và reviewCount cho Product
reviewSchema.post('save', async function(doc) {
  const Review = this.constructor as mongoose.Model<IReview>;
  const Product = mongoose.model('Product');
  
  // Tính lại rating trung bình và số lượng đánh giá
  const stats = await Review.aggregate([
    { $match: { productId: doc.productId } },
    { 
      $group: { 
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Cập nhật thông tin cho Product
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(doc.productId, {
      rating: stats[0].avgRating,
      reviewCount: stats[0].count
    });
  } else {
    await Product.findByIdAndUpdate(doc.productId, {
      rating: 0,
      reviewCount: 0
    });
  }
});

const Review = mongoose.model<IReview>("Review", reviewSchema);

export default Review; 