import { Request, Response } from "express";
import mongoose from "mongoose";
import { Product, Wishlist } from "../models";

// Lấy danh sách yêu thích của người dùng
export const getWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    
    // Tìm tất cả items trong wishlist của user
    const wishlistItems = await Wishlist.find({ userId })
      .populate("productId", "name price description variants");
    
    return res.status(200).json(wishlistItems);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Thêm sản phẩm vào danh sách yêu thích
export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const { productId, color } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    
    // Kiểm tra sản phẩm đã tồn tại trong danh sách yêu thích chưa
    const existingItem = await Wishlist.findOne({ userId, productId });
    
    if (existingItem) {
      return res.status(400).json({ 
        message: "Sản phẩm đã tồn tại trong danh sách yêu thích" 
      });
    }
    
    // Thêm sản phẩm vào danh sách yêu thích
    const wishlistItem = new Wishlist({
      userId,
      productId,
      color: color || ""
    });
    
    await wishlistItem.save();
    
    // Trả về item mới với thông tin sản phẩm
    const newItem = await Wishlist.findById(wishlistItem._id)
      .populate("productId", "name price description variants");
    
    return res.status(201).json(newItem);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Xóa sản phẩm khỏi danh sách yêu thích
export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const itemId = req.params.itemId;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    
    // Xóa sản phẩm khỏi danh sách yêu thích
    const result = await Wishlist.findOneAndDelete({ 
      _id: itemId,
      userId 
    });
    
    if (!result) {
      return res.status(404).json({ 
        message: "Không tìm thấy sản phẩm trong danh sách yêu thích" 
      });
    }
    
    return res.status(200).json({ 
      message: "Đã xóa sản phẩm khỏi danh sách yêu thích",
      itemId
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Kiểm tra sản phẩm có trong danh sách yêu thích không
export const checkWishlistItem = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const productId = req.params.productId;
    
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    
    // Kiểm tra sản phẩm có trong danh sách yêu thích không
    const item = await Wishlist.findOne({ userId, productId });
    
    return res.status(200).json({ 
      inWishlist: !!item,
      item
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Xóa toàn bộ danh sách yêu thích
export const clearWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    
    // Xóa toàn bộ danh sách yêu thích
    const result = await Wishlist.deleteMany({ userId });
    
    return res.status(200).json({ 
      message: "Đã xóa toàn bộ danh sách yêu thích",
      deletedCount: result.deletedCount 
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}; 