import { Request, Response } from "express";
import mongoose from "mongoose";
import { Notification, Order, Payment } from "../models";

// Lấy chi tiết thanh toán
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: "ID thanh toán không hợp lệ" });
    }
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán" });
    }
    
    return res.status(200).json(payment);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Cập nhật trạng thái thanh toán
export const updatePaymentStatus = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const paymentId = req.params.id;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: "ID thanh toán không hợp lệ" });
    }
    
    if (!status || !["pending", "completed", "failed"].includes(status)) {
      return res.status(400).json({ 
        message: "Trạng thái thanh toán không hợp lệ. Phải là một trong các giá trị: pending, completed, failed" 
      });
    }
    
    // Tìm thanh toán cần cập nhật
    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán" });
    }
    
    // Cập nhật trạng thái thanh toán
    payment.status = status;
    await payment.save({ session });
    
    // Nếu thanh toán hoàn tất, cập nhật trạng thái đơn hàng
    if (status === "completed") {
      const order = await Order.findById(payment.orderId).session(session);
      if (order && order.status === "pending") {
        order.status = "shipped";
        await order.save({ session });
        
        // Tạo thông báo cho người dùng
        const notification = new Notification({
          userId: order.userId,
          orderId: order._id,
          type: "order_update",
          message: `Đơn hàng #${order._id} của bạn đã được thanh toán và đang được vận chuyển.`,
          status: "unread"
        });
        await notification.save({ session });
      }
    } else if (status === "failed") {
      // Nếu thanh toán thất bại, cập nhật thông báo
      const order = await Order.findById(payment.orderId).session(session);
      if (order) {
        const notification = new Notification({
          userId: order.userId,
          orderId: order._id,
          type: "order_update",
          message: `Thanh toán cho đơn hàng #${order._id} đã thất bại. Vui lòng thử lại.`,
          status: "unread"
        });
        await notification.save({ session });
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json(payment);
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: error.message });
  }
};

// Tạo thanh toán mới cho đơn hàng
export const createPayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { orderId, amount, paymentMethod } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Số tiền thanh toán phải lớn hơn 0" });
    }
    
    if (!paymentMethod || !["credit_card", "paypal", "bank_transfer"].includes(paymentMethod)) {
      return res.status(400).json({ 
        message: "Phương thức thanh toán không hợp lệ. Phải là một trong các giá trị: credit_card, paypal, bank_transfer" 
      });
    }
    
    // Kiểm tra đơn hàng tồn tại
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    
    // Kiểm tra đơn hàng đã có thanh toán chưa
    if (order.paymentId) {
      const existingPayment = await Payment.findById(order.paymentId).session(session);
      if (existingPayment && existingPayment.status === "completed") {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Đơn hàng này đã được thanh toán" });
      }
    }
    
    // Tạo thanh toán mới
    const newPayment = new Payment({
      orderId,
      amount,
      paymentMethod,
      status: "pending"
    });
    
    const savedPayment = await newPayment.save({ session });
    
    // Cập nhật payment trong order
    order.paymentId = savedPayment._id;
    await order.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(201).json(savedPayment);
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả thanh toán cho admin
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const status = req.query.status as string;
    
    // Xây dựng query
    let query: any = {};
    
    // Lọc theo trạng thái
    if (status && ["pending", "completed", "failed"].includes(status)) {
      query.status = status;
    }
    
    // Thực thi truy vấn với phân trang
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("orderId");
    
    // Đếm tổng số thanh toán
    const total = await Payment.countDocuments(query);
    
    return res.status(200).json({
      payments,
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