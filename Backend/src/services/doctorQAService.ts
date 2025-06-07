import DoctorQA from '../models/DoctorQA';
import Doctor from '../models/Doctor';
import mongoose from 'mongoose';
import { getDoctorStatistics } from './doctorService';

// Validate ObjectId helper
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Tìm bác sĩ có ít slot booked nhất để auto-assign
export const findLeastBookedDoctor = async (): Promise<string> => {
  try {
    // Lấy tất cả bác sĩ
    const allDoctors = await Doctor.find().populate('userId', 'fullName');
    
    if (allDoctors.length === 0) {
      throw new Error('Không có bác sĩ nào trong hệ thống');
    }

    // Lấy thống kê của từng bác sĩ
    const doctorsWithStats = [];
    
    for (const doctor of allDoctors) {
      try {
        const stats = await getDoctorStatistics(doctor._id.toString());
        doctorsWithStats.push({
          doctorId: doctor._id,
          name: stats.name,
          bookedSlots: stats.bookedSlots,
          absentSlots: stats.absentSlots,
          absentDays: stats.absentDays
        });
      } catch (error) {
        console.error(`Error getting stats for doctor ${doctor._id}:`, error);
        // Nếu không lấy được stats, set default values
        doctorsWithStats.push({
          doctorId: doctor._id,
          name: (doctor as any).userId?.fullName || 'Unknown Doctor',
          bookedSlots: 0,
          absentSlots: 0,
          absentDays: 0
        });
      }
    }

    // Tìm số slot booked ít nhất
    const minBookedSlots = Math.min(...doctorsWithStats.map(d => d.bookedSlots));
    
    // Lọc tất cả bác sĩ có số slot booked = min
    const leastBookedDoctors = doctorsWithStats.filter(d => d.bookedSlots === minBookedSlots);
    
    // Random chọn 1 bác sĩ để công bằng
    const randomIndex = Math.floor(Math.random() * leastBookedDoctors.length);
    const selectedDoctor = leastBookedDoctors[randomIndex];

    // Chỉ trả về doctorId
    return selectedDoctor.doctorId.toString();

  } catch (error) {
    console.error('Error finding least booked doctor:', error);
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

// Cập nhật payment status
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

    const newStatus = paymentSuccess ? 'paid' : 'cancelled';
    
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

    return {
      qa: updatedQA,
      autoBookedInfo: {
        doctorId: doctorId,
        appointmentDate: nearestDate.toISOString().split('T')[0], // YYYY-MM-DD
        appointmentSlot: nearestSlot.slotTime,
        slotId: nearestSlotId,
        message: `Đã tự động đặt lịch slot gần nhất: ${nearestSlot.slotTime} ngày ${nearestDate.toISOString().split('T')[0]}`
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