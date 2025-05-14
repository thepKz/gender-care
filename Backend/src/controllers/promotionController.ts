import { Request, Response } from "express";
import { Notification, Promotion, User } from "../models";

// Lấy tất cả khuyến mãi đang hoạt động
export const getActivePromotions = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const promotions = await Promotion.find({
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ endDate: 1 });
    
    return res.status(200).json(promotions);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả khuyến mãi (bao gồm cả đã hết hạn)
export const getAllPromotions = async (req: Request, res: Response) => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 });
    return res.status(200).json(promotions);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết khuyến mãi theo mã
export const getPromotionByCode = async (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    const promotion = await Promotion.findOne({ code: code.toUpperCase() });
    
    if (!promotion) {
      return res.status(404).json({ message: "Không tìm thấy mã khuyến mãi" });
    }
    
    // Kiểm tra khuyến mãi có hiệu lực không
    const now = new Date();
    const isValid = promotion.startDate <= now && now <= promotion.endDate;
    
    return res.status(200).json({
      promotion,
      isValid
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Kiểm tra mã khuyến mãi có hợp lệ không
export const validatePromotion = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: "Mã khuyến mãi là bắt buộc" });
    }
    
    const promotion = await Promotion.findOne({ code: code.toUpperCase() });
    
    if (!promotion) {
      return res.status(404).json({ 
        valid: false,
        message: "Mã khuyến mãi không tồn tại" 
      });
    }
    
    const now = new Date();
    
    if (now < promotion.startDate) {
      return res.status(400).json({ 
        valid: false, 
        message: `Mã khuyến mãi chưa bắt đầu. Vui lòng quay lại sau ${promotion.startDate.toLocaleDateString()}` 
      });
    }
    
    if (now > promotion.endDate) {
      return res.status(400).json({ 
        valid: false, 
        message: "Mã khuyến mãi đã hết hạn" 
      });
    }
    
    return res.status(200).json({ 
      valid: true, 
      promotion 
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Tạo khuyến mãi mới
export const createPromotion = async (req: Request, res: Response) => {
  try {
    const { code, discount, startDate, endDate } = req.body;
    
    if (!code || discount === undefined || !startDate || !endDate) {
      return res.status(400).json({ 
        message: "Mã, mức giảm, ngày bắt đầu và ngày kết thúc là bắt buộc" 
      });
    }
    
    // Kiểm tra mã đã tồn tại chưa
    const existingPromotion = await Promotion.findOne({ code: code.toUpperCase() });
    if (existingPromotion) {
      return res.status(400).json({ message: "Mã khuyến mãi đã tồn tại" });
    }
    
    // Chuyển đổi ngày
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Kiểm tra ngày kết thúc phải sau ngày bắt đầu
    if (endDateObj <= startDateObj) {
      return res.status(400).json({ 
        message: "Ngày kết thúc phải sau ngày bắt đầu" 
      });
    }
    
    // Tạo khuyến mãi mới
    const promotion = new Promotion({
      code: code.toUpperCase(),
      discount,
      startDate: startDateObj,
      endDate: endDateObj
    });
    
    const savedPromotion = await promotion.save();
    
    // Gửi thông báo cho tất cả người dùng về khuyến mãi mới
    const users = await User.find({}, '_id');
    const notifications = users.map(user => ({
      userId: user._id,
      type: "promotion",
      message: `Mã khuyến mãi mới: ${code.toUpperCase()} - Giảm ${discount}%. Có hiệu lực từ ${startDateObj.toLocaleDateString()} đến ${endDateObj.toLocaleDateString()}.`,
      status: "unread"
    }));
    
    await Notification.insertMany(notifications);
    
    return res.status(201).json(savedPromotion);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Cập nhật khuyến mãi
export const updatePromotion = async (req: Request, res: Response) => {
  try {
    const promotionId = req.params.id;
    const { discount, startDate, endDate } = req.body;
    
    // Tìm khuyến mãi cần cập nhật
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      return res.status(404).json({ message: "Không tìm thấy khuyến mãi" });
    }
    
    // Chuyển đổi ngày
    const startDateObj = startDate ? new Date(startDate) : promotion.startDate;
    const endDateObj = endDate ? new Date(endDate) : promotion.endDate;
    
    // Kiểm tra ngày kết thúc phải sau ngày bắt đầu
    if (endDateObj <= startDateObj) {
      return res.status(400).json({ 
        message: "Ngày kết thúc phải sau ngày bắt đầu" 
      });
    }
    
    // Cập nhật khuyến mãi
    promotion.discount = discount !== undefined ? discount : promotion.discount;
    promotion.startDate = startDateObj;
    promotion.endDate = endDateObj;
    
    const updatedPromotion = await promotion.save();
    
    return res.status(200).json(updatedPromotion);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Xóa khuyến mãi
export const deletePromotion = async (req: Request, res: Response) => {
  try {
    const promotionId = req.params.id;
    
    const deletedPromotion = await Promotion.findByIdAndDelete(promotionId);
    
    if (!deletedPromotion) {
      return res.status(404).json({ message: "Không tìm thấy khuyến mãi" });
    }
    
    return res.status(200).json({ message: "Đã xóa khuyến mãi thành công" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}; 