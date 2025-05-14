import { Request, Response } from "express";
import mongoose from "mongoose";
import { Notification } from "../models";

// Lấy tất cả thông báo của người dùng
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Đếm số thông báo chưa đọc
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      status: "unread" 
    });
    
    // Lấy thông báo với phân trang
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("orderId", "status totalAmount");
    
    // Đếm tổng số thông báo
    const total = await Notification.countDocuments({ userId });
    
    return res.status(200).json({
      notifications,
      unreadCount,
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

// Đánh dấu thông báo đã đọc
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "ID thông báo không hợp lệ" });
    }
    
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { status: "read" },
      { new: true }
    );
    
    if (!updatedNotification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }
    
    return res.status(200).json(updatedNotification);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    
    const result = await Notification.updateMany(
      { userId, status: "unread" },
      { status: "read" }
    );
    
    return res.status(200).json({ 
      message: "Đã đánh dấu tất cả thông báo là đã đọc",
      updatedCount: result.modifiedCount
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Tạo thông báo mới (cho admin)
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { userId, orderId, type, message } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    
    if (orderId && !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
    }
    
    if (!type || !["order_update", "promotion"].includes(type)) {
      return res.status(400).json({ 
        message: "Loại thông báo không hợp lệ. Phải là một trong các giá trị: order_update, promotion" 
      });
    }
    
    if (!message) {
      return res.status(400).json({ message: "Nội dung thông báo là bắt buộc" });
    }
    
    const notification = new Notification({
      userId,
      orderId: orderId || null,
      type,
      message,
      status: "unread"
    });
    
    const savedNotification = await notification.save();
    
    return res.status(201).json(savedNotification);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Xóa thông báo
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "ID thông báo không hợp lệ" });
    }
    
    const deletedNotification = await Notification.findByIdAndDelete(notificationId);
    
    if (!deletedNotification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }
    
    return res.status(200).json({ message: "Đã xóa thông báo thành công" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}; 