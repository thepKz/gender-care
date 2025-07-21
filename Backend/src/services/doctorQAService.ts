import mongoose from 'mongoose';
import { getDoctorStatistics } from './doctorService';
import { generateMeetingPassword } from '../utils/passwordGenerator'; // ➕ IMPORT password generator
import DoctorQA from '../models/DoctorQA'; // ➕ IMPORT DoctorQA model
import { releaseSlot } from './doctorScheduleService'; // ➕ IMPORT releaseSlot function


// Validate ObjectId helper
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ✨ NEW: Simple QA creation without auto-assignment
export const createDoctorQA = async (qaData: any) => {
  try {
    let { userId, fullName, phone, age, gender, question, notes } = qaData;

    // Validate userId
    if (!isValidObjectId(userId)) {
      throw new Error('User ID không hợp lệ');
    }

    // ➕ NEW: Validate age and gender
    if (!age || age < 1 || age > 100) {
      throw new Error('Tuổi phải từ 1 đến 100');
    }

    if (!gender || !['male', 'female'].includes(gender)) {
      throw new Error('Giới tính phải là "male" hoặc "female"');
    }

    console.log('🚀 [CREATE-QA] Starting simple QA creation...', { userId, fullName, age, gender });

    // STEP 1: Tìm service tư vấn online để lấy phí và thông tin
    console.log('💰 [CREATE-QA] Finding online consultation service...');
    const Service = require('../models/Service').default;
    
    const consultationService = await Service.findOne({
      serviceName: { $regex: /tư vấn.*online/i },
      serviceType: 'consultation',
      isDeleted: { $ne: true }
    });
    
    if (!consultationService) {
      throw new Error('Không tìm thấy dịch vụ tư vấn online trong hệ thống. Vui lòng tạo dịch vụ trước.');
    }

    console.log(`📋 [CREATE-QA] Found service: ${consultationService.serviceName} - ${consultationService.price}đ`);

    // STEP 2: Tạo QA chỉ với thông tin cơ bản, không auto-assign
    const newQA = await DoctorQA.create({
      userId,
      fullName,
      phone,
      age,                                    // ➕ NEW FIELD
      gender,                                // ➕ NEW FIELD
      question,
      notes,
      status: 'pending_payment',              // Chỉ pending, không assign doctor
      consultationFee: consultationService.price,
      serviceId: consultationService._id,
      serviceName: consultationService.serviceName
      // ❌ REMOVED: doctorId, appointmentDate, appointmentSlot, slotId
    });

    console.log(`📝 [CREATE-QA] Created QA ${newQA._id} without assignment`);

    // STEP 3: Populate và return
    const populatedQA = await DoctorQA.findById(newQA._id)
      .populate('userId', 'fullName email')
      .populate('serviceId', 'serviceName price description serviceType');

    console.log(`✅ [CREATE-QA] Successfully created basic QA:`);
    console.log(`   🏥 Service: ${consultationService.serviceName} - ${consultationService.price.toLocaleString('vi-VN')}đ`);
    console.log(`   👤 Customer: ${fullName}, ${age} tuổi, ${gender === 'male' ? 'Nam' : 'Nữ'}`);

    return populatedQA;

  } catch (error) {
    console.error('❌ [ERROR] Creating QA failed:', error);
    throw error;
  }
};

// ➕ NEW: Check if specific slot is available
export const checkSlotAvailability = async (date: string, slotTime: string): Promise<{
  available: boolean;
  doctorCount: number;
}> => {
  try {
    console.log(`🔍 [CHECK-SLOT] Checking availability for ${date} ${slotTime}`);
    
    // Import doctorScheduleService
    const { getAvailableDoctors } = require('./doctorScheduleService');
    
    // Get available doctors for specific slot
    const availableDoctors = await getAvailableDoctors(date, slotTime, false); // Public view
    
    const result = {
      available: availableDoctors.length > 0,
      doctorCount: availableDoctors.length
    };
    
    console.log(`✅ [CHECK-SLOT] Result: ${result.available ? 'Available' : 'Not available'} (${result.doctorCount} doctors)`);
    
    return result;
    
  } catch (error) {
    console.error('❌ [ERROR] Check slot availability failed:', error);
    throw error;
  }
};

// ➕ NEW: Get all 8 slots availability for a date
export const getAvailableSlotsForDate = async (date: string): Promise<{
  date: string;
  slots: Array<{
    slotTime: string;
    available: boolean;
    doctorCount: number;
  }>;
}> => {
  try {
    console.log(`📅 [DAILY-SLOTS] Getting all slots for ${date}`);
    
    // Import doctorScheduleService
    const { getAvailableDoctors } = require('./doctorScheduleService');
    
    // 8 fixed time slots
    const FIXED_TIME_SLOTS = [
      "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00",
      "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
    ];
    
    // Check availability for each slot
    const slotsAvailability = await Promise.all(
      FIXED_TIME_SLOTS.map(async (slotTime) => {
        try {
          const availableDoctors = await getAvailableDoctors(date, slotTime, false);
          return {
            slotTime,
            available: availableDoctors.length > 0,
            doctorCount: availableDoctors.length
          };
        } catch (error) {
          console.warn(`⚠️ [DAILY-SLOTS] Error checking slot ${slotTime}:`, error);
          return {
            slotTime,
            available: false,
            doctorCount: 0
          };
        }
      })
    );
    
    const result = {
      date,
      slots: slotsAvailability
    };
    
    const availableCount = slotsAvailability.filter(slot => slot.available).length;
    console.log(`✅ [DAILY-SLOTS] Found ${availableCount}/8 available slots for ${date}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ [ERROR] Get daily slots failed:', error);
    throw error;
  }
};

// 💳 CẬP NHẬT PAYMENT STATUS - Logic đơn giản hơn
export const updatePaymentStatus = async (qaId: string, paymentSuccess: boolean) => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('ID yêu cầu tư vấn không hợp lệ');
    }

    const qa = await DoctorQA.findById(qaId);
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    if (qa.status !== 'pending_payment') {
      throw new Error('Yêu cầu tư vấn này đã được xử lý hoặc không thể thanh toán');
    }

    if (paymentSuccess) {
      // Thanh toán thành công → chuyển sang scheduled
      const updatedQA = await DoctorQA.findByIdAndUpdate(
        qaId,
        { status: 'scheduled' },
        { new: true }
      ).populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      }).populate('userId', 'fullName email');

      console.log(`💰 [PAYMENT] QA ${qaId} payment successful`);
      return updatedQA;

    } else {
      // Thanh toán thất bại → release slot và cancel
      if (qa.doctorId && qa.slotId) {
        await releaseSlot(qa.slotId.toString());
      }

      const updatedQA = await DoctorQA.findByIdAndUpdate(
        qaId,
        { status: 'cancelled' },
        { new: true }
      ).populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      }).populate('userId', 'fullName email');

      console.log(`❌ [PAYMENT] QA ${qaId} payment failed, slot released`);
      return updatedQA;
    }

  } catch (error) {
    console.error('❌ [ERROR] Updating payment status failed:', error);
    throw error;
  }
};

// 📋 Lấy tất cả DoctorQA (cho admin/staff)
export const getAllDoctorQAs = async (filter: any = {}) => {
  try {
    return await DoctorQA.find(filter)
      .populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('userId', 'fullName email')
      .populate('serviceId', 'serviceName price description serviceType')
      .sort({ createdAt: -1 });

  } catch (error) {
    console.error('Error getting all DoctorQAs:', error);
    throw error;
  }
};

// 🔍 Lấy DoctorQA theo ID
export const getDoctorQAById = async (qaId: string) => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('ID yêu cầu tư vấn không hợp lệ');
    }

    const qa = await DoctorQA.findById(qaId)
      .populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('userId', 'fullName email')
      .populate('serviceId', 'serviceName price description serviceType');
    
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    return qa;

  } catch (error) {
    console.error('Error getting DoctorQA by ID:', error);
    throw error;
  }
};

// 👤 Lấy DoctorQA theo userId
export const getDoctorQAByUserId = async (userId: string) => {
  try {
    if (!isValidObjectId(userId)) {
      throw new Error('User ID không hợp lệ');
    }

    return await DoctorQA.find({ userId })
      .populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });

  } catch (error) {
    console.error('Error getting DoctorQA by userId:', error);
    throw error;
  }
};

// 👨‍⚕️ Lấy DoctorQA theo doctorId
export const getDoctorQAByDoctorId = async (doctorId: string) => {
  try {
    if (!isValidObjectId(doctorId)) {
      throw new Error('Doctor ID không hợp lệ');
    }

    return await DoctorQA.find({ doctorId })
      .populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });

  } catch (error) {
    console.error('Error getting DoctorQA by doctorId:', error);
    throw error;
  }
};

// ✅ Doctor confirm tư vấn
export const doctorConfirmQA = async (qaId: string, action: 'confirm' | 'reject') => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('ID yêu cầu tư vấn không hợp lệ');
    }

    const qa = await DoctorQA.findById(qaId);
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    if (qa.status !== 'scheduled') {
      throw new Error('Yêu cầu tư vấn chưa được lên lịch hoặc không thể confirm');
    }

    let newStatus;
    if (action === 'confirm') {
      newStatus = 'scheduled';
    } else {
      newStatus = 'cancelled';
      // Release slot if rejected
      if (qa.doctorId && qa.slotId) {
        await releaseSlot(qa.slotId.toString());
      }
    }

    const updatedQA = await DoctorQA.findByIdAndUpdate(
      qaId,
      { status: newStatus },
      { new: true }
    ).populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
     .populate('userId', 'fullName email');

    return updatedQA;

  } catch (error) {
    console.error('Error doctor confirming QA:', error);
    throw error;
  }
};

// 🔄 Cập nhật status (tổng quát)
export const updateQAStatus = async (qaId: string, newStatus: string, doctorNotes?: string) => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('ID yêu cầu tư vấn không hợp lệ');
    }

    const qa = await DoctorQA.findById(qaId);
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    const updateData: any = { status: newStatus };
    if (doctorNotes) {
      updateData.doctorNotes = doctorNotes;
    }

    // Nếu chuyển sang cancelled, release slot
    if (newStatus === 'cancelled' && qa.doctorId && qa.slotId) {
      await releaseSlot(qa.slotId.toString());
    }

    const updatedQA = await DoctorQA.findByIdAndUpdate(
      qaId,
      updateData,
      { new: true }
    ).populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
     .populate('userId', 'fullName email');

    return updatedQA;

  } catch (error) {
    console.error('Error updating QA status:', error);
    throw error;
  }
};

// 🗑️ Xóa DoctorQA
export const deleteDoctorQA = async (qaId: string) => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('ID yêu cầu tư vấn không hợp lệ');
    }

    const qa = await DoctorQA.findById(qaId);
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    // Release slot trước khi xóa
    if (qa.doctorId && qa.slotId) {
      await releaseSlot(qa.slotId.toString());
    }

    await DoctorQA.findByIdAndDelete(qaId);
    return qa;

  } catch (error) {
    console.error('Error deleting DoctorQA:', error);
    throw error;
  }
};

// 🧹 LEGACY FUNCTIONS - Keep for backward compatibility but deprecate
export const findLeastBookedDoctor = async (): Promise<string> => {
  console.warn('⚠️ [DEPRECATED] findLeastBookedDoctor is deprecated. Use getDoctorsWorkloadStatistics instead.');
  try {
    const stats = await getDoctorsWorkloadStatistics();
    return stats.length > 0 ? stats[0].doctorId : '';
  } catch (error) {
    throw error;
  }
};

export const findBestDoctorForNextSlot = async () => {
  console.warn('⚠️ [DEPRECATED] findBestDoctorForNextSlot is deprecated. Use assignDoctorToSelectedSlot instead.');
  throw new Error('Function deprecated. Use assignDoctorToSelectedSlot instead.');
};

// ⚠️ DEPRECATED - Logic cũ không còn sử dụng
export const scheduleQA = async (qaId: string) => {
  throw new Error('⚠️ [DEPRECATED] scheduleQA is deprecated. Slot assignment is done automatically during QA creation.');
};

/**
 * 🚫 Hủy cuộc tư vấn bởi bác sĩ với lý do
 * @param qaId - ID của QA
 * @param reason - Lý do hủy
 */
export const cancelConsultationByDoctor = async (qaId: string, reason: string) => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('ID yêu cầu tư vấn không hợp lệ');
    }

    // Tìm QA hiện tại để lấy slot info
    const qa = await DoctorQA.findById(qaId);
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    // Giải phóng slot nếu có slotId
    if (qa.doctorId && qa.slotId) {
      console.log(`🔓 [CANCEL-QA] Releasing slot ${qa.slotId} for QA ${qaId}`);
      await releaseSlot(qa.slotId.toString());
    }

    // Cập nhật status và notes
    const cancelNote = `[DOCTOR CANCELLED] ${reason}`;
    const existingNotes = qa.notes || '';
    const updatedNotes = existingNotes 
      ? `${existingNotes}\n\n${cancelNote}` 
      : cancelNote;

    const updatedQA = await DoctorQA.findByIdAndUpdate(
      qaId,
      { 
        $set: { 
          status: 'doctor_cancel',
          notes: updatedNotes
        } 
      },
      { new: true }
    ).populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
     .populate('userId', 'fullName email');

    // Sau khi cập nhật, set slot thành Absent
    if (qa.doctorId && qa.slotId && qa.appointmentDate) {
      const { updateDoctorSchedule } = require("./doctorScheduleService");
      await updateDoctorSchedule(qa.doctorId.toString(), {
        date: qa.appointmentDate,
        slotId: qa.slotId.toString(),
        status: "Absent"
      });
    }

    if (!updatedQA) {
      throw new Error('Không thể cập nhật yêu cầu tư vấn');
    }

    console.log(`✅ [QA-SERVICE] Cancelled consultation ${qaId} by doctor with reason: ${reason}`);
    return updatedQA;
  } catch (error) {
    console.error('❌ [ERROR] cancelConsultationByDoctor failed:', error);
    throw error;
  }
};

/**
 * 🔴 Lấy consultation đang LIVE hiện tại (status = 'consulting')
 * @param doctorId - ID của doctor cụ thể (optional, nếu không có thì lấy tất cả)
 */
export const getLiveConsultations = async (doctorId?: string) => {
  try {
    console.log('🔴 [LIVE-CONSULTATIONS] Getting live consultations...', { doctorId });
    
    // Build filter
    const filter: any = { status: 'consulting' };
    if (doctorId && isValidObjectId(doctorId)) {
      filter.doctorId = new mongoose.Types.ObjectId(doctorId);
    }
    
    const liveConsultations = await DoctorQA.find(filter)
      .populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('userId', 'fullName email')
      .populate('serviceId', 'serviceName price description serviceType')
      .sort({ appointmentDate: 1, appointmentSlot: 1 }); // Sort by appointment time

    console.log(`🔴 [LIVE-CONSULTATIONS] Found ${liveConsultations.length} live consultations`);
    
    return liveConsultations;

  } catch (error) {
    console.error('❌ [ERROR] Getting live consultations failed:', error);
    throw error;
  }
};

/**
 * 📅 Lấy tất cả consultation HÔM NAY (all statuses) 
 * @param doctorId - ID của doctor cụ thể (optional, nếu không có thì lấy tất cả)
 */
export const getTodayConsultations = async (doctorId?: string) => {
  try {
    console.log('📅 [TODAY-CONSULTATIONS] Getting today consultations...', { doctorId });
    
    // Calculate today range in VN timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    console.log('🕐 [TODAY-CONSULTATIONS] Date range:', {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString()
    });
    
    // Build filter
    const filter: any = {
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      }
    };
    
    if (doctorId && isValidObjectId(doctorId)) {
      filter.doctorId = new mongoose.Types.ObjectId(doctorId);
    }
    
    const todayConsultations = await DoctorQA.find(filter)
      .populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('userId', 'fullName email')
      .populate('serviceId', 'serviceName price description serviceType')
      .sort({ appointmentSlot: 1 }); // Sort by time slot

    console.log(`📅 [TODAY-CONSULTATIONS] Found ${todayConsultations.length} consultations today`);
    
    return todayConsultations;

  } catch (error) {
    console.error('❌ [ERROR] Getting today consultations failed:', error);
    throw error;
  }
};

/**
 * 🔍 Kiểm tra consultation đã có Meeting record chưa
 * @param qaId - ID của DoctorQA
 */
export const checkMeetingExistence = async (qaId: string): Promise<{
  hasmeeting: boolean;
  meetingData?: any;
}> => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('QA ID không hợp lệ');
    }

    // Import Meeting model
    const Meeting = require('../models/Meeting').default;
    
    const meeting = await Meeting.findOne({ qaId: new mongoose.Types.ObjectId(qaId) });
    
    return {
      hasmeeting: !!meeting,
      meetingData: meeting || null
    };

  } catch (error) {
    console.error('❌ [ERROR] Check meeting existence failed:', error);
    throw error;
  }
};

/**
 * 📝 Tạo hồ sơ Meeting cho consultation 
 * @param qaId - ID của DoctorQA
 */
export const createMeetingRecord = async (qaId: string): Promise<{
  meeting: any;
  updatedQA: any;
}> => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('QA ID không hợp lệ');
    }

    console.log('📝 [CREATE-MEETING] Creating meeting record for QA:', qaId);

    // 1. Lấy thông tin QA
    const qa = await DoctorQA.findById(qaId);
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    // 2. Validate QA có đủ thông tin để tạo meeting
    if (!qa.doctorId || !qa.userId || !qa.appointmentDate || !qa.appointmentSlot) {
      throw new Error('Yêu cầu tư vấn chưa có đủ thông tin để tạo meeting');
    }

    // 3. Check xem đã có meeting chưa
    const Meeting = require('../models/Meeting').default;
    const existingMeeting = await Meeting.findOne({ qaId: new mongoose.Types.ObjectId(qaId) });
    
    if (existingMeeting) {
      throw new Error('Meeting record đã tồn tại cho consultation này');
    }

    // 4. Generate secure password
    const meetingPassword = generateMeetingPassword();
    console.log(`🔐 [CREATE-MEETING] Generated password: ${meetingPassword} for QA: ${qaId}`);
    
    // 5. Tạo meeting link (Jitsi)
    const meetingLink = `https://meet.jit.si/consultation-${qaId}-${Date.now()}`;
    
    // 6. Parse scheduled time từ appointmentDate + appointmentSlot
    const appointmentDate = new Date(qa.appointmentDate);
    const [startTime] = qa.appointmentSlot.split('-'); // Lấy "14:00" từ "14:00-15:00"
    const [hours, minutes] = startTime.split(':').map(Number);
    
    const scheduledTime = new Date(appointmentDate);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // 7. Tạo Meeting record
    const newMeeting = await Meeting.create({
      qaId: qa._id,
      doctorId: qa.doctorId,
      userId: qa.userId,
      meetingLink,
      meetingPassword,           // ➕ ADD password field
      provider: 'jitsi',
      scheduledTime,
      status: 'scheduled',
      participantCount: 0,
      maxParticipants: 2
      // ✅ REMOVED: notes - Để trống để bắt buộc doctor phải nhập thông tin thực tế
    });

    console.log('✅ [CREATE-MEETING] Meeting record created:', newMeeting._id);

    // 8. Update DoctorQA status to 'consulting'
    const updatedQA = await DoctorQA.findByIdAndUpdate(
      qaId,
      { 
        status: 'consulting'
      },
      { new: true }
    ).populate({
      path: 'doctorId',
      select: 'userId bio specialization',
      populate: {
        path: 'userId',
        select: 'fullName email'
      }
    }).populate('userId', 'fullName email');

    console.log('✅ [CREATE-MEETING] QA status updated to consulting');

    return {
      meeting: newMeeting,
      updatedQA
    };

  } catch (error) {
    console.error('❌ [ERROR] Create meeting record failed:', error);
    throw error;
  }
};

/**
 * 🔄 Cập nhật participant count và status
 * @param meetingId - ID của Meeting
 * @param participantCount - Số người tham gia hiện tại
 */
export const updateMeetingParticipants = async (
  meetingId: string, 
  participantCount: number
): Promise<any> => {
  try {
    console.log(`🔄 [UPDATE-PARTICIPANTS] Meeting ${meetingId}: ${participantCount} participants`);
    
    if (!isValidObjectId(meetingId)) {
      throw new Error('Meeting ID không hợp lệ');
    }

    const Meeting = require('../models/Meeting').default;
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting không tồn tại');
    }

    let newStatus = meeting.status;
    
    // Logic tự động chuyển status
    if (participantCount === 1 && meeting.status === 'scheduled') {
      newStatus = 'waiting_customer';
      console.log(`🔄 [STATUS-CHANGE] Doctor joined first → waiting_customer`);
    } else if (participantCount >= 2 && meeting.status === 'waiting_customer') {
      newStatus = 'in_progress';
      console.log(`🔄 [STATUS-CHANGE] Customer joined → in_progress`);
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { 
        participantCount,
        status: newStatus,
        ...(participantCount === 1 && { actualStartTime: new Date() })
      },
      { new: true }
    );

    return updatedMeeting;
  } catch (error) {
    console.error('❌ [ERROR] Update participants failed:', error);
    throw error;
  }
};

/**
 *  Hoàn thành consultation và meeting
 * @param qaId - ID của DoctorQA
 * @param doctorNotes - Ghi chú của bác sĩ
 */
export const completeConsultationWithMeeting = async (qaId: string, doctorNotes?: string): Promise<{
  updatedQA: any;
  updatedMeeting: any;
}> => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('QA ID không hợp lệ');
    }

    console.log(' [COMPLETE-CONSULTATION] Completing consultation:', qaId);

    // 1. Update DoctorQA status to 'completed' - KHÔNG lưu notes ở đây nữa
    const updateData: any = { status: 'completed' };
    // ❌ REMOVED: doctorNotes sẽ được lưu ở Meeting table thôi
    // if (doctorNotes) {
    //   updateData.doctorNotes = doctorNotes;
    // }

    const updatedQA = await DoctorQA.findByIdAndUpdate(
      qaId,
      updateData,
      { new: true }
    ).populate({
      path: 'doctorId',
      select: 'userId bio specialization',
      populate: {
        path: 'userId',
        select: 'fullName email'
      }
    }).populate('userId', 'fullName email');

    if (!updatedQA) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    // 2. Update Meeting status to 'completed' - KHÔNG override notes đã có
    const Meeting = require('../models/Meeting').default;
    const updatedMeeting = await Meeting.findOneAndUpdate(
      { qaId: new mongoose.Types.ObjectId(qaId) },
      { 
        status: 'completed'
        // ❌ REMOVED: Không override notes đã được lưu từ updateMeetingNotes
        // notes: doctorNotes || 'Consultation completed successfully'  
      },
      { new: true }
    );

    // ➕ 3. NEW: Send thank you email to customer
    try {
      console.log(' [SEND-THANKS] Sending completion thank you email...');
      
      const { sendConsultationCompletedEmail } = await import('./emails');
      
      // Extract customer and doctor info
      const customerData = updatedQA.userId as any;
      const doctorData = (updatedQA.doctorId as any)?.userId as any;
      const doctorName = doctorData?.fullName || 'Bác sĩ';
      
      if (customerData?.email) {
        // ✅ FIX: Safe handling của appointmentDate
        const appointmentDate = updatedQA.appointmentDate || new Date();
        const appointmentSlot = updatedQA.appointmentSlot || 'N/A';
        
        await sendConsultationCompletedEmail(
          customerData.email,
          customerData.fullName || updatedQA.fullName,
          updatedQA.phone,
          doctorName,
          appointmentDate,
          appointmentSlot,
          updatedQA.question,
          updatedMeeting?.notes // ✅ FIX: Lấy notes từ Meeting thay vì doctorNotes
        );
        console.log(`✅ [SEND-THANKS] Thank you email sent to: ${customerData.email}`);
      } else {
        console.warn('⚠️ [SEND-THANKS] No customer email found, skipping thank you email');
      }
      
    } catch (emailError: any) {
      console.error('❌ [EMAIL-ERROR] Failed to send thank you email:', emailError.message);
      // Don't throw error - email failure shouldn't block consultation completion
    }

    console.log('✅ [COMPLETE-CONSULTATION] Both QA and Meeting completed');

    return {
      updatedQA,
      updatedMeeting
    };

  } catch (error) {
    console.error(' [ERROR] Complete consultation failed:', error);
    throw error;
  }
};

/**
 * 📝 Cập nhật meeting notes và thông tin
 * @param qaId - ID của DoctorQA
 * @param meetingData - Dữ liệu meeting cần update
 */
export const updateMeetingNotes = async (qaId: string, meetingData: {
  notes?: string;
  maxParticipants?: number;
  actualStartTime?: Date;
}): Promise<any> => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('QA ID không hợp lệ');
    }

    console.log('📝 [UPDATE-MEETING] Updating meeting notes for QA:', qaId);

    // Import Meeting model
    const Meeting = require('../models/Meeting').default;
    
    // Build update data
    const updateData: any = {};
    if (meetingData.notes !== undefined) {
      updateData.notes = meetingData.notes;
    }
    if (meetingData.maxParticipants !== undefined) {
      updateData.maxParticipants = meetingData.maxParticipants;
    }
    if (meetingData.actualStartTime !== undefined) {
      updateData.actualStartTime = meetingData.actualStartTime;
    }

    // Update meeting record
    const updatedMeeting = await Meeting.findOneAndUpdate(
      { qaId: new mongoose.Types.ObjectId(qaId) },
      { $set: updateData },
      { new: true }
    );

    if (!updatedMeeting) {
      throw new Error('Không tìm thấy meeting record');
    }

    console.log('✅ [UPDATE-MEETING] Meeting notes updated successfully');

    return updatedMeeting;

  } catch (error) {
    console.error('❌ [ERROR] Update meeting notes failed:', error);
    throw error;
  }
};

/**
 * 📖 Lấy chi tiết meeting của consultation
 * @param qaId - ID của DoctorQA
 */
export const getMeetingDetails = async (qaId: string): Promise<any> => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('QA ID không hợp lệ');
    }

    // Import Meeting model
    const Meeting = require('../models/Meeting').default;
    
    const meeting = await Meeting.findOne({ qaId: new mongoose.Types.ObjectId(qaId) })
      .populate('doctorId', 'userId')
      .populate('userId', 'fullName email');

    if (!meeting) {
      throw new Error('Không tìm thấy meeting record');
    }

    return meeting;

  } catch (error) {
    console.error('❌ [ERROR] Get meeting details failed:', error);
    throw error;
  }
};

// ➕ NEW: Get doctors workload statistics for priority assignment
export const getDoctorsWorkloadStatistics = async (): Promise<Array<{
  doctorId: string;
  doctorName: string;
  bookedSlots: number;
}>> => {
  try {
    console.log('📊 [WORKLOAD-STATS] Getting doctors workload statistics...');
    
    // Import models
    const DoctorSchedules = require('../models/DoctorSchedules').default;
    const Doctor = require('../models/Doctor').default;
    
    // Get all doctors
    const allDoctors = await Doctor.find({ 
      isDeleted: { $ne: true } 
    }).populate({
      path: 'userId',
      select: 'fullName email isActive',
      match: { isActive: { $ne: false } }
    });
    
    const doctorsStats = [];
    
    for (const doctor of allDoctors) {
      if (!doctor.userId) continue; // Skip corrupted data
      
      // Get schedule for this doctor
      const schedule = await DoctorSchedules.findOne({ doctorId: doctor._id });
      
      let bookedSlots = 0;
      if (schedule) {
        for (const daySchedule of schedule.weekSchedule) {
          bookedSlots += daySchedule.slots.filter((slot: any) => slot.status === 'Booked').length;
        }
      }
      
      doctorsStats.push({
        doctorId: doctor._id.toString(),
        doctorName: (doctor.userId as any).fullName,
        bookedSlots
      });
    }
    
    // Sort by bookedSlots ASC (least booked first)
    const sortedStats = doctorsStats.sort((a, b) => a.bookedSlots - b.bookedSlots);
    
    console.log(`✅ [WORKLOAD-STATS] Found ${sortedStats.length} doctors, sorted by workload`);
    
    return sortedStats;
    
  } catch (error) {
    console.error('❌ [ERROR] Get doctors workload stats failed:', error);
    throw error;
  }
};

// ➕ NEW: Assign doctor to selected slot with priority logic
export const assignDoctorToSelectedSlot = async (qaData: any, selectedDate: string, selectedSlot: string): Promise<any> => {
  try {
    console.log(`🎯 [ASSIGN-SLOT] Starting assignment for ${selectedDate} ${selectedSlot}`);
    
    // 1. Validate inputs
    if (!selectedDate || !selectedSlot) {
      throw new Error('Ngày và slot thời gian là bắt buộc');
    }
    
    // 2. Get available doctors for this specific slot
    const { getAvailableDoctors } = require('./doctorScheduleService');
    const availableDoctors = await getAvailableDoctors(selectedDate, selectedSlot, false);
    
    if (availableDoctors.length === 0) {
      throw new Error('Không có bác sĩ nào khả dụng cho slot này');
    }
    
    console.log(`📋 [ASSIGN-SLOT] Found ${availableDoctors.length} available doctors for slot`);
    
    // 3. Get workload statistics to determine priority
    const workloadStats = await getDoctorsWorkloadStatistics();
    
    // 4. Find intersection: available doctors + least booked (priority)
    const priorityDoctors = availableDoctors
      .map((availableDoc: any) => {
        const stats = workloadStats.find(stat => stat.doctorId === availableDoc.doctorId);
        return {
          ...availableDoc,
          bookedSlots: stats ? stats.bookedSlots : 0
        };
      })
      .sort((a: any, b: any) => a.bookedSlots - b.bookedSlots); // Sort by least booked
    
    console.log(`🏆 [ASSIGN-SLOT] Priority order:`, priorityDoctors.map((d: any) => 
      `${d.doctorInfo.fullName} (${d.bookedSlots} slots)`
    ));
    
    // 5. Try to assign to first available doctor (least booked)
    const { lockSlot } = require('./doctorScheduleService');
    let assignedDoctor = null;
    let assignedSlotId = null;
    
    for (const doctor of priorityDoctors) {
      try {
        const doctorSlot = doctor.availableSlots.find((slot: any) => slot.slotTime === selectedSlot);
        if (!doctorSlot) continue;
        
        console.log(`🔄 [ASSIGN-SLOT] Trying to lock slot for ${doctor.doctorInfo.fullName}...`);
        
        const lockSuccess = await lockSlot(doctorSlot.slotId);
        if (lockSuccess) {
          assignedDoctor = doctor;
          assignedSlotId = doctorSlot.slotId;
          console.log(`✅ [ASSIGN-SLOT] Successfully assigned to ${doctor.doctorInfo.fullName}`);
          break;
        }
      } catch (lockError) {
        console.log(`❌ [ASSIGN-SLOT] Failed to lock slot for ${doctor.doctorInfo.fullName}`);
        continue;
      }
    }
    
    if (!assignedDoctor) {
      throw new Error('Không thể phân công bác sĩ - tất cả slots đã bị chiếm');
    }
    
    // 6. Get service info
    const Service = require('../models/Service').default;
    const consultationService = await Service.findOne({
      serviceName: { $regex: /tư vấn.*online/i },
      serviceType: 'consultation',
      isDeleted: { $ne: true }
    });
    
    if (!consultationService) {
      // Rollback slot lock
      const { releaseSlot } = require('./doctorScheduleService');
      await releaseSlot(assignedSlotId.toString());
      throw new Error('Không tìm thấy dịch vụ tư vấn online');
    }
    
    // 7. Create DoctorQA with assignment
    const { createVietnamDate } = require('../utils/timezoneUtils');
    const appointmentDate = createVietnamDate(selectedDate);
    
    const newQA = await DoctorQA.create({
      ...qaData,
      status: 'pending_payment',
      consultationFee: consultationService.price,
      serviceId: consultationService._id,
      serviceName: consultationService.serviceName,
      doctorId: new mongoose.Types.ObjectId(assignedDoctor.doctorId),
      appointmentDate,
      appointmentSlot: selectedSlot,
      slotId: assignedSlotId
    });

    // Create PaymentTracking
    const PaymentTracking = require('../models/PaymentTracking').default;
    const payment = await PaymentTracking.create({
        serviceType: 'consultation',
        recordId: newQA._id,
        doctorQAId: newQA._id,
        userId: qaData.userId,
        amount: consultationService.price,
        totalAmount: consultationService.price,
        billNumber: `CONS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        description: `Thanh toán tư vấn online: ${consultationService.serviceName}`,
        customerName: qaData.fullName || 'Khách hàng',
        customerEmail: qaData.email || '',
        customerPhone: qaData.phone || '',
        orderCode: Date.now(),
        paymentGateway: 'payos',
        status: 'pending'
    });

    // Update DoctorQA with paymentTrackingId
    await DoctorQA.findByIdAndUpdate(newQA._id, {
        paymentTrackingId: payment._id
    });
    
    // 8. Set 15min timeout để auto-release
    setTimeout(async () => {
      try {
        const qa = await DoctorQA.findById(newQA._id);
        if (qa && qa.status === 'pending_payment') {
          const { releaseSlot } = require('./doctorScheduleService');
          await releaseSlot(assignedSlotId.toString());
          await DoctorQA.findByIdAndUpdate(newQA._id, { status: 'cancelled' });
          console.log(`🔓 [AUTO-RELEASE] Slot ${assignedSlotId} released after 15 minutes`);
        }
      } catch (timeoutError) {
        console.error('❌ [TIMEOUT] Error in auto-release:', timeoutError);
      }
    }, 15 * 60 * 1000); // 15 minutes
    
    // 9. Populate and return
    const populatedQA = await DoctorQA.findById(newQA._id)
      .populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('userId', 'fullName email')
      .populate('serviceId', 'serviceName price description serviceType');
    
    console.log(`✅ [ASSIGN-SLOT] Assignment completed for QA ${newQA._id}`);
    
    return {
      qa: populatedQA,
      assignedDoctor: {
        doctorId: assignedDoctor.doctorId,
        doctorName: assignedDoctor.doctorInfo.fullName,
        specialization: assignedDoctor.doctorInfo.specialization || 'N/A',
        bookedSlots: assignedDoctor.bookedSlots
      },
      service: consultationService
    };
    
  } catch (error) {
    console.error('❌ [ERROR] Assign doctor to slot failed:', error);
    throw error;
  }
};