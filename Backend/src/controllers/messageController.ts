import { Request, Response } from "express";
import { Message } from "../models";

// Lấy tất cả tin nhắn liên hệ (cho admin)
export const getAllMessages = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Lấy tin nhắn với phân trang
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Đếm tổng số tin nhắn
    const total = await Message.countDocuments();
    
    return res.status(200).json({
      messages,
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

// Lấy chi tiết tin nhắn
export const getMessageById = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.id;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }
    
    return res.status(200).json(message);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Tạo tin nhắn liên hệ mới
export const createMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: "Tên, email và nội dung tin nhắn là bắt buộc" 
      });
    }
    
    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Định dạng email không hợp lệ" });
    }
    
    // Tạo tin nhắn mới
    const newMessage = new Message({
      name,
      email,
      message
    });
    
    const savedMessage = await newMessage.save();
    
    return res.status(201).json({
      message: "Đã gửi tin nhắn liên hệ thành công",
      data: savedMessage
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Xóa tin nhắn
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.id;
    
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    
    if (!deletedMessage) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }
    
    return res.status(200).json({ message: "Đã xóa tin nhắn thành công" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}; 