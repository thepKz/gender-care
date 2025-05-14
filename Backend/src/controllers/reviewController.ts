import { Request, Response } from "express";
import mongoose from "mongoose";
import { Review } from "../models";

// Lấy đánh giá cho một sản phẩm
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }
    
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .populate("userId", "username avatar");
    
    return res.status(200).json(reviews);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả đánh giá của một người dùng
export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    
    const reviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .populate("productId", "name price imageUrl");
    
    return res.status(200).json(reviews);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Tạo đánh giá mới
export const createReview = async (req: Request, res: Response) => {
  try {
    const { userId, productId, rating, comment } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Đánh giá phải từ 1 đến 5 sao" });
    }
    
    // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      return res.status(400).json({ 
        message: "Bạn đã đánh giá sản phẩm này rồi. Vui lòng cập nhật đánh giá cũ thay vì tạo mới." 
      });
    }
    
    // Tạo đánh giá mới
    const review = new Review({
      userId,
      productId,
      rating,
      comment: comment || ""
    });
    
    const savedReview = await review.save();
    
    // Lấy review với thông tin người dùng
    const populatedReview = await Review.findById(savedReview._id)
      .populate("userId", "username avatar")
      .populate("productId", "name price");
    
    return res.status(201).json(populatedReview);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Cập nhật đánh giá
export const updateReview = async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.id;
    const { rating, comment } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "ID đánh giá không hợp lệ" });
    }
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Đánh giá phải từ 1 đến 5 sao" });
    }
    
    // Tìm và cập nhật đánh giá
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { rating, comment },
      { new: true, runValidators: true }
    )
      .populate("userId", "username avatar")
      .populate("productId", "name price");
    
    if (!updatedReview) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }
    
    return res.status(200).json(updatedReview);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Xóa đánh giá
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "ID đánh giá không hợp lệ" });
    }
    
    const deletedReview = await Review.findByIdAndDelete(reviewId);
    
    if (!deletedReview) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }
    
    return res.status(200).json({ message: "Đã xóa đánh giá thành công" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Tìm kiếm đánh giá
export const searchReviews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Lấy các tham số tìm kiếm
    const productId = req.query.productId as string;
    const userId = req.query.userId as string;
    const minRating = req.query.minRating ? parseInt(req.query.minRating as string) : undefined;
    const maxRating = req.query.maxRating ? parseInt(req.query.maxRating as string) : undefined;
    const keyword = req.query.keyword as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const sortBy = req.query.sortBy as string || "createdAt";
    const sortOrder = req.query.sortOrder as string || "desc";
    
    // Xây dựng query tìm kiếm
    const searchQuery: any = {};
    
    // Tìm theo ID sản phẩm
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      searchQuery.productId = new mongoose.Types.ObjectId(productId);
    }
    
    // Tìm theo ID người dùng
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      searchQuery.userId = new mongoose.Types.ObjectId(userId);
    }
    
    // Tìm theo khoảng đánh giá
    if (minRating !== undefined || maxRating !== undefined) {
      searchQuery.rating = {};
      if (minRating !== undefined) searchQuery.rating.$gte = minRating;
      if (maxRating !== undefined) searchQuery.rating.$lte = maxRating;
    }
    
    // Tìm theo từ khóa trong comment
    if (keyword) {
      searchQuery.comment = { $regex: keyword, $options: "i" };
    }
    
    // Tìm theo khoảng thời gian
    if (startDate !== undefined || endDate !== undefined) {
      searchQuery.createdAt = {};
      if (startDate !== undefined) searchQuery.createdAt.$gte = startDate;
      if (endDate !== undefined) {
        // Đặt thời gian kết thúc vào cuối ngày
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        searchQuery.createdAt.$lte = endOfDay;
      }
    }
    
    // Xác định hướng sắp xếp
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    
    // Thực hiện tìm kiếm với bộ lọc, sắp xếp và phân trang
    const reviews = await Review.find(searchQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("userId", "username avatar")
      .populate("productId", "name price");
    
    // Đếm tổng số kết quả
    const total = await Review.countDocuments(searchQuery);
    
    // Thêm thông tin meta
    const filters = {
      productId: productId || undefined,
      userId: userId || undefined,
      minRating: minRating || undefined,
      maxRating: maxRating || undefined,
      keyword: keyword || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc"
    };
    
    return res.status(200).json({
      reviews,
      filters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}; 