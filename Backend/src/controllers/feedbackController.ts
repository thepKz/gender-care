import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import feedbackService from '../services/feedbackService';

// POST /api/feedbacks - Tạo feedback mới cho appointment đã completed
export const createFeedback = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🎯 FeedbackController.createFeedback reached!');
    console.log('📝 Request body:', req.body);
    console.log('👤 User info:', { userId: req.user?._id, userEmail: req.user?.email });

    const { appointmentId, rating, feedback, comment, doctorRating, serviceQuality } = req.body;
    const userId = req.user?._id;

    console.log('🔍 Extracted fields:', { appointmentId, rating, feedback, comment, doctorRating, serviceQuality, userId });

    // Validate required fields
    if (!userId) {
      console.log('❌ No userId found');
      return res.status(401).json({
        success: false,
        message: 'Cần đăng nhập để gửi đánh giá'
      });
    }

    if (!appointmentId || !rating || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId, rating và feedback là bắt buộc'
      });
    }

    // ✅ SANITIZATION: Clean and validate appointmentId
    const cleanAppointmentId = appointmentId.trim();
    
    // MongoDB ObjectId validation
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(cleanAppointmentId)) {
      console.log('❌ Invalid appointmentId format in createFeedback:', {
        original: appointmentId,
        cleaned: cleanAppointmentId,
        length: cleanAppointmentId.length
      });
      return res.status(400).json({
        success: false,
        message: 'appointmentId không hợp lệ'
      });
    }

    console.log('✅ Valid appointmentId in createFeedback:', cleanAppointmentId);

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating phải từ 1 đến 5'
      });
    }

    // Validate doctorRating nếu có
    if (doctorRating && (doctorRating < 1 || doctorRating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá bác sĩ phải từ 1 đến 5'
      });
    }

    // Validate serviceQuality nếu có
    if (serviceQuality && (serviceQuality < 1 || serviceQuality > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá chất lượng dịch vụ phải từ 1 đến 5'
      });
    }

    // Sử dụng service để tạo feedback
    console.log('📞 Calling feedbackService.createFeedback...');
    const newFeedback = await feedbackService.createFeedback({
      appointmentId: cleanAppointmentId,
      rating,
      feedback,
      comment,
      userId,
      doctorRating,
      serviceQuality
    });
    console.log('✅ Service call completed successfully');

    res.status(200).json({
      success: true,
      message: 'Gửi đánh giá thành công. Cảm ơn bạn đã chia sẻ trải nghiệm!',
      data: newFeedback
    });

  } catch (error: any) {
    console.error('Error creating feedback:', error);
    
    // Handle business logic errors
    if (error.message.includes('Không tìm thấy') || 
        error.message.includes('không thể') || 
        error.message.includes('Chỉ có thể') ||
        error.message.includes('đã được đánh giá')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đánh giá',
      error: error.message
    });
  }
};

// GET /api/feedbacks/appointment/:appointmentId - Lấy feedback của appointment
export const getFeedbackByAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user?._id;

    console.log('🔍 getFeedbackByAppointment called with:', {
      appointmentId,
      userId,
      originalUrl: req.originalUrl,
      params: req.params,
      query: req.query
    });

    if (!userId) {
      console.log('❌ No userId found in request');
      return res.status(401).json({
        success: false,
        message: 'Cần đăng nhập để xem đánh giá'
      });
    }

    // ✅ VALIDATION: Check if appointmentId is provided and valid format
    if (!appointmentId) {
      console.log('❌ No appointmentId provided in request params');
      return res.status(400).json({
        success: false,
        message: 'appointmentId là bắt buộc'
      });
    }

    // ✅ SANITIZATION: Clean appointmentId
    const cleanAppointmentId = appointmentId.trim();
    
    // MongoDB ObjectId validation
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(cleanAppointmentId)) {
      console.log('❌ Invalid appointmentId format:', {
        original: appointmentId,
        cleaned: cleanAppointmentId,
        length: cleanAppointmentId.length
      });
      return res.status(400).json({
        success: false,
        message: 'appointmentId không hợp lệ'
      });
    }

    console.log('✅ Valid appointmentId:', cleanAppointmentId);

    // Sử dụng service để lấy feedback
    const feedback = await feedbackService.getFeedbackByAppointment(cleanAppointmentId, userId);

    console.log('✅ Successfully retrieved feedback:', feedback ? 'Found' : 'Not found');

    res.json({
      success: true,
      data: feedback
    });

  } catch (error: any) {
    console.error('❌ Error getting feedback by appointment:', {
      error: error.message,
      stack: error.stack,
      appointmentId: req.params?.appointmentId,
      userId: req.user?._id
    });
    
    // Handle business logic errors
    if (error.message.includes('Không tìm thấy') || 
        error.message.includes('chỉ có thể') ||
        error.message.includes('Chưa có đánh giá')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy đánh giá',
      error: error.message
    });
  }
};

// GET /api/feedbacks/user - Lấy tất cả feedback của user
export const getUserFeedbacks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Cần đăng nhập để xem đánh giá'
      });
    }

    // Sử dụng service để lấy user feedbacks
    const userFeedbacks = await feedbackService.getUserFeedbacks(userId);

    res.json({
      success: true,
      data: userFeedbacks,
      total: userFeedbacks.length
    });

  } catch (error: any) {
    console.error('Error getting user feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đánh giá',
      error: error.message
    });
  }
};

// PUT /api/feedbacks/:id - Cập nhật feedback (nếu cho phép edit)
export const updateFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, feedback, comment } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Cần đăng nhập để cập nhật đánh giá'
      });
    }

    // Validate rating nếu có
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating phải từ 1 đến 5'
      });
    }

    // Sử dụng service để update feedback
    const updatedFeedback = await feedbackService.updateFeedback(id, {
      rating,
      feedback,
      comment,
      userId
    }, userId);

    res.json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: updatedFeedback
    });

  } catch (error: any) {
    console.error('Error updating feedback:', error);
    
    // Handle business logic errors
    if (error.message.includes('Không tìm thấy') || 
        error.message.includes('chỉ có thể') ||
        error.message.includes('Rating phải')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật đánh giá',
      error: error.message
    });
  }
};

// GET /api/feedbacks/doctor/:doctorId - Lấy tất cả feedback của doctor (public)
export const getDoctorFeedbacks = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    console.log('🔍 getDoctorFeedbacks called with:', {
      doctorId,
      page,
      limit,
      originalUrl: req.originalUrl
    });

    if (!doctorId) {
      console.log('❌ No doctorId provided in request params');
      return res.status(400).json({
        success: false,
        message: 'doctorId là bắt buộc'
      });
    }

    // ✅ SANITIZATION: Clean and validate doctorId
    const cleanDoctorId = doctorId.trim();
    
    // MongoDB ObjectId validation
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(cleanDoctorId)) {
      console.log('❌ Invalid doctorId format:', {
        original: doctorId,
        cleaned: cleanDoctorId,
        length: cleanDoctorId.length
      });
      return res.status(400).json({
        success: false,
        message: 'doctorId không hợp lệ'
      });
    }

    console.log('✅ Valid doctorId:', cleanDoctorId);

    const result = await feedbackService.getDoctorFeedbacks(cleanDoctorId, page, limit);

    console.log('✅ Successfully retrieved doctor feedbacks:', {
      totalFeedbacks: result.feedbacks.length,
      totalCount: result.totalCount
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đánh giá thành công',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Error getting doctor feedbacks:', {
      error: error.message,
      stack: error.stack,
      doctorId: req.params?.doctorId
    });
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đánh giá',
      error: error.message
    });
  }
}; 