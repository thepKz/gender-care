import DoctorQA from '../models/DoctorQA';
import Doctor from '../models/Doctor';
import mongoose from 'mongoose';
import { getDoctorStatistics } from './doctorService';

// Validate ObjectId helper
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// 🎯 Tìm bác sĩ tốt nhất cho slot khả dụng gần nhất
export const findBestDoctorForNextSlot = async (): Promise<{
  doctorId: string;
  appointmentDate: Date;
  appointmentSlot: string;
  slotId: any;
  doctorName: string;
}> => {
  try {
    // Import DoctorSchedules model
    const DoctorSchedules = require('../models/DoctorSchedules').default;
    
    console.log('🔍 [SMART-ASSIGN] Starting smart doctor assignment...');
    
    // Lấy tất cả DoctorSchedule và populate doctor info
    const allSchedules = await DoctorSchedules.find()
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'fullName email'
        },
        select: 'userId bio specialization'
      });

    if (allSchedules.length === 0) {
      throw new Error('Không có bác sĩ nào có lịch làm việc trong hệ thống');
    }

    // 🎯 STEP 1: Tìm tất cả slot khả dụng từ thời gian hiện tại
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`🕐 [SMART-ASSIGN] Current time: ${now.toLocaleString('vi-VN')}`);

    const availableSlots: Array<{
      date: Date;
      slotTime: string;
      slotId: any;
      doctors: Array<{
        doctorId: any;
        doctorName: string;
        bookedSlots: number;
      }>;
    }> = [];

    // Duyệt qua tất cả schedule để tìm slot khả dụng
    for (const schedule of allSchedules) {
      const doctor = schedule.doctorId as any;
      if (!doctor || !doctor.userId) continue;

      const doctorName = doctor.userId.fullName;
      console.log(`👨‍⚕️ [SMART-ASSIGN] Checking doctor: ${doctorName} (${doctor._id})`);

      // Tính tổng slot booked của doctor này
      let totalBookedSlots = 0;
      for (const daySchedule of schedule.weekSchedule) {
        totalBookedSlots += daySchedule.slots.filter((slot: any) => slot.status === 'Booked').length;
      }

      // Duyệt qua từng ngày trong lịch của doctor
      for (const daySchedule of schedule.weekSchedule) {
        const scheduleDate = new Date(daySchedule.dayOfWeek);
        scheduleDate.setHours(0, 0, 0, 0);

        // Chỉ xét lịch từ hôm nay trở đi
        if (scheduleDate.getTime() < today.getTime()) continue;

        // Duyệt qua từng slot trong ngày
        for (const slot of daySchedule.slots) {
          if (slot.status !== 'Free') continue;

          const [slotStartHour, slotStartMinute] = slot.slotTime.split('-')[0].split(':').map(Number);
          
          // Nếu là hôm nay, chỉ lấy slot sau thời gian hiện tại
          if (scheduleDate.getTime() === today.getTime()) {
            if (slotStartHour < currentHour || (slotStartHour === currentHour && slotStartMinute <= currentMinute)) {
              continue;
            }
          }

          // Tìm xem đã có slot này trong availableSlots chưa
          let existingSlot = availableSlots.find(
            as => as.date.getTime() === scheduleDate.getTime() && as.slotTime === slot.slotTime
          );

          if (!existingSlot) {
            // Tạo slot mới
            existingSlot = {
              date: new Date(scheduleDate),
              slotTime: slot.slotTime,
              slotId: slot._id,
              doctors: []
            };
            availableSlots.push(existingSlot);
          }

          // Thêm doctor vào slot này
          existingSlot.doctors.push({
            doctorId: doctor._id,
            doctorName,
            bookedSlots: totalBookedSlots
          });
        }
      }
    }

    if (availableSlots.length === 0) {
      throw new Error('Không có slot nào khả dụng từ thời gian hiện tại. Vui lòng tạo thêm lịch làm việc.');
    }

    // 🎯 STEP 2: Sắp xếp slot theo thời gian gần nhất
    availableSlots.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // Cùng ngày thì so sánh giờ
      const aHour = parseInt(a.slotTime.split(':')[0]);
      const bHour = parseInt(b.slotTime.split(':')[0]);
      return aHour - bHour;
    });

    console.log(`📅 [SMART-ASSIGN] Found ${availableSlots.length} available slots`);

    // 🎯 STEP 3: Chọn slot gần nhất và tìm bác sĩ ít booked nhất trong slot đó
    const nearestSlot = availableSlots[0];
    
    console.log(`🎯 [SMART-ASSIGN] Nearest slot: ${nearestSlot.slotTime} on ${nearestSlot.date.toISOString().split('T')[0]}`);
    console.log(`👥 [SMART-ASSIGN] Available doctors in this slot: ${nearestSlot.doctors.length}`);

    // Tìm bác sĩ có ít slot booked nhất trong slot này
    nearestSlot.doctors.sort((a, b) => a.bookedSlots - b.bookedSlots);
    const bestDoctor = nearestSlot.doctors[0];

    console.log(`🏆 [SMART-ASSIGN] Selected doctor: ${bestDoctor.doctorName} (bookedSlots: ${bestDoctor.bookedSlots})`);

    return {
      doctorId: bestDoctor.doctorId.toString(),
      appointmentDate: nearestSlot.date,
      appointmentSlot: nearestSlot.slotTime,
      slotId: nearestSlot.slotId,
      doctorName: bestDoctor.doctorName
    };

  } catch (error) {
    console.error('Error finding best doctor for next slot:', error);
    throw error;
  }
};

// Legacy function để backward compatibility
export const findLeastBookedDoctor = async (): Promise<string> => {
  try {
    const result = await findBestDoctorForNextSlot();
    return result.doctorId;
  } catch (error) {
    throw error;
  }
};

// Tạo DoctorQA mới
export const createDoctorQA = async (qaData: any) => {
  try {
    let { doctorId, userId, fullName, phone, question, notes } = qaData;

    // Validate userId
    if (!isValidObjectId(userId)) {
      throw new Error('User ID không hợp lệ');
    }

    // Nếu không có doctorId, tự động chọn bác sĩ ít booked nhất
    if (!doctorId) {
      const leastBookedDoctorId = await findLeastBookedDoctor();
      doctorId = new mongoose.Types.ObjectId(leastBookedDoctorId);
    } else {
      // Validate doctorId nếu có
      if (!isValidObjectId(doctorId)) {
        throw new Error('Doctor ID không hợp lệ');
      }
    }

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Bác sĩ không tồn tại');
    }

    const newQA = await DoctorQA.create({
      doctorId,
      userId,
      fullName,
      phone,
      question,
      notes,
      status: 'pending_payment',
      consultationFee: 200000  // Phí cố định 200k
    });

    return await DoctorQA.findById(newQA._id)
      .populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('userId', 'fullName email');

  } catch (error) {
    console.error('Error creating DoctorQA:', error);
    throw error;
  }
};

// Lấy tất cả DoctorQA (cho admin/staff)
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
      .sort({ createdAt: -1 });

  } catch (error) {
    console.error('Error getting all DoctorQAs:', error);
    throw error;
  }
};

// Lấy DoctorQA theo ID
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
      .populate('userId', 'fullName email');
    
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    return qa;

  } catch (error) {
    console.error('Error getting DoctorQA by ID:', error);
    throw error;
  }
};

// Lấy DoctorQA theo userId
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

// Lấy DoctorQA theo doctorId
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

// Cập nhật payment status và auto-assign doctor + schedule
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
      throw new Error('Yêu cầu tư vấn này đã được thanh toán hoặc không thể thanh toán');
    }

    if (paymentSuccess) {
      // 🎯 SMART AUTO-ASSIGN & SCHEDULE - Logic mới
      try {
        console.log('🚀 [SMART-ASSIGN] Starting intelligent assignment...');
        
        // 1. Tìm slot gần nhất và bác sĩ tốt nhất cho slot đó
        const smartAssignment = await findBestDoctorForNextSlot();
        console.log('🏆 [SMART-ASSIGN] Found optimal assignment:', {
          doctor: smartAssignment.doctorName,
          date: smartAssignment.appointmentDate.toISOString().split('T')[0],
          slot: smartAssignment.appointmentSlot
        });
        
        // 2. Cập nhật QA với thông tin đầy đủ luôn
        const updatedQA = await DoctorQA.findByIdAndUpdate(
          qaId,
          { 
            doctorId: new mongoose.Types.ObjectId(smartAssignment.doctorId),
            status: 'scheduled',  // Đi thẳng luôn scheduled
            appointmentDate: smartAssignment.appointmentDate,
            appointmentSlot: smartAssignment.appointmentSlot
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

        if (!updatedQA) {
          throw new Error('Không thể cập nhật QA với thông tin assignment');
        }

        // 3. Cập nhật slot status trong DoctorSchedules
        const DoctorSchedules = require('../models/DoctorSchedules').default;
        await DoctorSchedules.updateOne(
          { 
            doctorId: smartAssignment.doctorId,
            'weekSchedule.dayOfWeek': smartAssignment.appointmentDate,
            'weekSchedule.slots._id': smartAssignment.slotId
          },
          {
            $set: {
              'weekSchedule.$.slots.$[slot].status': 'Booked',
              'weekSchedule.$.slots.$[slot].bookedBy': qaId
            }
          },
          {
            arrayFilters: [{ 'slot._id': smartAssignment.slotId }]
          }
        );

        console.log('✅ [SMART-ASSIGN] Successfully assigned and scheduled!');
        
        return updatedQA;
        
      } catch (smartError: any) {
        console.error('🚨 [SMART-ASSIGN] Error:', smartError.message);
        
        // Fallback về logic cũ nếu smart assignment thất bại
        try {
          const leastBookedDoctorId = await findLeastBookedDoctor();
          console.log('🔄 [FALLBACK] Using fallback doctor:', leastBookedDoctorId);
          
          const updatedQA = await DoctorQA.findByIdAndUpdate(
            qaId,
            { 
              doctorId: new mongoose.Types.ObjectId(leastBookedDoctorId),
              status: 'doctor_confirmed'
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

          return updatedQA;
          
        } catch (fallbackError: any) {
          throw new Error(`Smart assignment và fallback đều thất bại: ${smartError.message}`);
        }
      }
      
    } else {
      // Payment failed - cancel QA
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
        })
       .populate('userId', 'fullName email');

      return updatedQA;
    }

  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Doctor confirm tư vấn
export const doctorConfirmQA = async (qaId: string, action: 'confirm' | 'reject') => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('ID yêu cầu tư vấn không hợp lệ');
    }

    const qa = await DoctorQA.findById(qaId);
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    if (qa.status !== 'paid') {
      throw new Error('Yêu cầu tư vấn chưa được thanh toán hoặc không thể confirm');
    }

    let newStatus;
    if (action === 'confirm') {
      newStatus = 'doctor_confirmed';
    } else {
      newStatus = 'cancelled';
      // TODO: Nếu reject, có thể auto-assign doctor khác
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

// Staff xếp lịch cụ thể - TỰ ĐỘNG TÌM SLOT GẦN NHẤT
export const scheduleQA = async (qaId: string) => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('ID yêu cầu tư vấn không hợp lệ');
    }
    
    const qa = await DoctorQA.findById(qaId).populate('doctorId');
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    if (qa.status !== 'doctor_confirmed') {
      throw new Error('Bác sĩ chưa confirm hoặc không thể xếp lịch');
    }

    let doctorId = qa.doctorId;

    // Nếu chưa có doctor hoặc doctor bị xóa, auto-assign
    if (!doctorId) {
      const leastBookedDoctorId = await findLeastBookedDoctor();
      doctorId = new mongoose.Types.ObjectId(leastBookedDoctorId);
      
      // Cập nhật doctor cho QA
      await DoctorQA.findByIdAndUpdate(qaId, { doctorId });
    }

    // Import DoctorSchedules model
    const DoctorSchedules = require('../models/DoctorSchedules').default;
    
    // Tìm lịch làm việc của bác sĩ
    const doctorSchedules = await DoctorSchedules.findOne({ doctorId })
      .sort({ createdAt: -1 });

    if (!doctorSchedules || !doctorSchedules.weekSchedule || doctorSchedules.weekSchedule.length === 0) {
      throw new Error('Bác sĩ chưa có lịch làm việc nào. Vui lòng tạo lịch trước.');
    }

    // Tìm slot Free gần nhất (từ bây giờ trở đi)
    let nearestSlot: any = null;
    let nearestDate: Date | null = null;
    let nearestSlotId: any = null;

    const now = new Date();
    const currentHour = now.getHours();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🔍 [DEBUG] Current time:', now);
    console.log('🔍 [DEBUG] Today:', today);
    console.log('🔍 [DEBUG] Current hour:', currentHour);

    // Sắp xếp lịch theo ngày tăng dần
    const sortedSchedule = doctorSchedules.weekSchedule
      .sort((a: any, b: any) => new Date(a.dayOfWeek).getTime() - new Date(b.dayOfWeek).getTime());

    console.log('🔍 [DEBUG] Total schedule days:', sortedSchedule.length);

    for (const daySchedule of sortedSchedule) {
      const scheduleDate = new Date(daySchedule.dayOfWeek);
      scheduleDate.setHours(0, 0, 0, 0);
      
      console.log('🔍 [DEBUG] Checking day:', scheduleDate.toISOString().split('T')[0]);
      
      // Lọc slots khả dụng
      let availableSlots = daySchedule.slots.filter((slot: any) => slot.status === 'Free');
      
      // Nếu là hôm nay, chỉ lấy slot sau giờ hiện tại
      if (scheduleDate.getTime() === today.getTime()) {
        availableSlots = availableSlots.filter((slot: any) => {
          const slotHour = parseInt(slot.slotTime.split(':')[0]);
          return slotHour > currentHour;
        });
        console.log('🔍 [DEBUG] Today available slots after current hour:', availableSlots.length);
      }
      
      // Nếu là ngày trong tương lai, lấy tất cả slot Free
      if (scheduleDate.getTime() >= today.getTime() && availableSlots.length > 0) {
        // Lấy slot đầu tiên (sớm nhất)
        nearestSlot = availableSlots[0];
        nearestDate = new Date(daySchedule.dayOfWeek);
        nearestSlotId = nearestSlot._id;
        console.log('🔍 [DEBUG] Found slot:', nearestSlot.slotTime, 'on', nearestDate.toISOString().split('T')[0]);
        break;
      }
    }

    if (!nearestSlot || !nearestDate) {
      throw new Error('Không tìm thấy slot trống nào của bác sĩ từ bây giờ trở đi. Vui lòng tạo thêm lịch làm việc.');
    }

    console.log('🔍 [DEBUG] Booking slot:', nearestSlot.slotTime, 'on', nearestDate.toISOString().split('T')[0]);

    // Cập nhật slot thành Booked
    await DoctorSchedules.updateOne(
      {
        doctorId,
        'weekSchedule.dayOfWeek': nearestDate,
        'weekSchedule.slots._id': nearestSlotId
      },
      {
        $set: {
          'weekSchedule.$.slots.$[slot].status': 'Booked'
        }
      },
      {
        arrayFilters: [{ 'slot._id': nearestSlotId }]
      }
    );

    console.log('✅ [DEBUG] Slot updated to Booked');

    // Tạo scheduled time cho meeting (kết hợp ngày và giờ)
    const [slotHour, slotMinute] = nearestSlot.slotTime.split(':').map(Number);
    const scheduledStartTime = new Date(nearestDate);
    scheduledStartTime.setHours(slotHour, slotMinute, 0, 0);
    const scheduledEndTime = new Date(scheduledStartTime.getTime() + 60 * 60 * 1000); // 1 tiếng

    // Cập nhật DoctorQA với thông tin lịch hẹn
    const updatedQA = await DoctorQA.findByIdAndUpdate(
      qaId,
      { 
        status: 'scheduled',
        doctorId, // Đảm bảo doctorId được update nếu có auto-assign
        appointmentDate: nearestDate,
        appointmentSlot: nearestSlot.slotTime,
        slotId: nearestSlotId
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

    // ❌ KHÔNG tạo meeting ngay lập tức
    // Meeting sẽ được tạo khi:
    // 1. Gần đến giờ khám (30 phút trước)
    // 2. Hoặc khi doctor/user join meeting
    console.log('📅 [SCHEDULE] Slot booked successfully. Meeting will be created later when needed.');

    return {
      qa: updatedQA,
      autoBookedInfo: {
        doctorId: doctorId,
        appointmentDate: nearestDate.toISOString().split('T')[0], // YYYY-MM-DD
        appointmentSlot: nearestSlot.slotTime,
        slotId: nearestSlotId,
        scheduledStartTime: scheduledStartTime.toISOString(),
        scheduledEndTime: scheduledEndTime.toISOString(),
        message: `Đã đặt lịch khám: ${nearestSlot.slotTime} ngày ${nearestDate.toISOString().split('T')[0]}. Link Google Meet sẽ được gửi trước 30 phút.`
      }
    };

  } catch (error) {
    console.error('Error auto-scheduling QA:', error);
    throw error;
  }
};

// Cập nhật status (tổng quát)
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

// Xóa DoctorQA
export const deleteDoctorQA = async (qaId: string) => {
  try {
    if (!isValidObjectId(qaId)) {
      throw new Error('ID yêu cầu tư vấn không hợp lệ');
    }

    const qa = await DoctorQA.findById(qaId);
    if (!qa) {
      throw new Error('Không tìm thấy yêu cầu tư vấn');
    }

    await DoctorQA.findByIdAndDelete(qaId);
    return qa;

  } catch (error) {
    console.error('Error deleting DoctorQA:', error);
    throw error;
  }
}; 