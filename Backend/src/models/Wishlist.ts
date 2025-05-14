import mongoose, { Schema } from "mongoose";

export interface IWishlist {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  color: string;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
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
    color: { type: String, default: "" },
  },
  { timestamps: true }
);

// Tạo index cho userId để tối ưu hóa truy vấn
wishlistSchema.index({ userId: 1 });

const Wishlist = mongoose.model<IWishlist>("Wishlist", wishlistSchema);

export default Wishlist; 