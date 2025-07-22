import Feedbacks, { IFeedbacks } from '../models/Feedbacks';
import Appointments from '../models/Appointments';
import Doctor from '../models/Doctor';
import mongoose from 'mongoose';

interface CreateFeedbackData {
  appointmentId: string;
  rating: number;
  feedback: string;
  comment?: string;
  userId: string;
  doctorRating?: number;
  serviceQuality?: number;
}

interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

class FeedbackService {
  // Tạo feedback mới với validation nghiệp vụ
  async createFeedback(data: CreateFeedbackData): Promise<IFeedbacks> {
    const { appointmentId, rating, feedback, comment, userId, doctorRating, serviceQuality } = data;

    console.log('🔍 FeedbackService.createFeedback called with:', data);

    // Validate appointmentId format
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new Error('appointmentId không hợp lệ');
    }

    // Validate appointment và quyền sở hữu
    const appointment = await Appointments.findById(appointmentId)
      .populate('doctorId')
      .populate('serviceId')
      .populate('packageId');

    console.log('📋 Found appointment:', appointment ? 'Yes' : 'No');
    if (appointment) {
      console.log('📋 Appointment details:', {
        id: appointment._id,
        status: appointment.status,
        createdByUserId: appointment.createdByUserId,
        doctorId: appointment.doctorId?._id,
        serviceId: appointment.serviceId?._id
      });
    }

    if (!appointment) {
      throw new Error('Không tìm thấy lịch hẹn');
    }

    console.log('🔍 Checking ownership:', {
      appointmentOwner: appointment.createdByUserId.toString(),
      requestUser: userId,
      isOwner: appointment.createdByUserId.toString() === userId
    });

    if (appointment.createdByUserId.toString() !== userId) {
      throw new Error('Bạn chỉ có thể đánh giá lịch hẹn của mình');
    }

    console.log('🔍 Checking status:', {
      currentStatus: appointment.status,
      isCompleted: appointment.status === 'completed'
    });

    if (appointment.status !== 'completed') {
      throw new Error('Chỉ có thể đánh giá lịch hẹn đã hoàn thành');
    }

    // Kiểm tra đã có feedback chưa
    console.log('🔍 Checking existing feedback...');
    const existingFeedback = await Feedbacks.findOne({ appointmentId });
    console.log('📋 Existing feedback found:', existingFeedback ? 'Yes' : 'No');
    
    if (existingFeedback) {
      console.log('🔄 Updating existing feedback instead of creating new one');
      
      try {
        // Cập nhật feedback hiện tại using findByIdAndUpdate
        const updatedFeedback = await Feedbacks.findByIdAndUpdate(
          existingFeedback._id,
          {
            rating,
            feedback,
            comment: comment || '',
            doctorRating: doctorRating || rating,
            serviceQuality: serviceQuality || rating
          },
          { new: true } // Return updated document
        );

        console.log('✅ Existing feedback updated successfully');
        
        // Cập nhật rating trung bình của doctor nếu có
        if (appointment.doctorId) {
          console.log('📊 Updating doctor average rating...');
          await this.updateDoctorAverageRating(appointment.doctorId._id);
        }
        
        // Populate và return
        console.log('🔗 Populating updated feedback data...');
        await updatedFeedback?.populate([
          { path: 'appointmentId', select: 'appointmentDate appointmentTime status' },
          { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName' } },
          { path: 'serviceId', select: 'serviceName' },
          { path: 'packageId', select: 'name' }
        ]);
        
        console.log('🎉 Feedback update completed successfully');
        return updatedFeedback!;
      } catch (error) {
        console.error('❌ Error updating existing feedback:', error);
        throw error;
      }
    }

    // Tạo feedback mới
    console.log('💾 Creating new feedback with data:', {
      rating,
      feedback,
      comment: comment || '',
      doctorRating: doctorRating || rating,
      serviceQuality: serviceQuality || rating,
      appointmentId,
      doctorId: appointment.doctorId?._id,
      serviceId: appointment.serviceId?._id,
      packageId: appointment.packageId?._id
    });

    try {
      const newFeedback = new Feedbacks({
        rating,
        feedback,
        comment: comment || '',
        doctorRating: doctorRating || rating, // Fallback về rating chung nếu không có doctorRating
        serviceQuality: serviceQuality || rating, // Fallback về rating chung nếu không có serviceQuality
        appointmentId,
        doctorId: appointment.doctorId?._id,
        serviceId: appointment.serviceId?._id,
        packageId: appointment.packageId?._id
      });

      console.log('💾 Saving feedback to database...');
      await newFeedback.save();
      console.log('✅ Feedback saved successfully');

      // Cập nhật rating trung bình của doctor nếu có
      // Sử dụng doctorRating riêng biệt nếu có, fallback về rating tổng quan
      if (appointment.doctorId) {
        console.log('📊 Updating doctor average rating...');
        await this.updateDoctorAverageRating(appointment.doctorId._id);
      }

      // Populate và return
      console.log('🔗 Populating feedback data...');
      await newFeedback.populate([
        { path: 'appointmentId', select: 'appointmentDate appointmentTime status' },
        { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName' } },
        { path: 'serviceId', select: 'serviceName' },
        { path: 'packageId', select: 'name' }
      ]);

      console.log('🎉 Feedback creation completed successfully');
      return newFeedback;
    } catch (error) {
      console.error('❌ Error creating new feedback:', error);
      throw error;
    }
  }

  // Lấy feedback của appointment cụ thể
  async getFeedbackByAppointment(appointmentId: string, userId: string): Promise<IFeedbacks> {
    // Kiểm tra quyền sở hữu appointment
    const appointment = await Appointments.findById(appointmentId);
    if (!appointment) {
      throw new Error('Không tìm thấy lịch hẹn');
    }

    if (appointment.createdByUserId.toString() !== userId) {
      throw new Error('Bạn chỉ có thể xem đánh giá lịch hẹn của mình');
    }

    const feedback = await Feedbacks.findOne({ appointmentId })
      .populate([
        { path: 'appointmentId', select: 'appointmentDate appointmentTime status' },
        { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName' } },
        { path: 'serviceId', select: 'serviceName' },
        { path: 'packageId', select: 'name' }
      ]);

    if (!feedback) {
      throw new Error('Chưa có đánh giá cho lịch hẹn này');
    }

    return feedback;
  }

  // Lấy tất cả feedback của user
  async getUserFeedbacks(userId: string): Promise<IFeedbacks[]> {
    const feedbacks = await Feedbacks.find({})
      .populate([
        { 
          path: 'appointmentId', 
          match: { createdByUserId: userId },
          select: 'appointmentDate appointmentTime status createdByUserId',
          populate: {
            path: 'profileId',
            select: 'fullName'
          }
        },
        { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName' } },
        { path: 'serviceId', select: 'serviceName' },
        { path: 'packageId', select: 'name' }
      ]);

    // Lọc ra chỉ những feedback có appointment thuộc về user
    return feedbacks.filter(feedback => feedback.appointmentId !== null);
  }

  // Cập nhật feedback
  async updateFeedback(feedbackId: string, updateData: Partial<CreateFeedbackData>, userId: string): Promise<IFeedbacks> {
    const existingFeedback = await Feedbacks.findById(feedbackId)
      .populate('appointmentId');

    if (!existingFeedback) {
      throw new Error('Không tìm thấy đánh giá');
    }

    // Kiểm tra quyền sở hữu
    const appointment = existingFeedback.appointmentId as any;
    if (appointment.createdByUserId.toString() !== userId) {
      throw new Error('Bạn chỉ có thể cập nhật đánh giá của mình');
    }

    // Validate rating
    if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
      throw new Error('Rating phải từ 1 đến 5');
    }

    // Cập nhật
    const updateFields: any = {};
    if (updateData.rating !== undefined) updateFields.rating = updateData.rating;
    if (updateData.feedback !== undefined) updateFields.feedback = updateData.feedback;
    if (updateData.comment !== undefined) updateFields.comment = updateData.comment;
    updateFields.updatedAt = new Date();

    const updatedFeedback = await Feedbacks.findByIdAndUpdate(
      feedbackId,
      updateFields,
      { new: true, runValidators: true }
    ).populate([
      { path: 'appointmentId', select: 'appointmentDate appointmentTime status' },
      { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName' } },
      { path: 'serviceId', select: 'serviceName' },
      { path: 'packageId', select: 'name' }
    ]);

    if (!updatedFeedback) {
      throw new Error('Không thể cập nhật đánh giá');
    }

    // Cập nhật lại rating trung bình của doctor
    if (updateData.rating && appointment.doctorId) {
      await this.updateDoctorAverageRating(appointment.doctorId);
    }

    return updatedFeedback;
  }

  // Lấy thống kê feedback của doctor
  async getDoctorFeedbackStats(doctorId: string): Promise<FeedbackStats> {
    const feedbacks = await Feedbacks.find({ doctorId });

    if (feedbacks.length === 0) {
      return {
        totalFeedbacks: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    // Sử dụng doctorRating nếu có, fallback về rating chung
    const totalRating = feedbacks.reduce((sum, feedback) => sum + (feedback.doctorRating || feedback.rating), 0);
    const averageRating = totalRating / feedbacks.length;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(feedback => {
      const rating = feedback.doctorRating || feedback.rating;
      ratingDistribution[rating as keyof typeof ratingDistribution]++;
    });

    return {
      totalFeedbacks: feedbacks.length,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingDistribution
    };
  }

  // Cập nhật rating trung bình của doctor
  private async updateDoctorAverageRating(doctorId: mongoose.Types.ObjectId): Promise<void> {
    try {
      const stats = await this.getDoctorFeedbackStats(doctorId.toString());
      
      await Doctor.findByIdAndUpdate(doctorId, {
        rating: stats.averageRating
      });

      console.log(`Updated doctor ${doctorId} rating to ${stats.averageRating}`);
    } catch (error) {
      console.error(`Error updating doctor rating for ${doctorId}:`, error);
      // Không throw error để không ảnh hưởng đến luồng chính
    }
  }

  // Lấy feedback gần đây (để hiển thị dashboard)
  async getRecentFeedbacks(limit: number = 10): Promise<IFeedbacks[]> {
    return await Feedbacks.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate([
        { path: 'appointmentId', select: 'appointmentDate appointmentTime' },
        { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName' } },
        { path: 'serviceId', select: 'serviceName' }
      ]);
  }

  // Kiểm tra appointment có thể feedback không
  async canGiveFeedback(appointmentId: string, userId: string): Promise<boolean> {
    try {
      const appointment = await Appointments.findById(appointmentId);
      if (!appointment) return false;
      
      // Kiểm tra ownership
      if (appointment.createdByUserId.toString() !== userId) return false;
      
      // Kiểm tra status
      if (appointment.status !== 'completed') return false;
      
      // Kiểm tra đã có feedback chưa
      const existingFeedback = await Feedbacks.findOne({ appointmentId });
      if (existingFeedback) return false;
      
      return true;
    } catch {
      return false;
    }
  }

  // Lấy tất cả feedback của doctor để hiển thị trên profile
  async getDoctorFeedbacks(doctorId: string, page: number = 1, limit: number = 10, ratingFilter?: number, showHidden?: boolean): Promise<{
    feedbacks: IFeedbacks[];
    totalCount: number;
    averageRating: number;
    stats: FeedbackStats;
  }> {
    const skip = (page - 1) * limit;

    // Build query with rating filter
    const query: any = { doctorId };
    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      query.rating = ratingFilter;
    }
    if (!showHidden) {
      query.isHidden = false;
    }

    // Lấy feedbacks với pagination và populate thông tin khách hàng
    const feedbacks = await Feedbacks.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate([
        { 
          path: 'appointmentId', 
          select: 'appointmentDate appointmentTime profileId',
          populate: {
            path: 'profileId',
            select: 'fullName gender phone'
          }
        },
        { path: 'serviceId', select: 'serviceName' },
        { path: 'packageId', select: 'name' }
      ]);

    // Lấy tổng số feedback (với filter nếu có)
    const totalCount = await Feedbacks.countDocuments(query);

    // Lấy thống kê (không filter để show tổng quan)
    const stats = await this.getDoctorFeedbackStats(doctorId);

    return {
      feedbacks,
      totalCount,
      averageRating: stats.averageRating,
      stats
    };
  }

  // Ẩn/hiện feedback
  async hideFeedback(feedbackId: string, isHidden: boolean): Promise<IFeedbacks | null> {
    return await Feedbacks.findByIdAndUpdate(
      feedbackId,
      { isHidden },
      { new: true }
    );
  }

  // Xóa feedback
  async deleteFeedback(feedbackId: string): Promise<boolean> {
    const result = await Feedbacks.findByIdAndDelete(feedbackId);
    return !!result;
  }
}

export default new FeedbackService(); 