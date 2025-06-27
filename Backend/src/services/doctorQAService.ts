import DoctorQA from '../models/DoctorQA';
import Doctor from '../models/Doctor';
import mongoose from 'mongoose';
import { getDoctorStatistics } from './doctorService';
import { generateMeetingPassword } from '../utils/passwordGenerator'; // ➕ IMPORT password generator

// Validate ObjectId helper
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// 🔍 TÌM CÁC TIME SLOT GẦN NHẤT CÓ SLOT TRỐNG
const findNearestAvailableTimeSlot = async (): Promise<{
  date: Date;
  slotTime: string;
  availableDoctors: Array<{
  doctorId: string;
    doctorName: string;
  slotId: any;
    bookedSlots: number;
  }>;
}[]> => {
  try {
    console.log('🔍 [NEAREST-SLOT] Finding nearest available time slots...');
    
    // ✅ Import models với error handling
    let DoctorSchedules;
    try {
      DoctorSchedules = require('../models/DoctorSchedules').default;
    } catch (importError) {
      console.error('❌ [IMPORT-ERROR] Failed to import DoctorSchedules:', importError);
      const { default: DoctorSchedulesModel } = await import('../models/DoctorSchedules');
      DoctorSchedules = DoctorSchedulesModel;
    }
    
    if (!DoctorSchedules) {
      throw new Error('Không thể load model DoctorSchedules. Vui lòng kiểm tra cấu trúc database.');
    }
    
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

    console.log(`📊 [NEAREST-SLOT] Found ${allSchedules.length} doctor schedules`);
    
    if (allSchedules.length === 0) {
      throw new Error('Không có bác sĩ nào có lịch làm việc trong hệ thống. Vui lòng tạo lịch làm việc cho bác sĩ trước.');
    }

    // ✅ Validate schedules có valid doctor data
    const validSchedules = allSchedules.filter((schedule: any) => {
      const isValid = schedule.doctorId && 
                     schedule.doctorId.userId && 
                     schedule.doctorId.userId.fullName;
      if (!isValid) {
        console.warn(`⚠️ [NEAREST-SLOT] Invalid schedule found: ${schedule._id}, skipping...`);
      }
      return isValid;
    });

    if (validSchedules.length === 0) {
      throw new Error('Không có bác sĩ nào có thông tin hợp lệ trong hệ thống. Vui lòng kiểm tra dữ liệu bác sĩ.');
    }

    // Tính thống kê booked slots cho mỗi doctor
    const doctorStats = new Map<string, number>();
    for (const schedule of validSchedules) {
      const doctorId = schedule.doctorId._id.toString();
      let bookedCount = 0;
      
      for (const daySchedule of schedule.weekSchedule) {
        bookedCount += daySchedule.slots.filter((slot: any) => slot.status === 'Booked').length;
      }
      
      doctorStats.set(doctorId, bookedCount);
    }

    // 🔧 TIMEZONE FIX: Thu thập slots theo thời gian với VN timezone
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 🔧 Fix: Dùng VN timezone cho today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`🕐 [NEAREST-SLOT] Current VN time: ${now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
    console.log(`🕐 [NEAREST-SLOT] Today start: ${today.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);

    // Group slots theo thời gian (date + slotTime)
    const slotsByTime = new Map<string, {
      date: Date;
      slotTime: string;
      availableDoctors: Array<{
      doctorId: string;
        doctorName: string;
        slotId: any;
        bookedSlots: number;
      }>;
    }>();

    // Duyệt qua tất cả schedule để group slots
    for (const schedule of validSchedules) {
      const doctor = schedule.doctorId as any;
      const doctorId = doctor._id.toString();
      const doctorName = doctor.userId.fullName;
      const bookedSlots = doctorStats.get(doctorId) || 0;

      for (const daySchedule of schedule.weekSchedule) {
        // 🔧 TIMEZONE FIX: Parse date đúng cách để tránh UTC shift
        const scheduleDate = new Date(daySchedule.dayOfWeek);
        
        // Convert về VN timezone và reset time
        const vnScheduleDate = new Date(scheduleDate.getTime());
        vnScheduleDate.setHours(0, 0, 0, 0);
        
        console.log(`🔍 [DEBUG] Schedule date:`, {
          original: daySchedule.dayOfWeek,
          parsed: scheduleDate.toISOString(),
          vnDate: vnScheduleDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
          todayVN: today.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
          comparison: vnScheduleDate.getTime() >= today.getTime() ? 'VALID' : 'SKIP'
        });

        // Chỉ xét lịch từ hôm nay trở đi (VN timezone)
        if (vnScheduleDate.getTime() < today.getTime()) continue;

        for (const slot of daySchedule.slots) {
          if (slot.status !== 'Free') continue;

          const [slotStartHour, slotStartMinute] = slot.slotTime.split('-')[0].split(':').map(Number);
          
          // Nếu là hôm nay, chỉ lấy slot sau thời gian hiện tại (+ buffer 15 phút)
          if (vnScheduleDate.getTime() === today.getTime()) {
            if (slotStartHour < currentHour || 
                (slotStartHour === currentHour && slotStartMinute <= (currentMinute + 15))) {
              console.log(`⏭️ [SKIP] Slot ${slot.slotTime} is in the past or too close (current: ${currentHour}:${currentMinute})`);
              continue;
            }
          }

          // Key để group: date + slotTime (dùng VN date)
          const vnDateStr = vnScheduleDate.toISOString().split('T')[0];
          const timeKey = `${vnDateStr}_${slot.slotTime}`;
          
          if (!slotsByTime.has(timeKey)) {
            slotsByTime.set(timeKey, {
              date: new Date(vnScheduleDate),
              slotTime: slot.slotTime,
              availableDoctors: []
            });
          }

          console.log(`🔍 [DEBUG] Found valid slot:`, {
            doctorId,
            doctorName,
            slotId: slot._id,
            slotTime: slot.slotTime,
            status: slot.status,
            vnDate: vnDateStr,
            isToday: vnScheduleDate.getTime() === today.getTime()
          });

          slotsByTime.get(timeKey)!.availableDoctors.push({
            doctorId,
            doctorName,
            slotId: slot._id,
            bookedSlots
          });
        }
      }
    }

    if (slotsByTime.size === 0) {
      throw new Error('Không có slot nào khả dụng từ thời gian hiện tại. Vui lòng liên hệ để được hỗ trợ.');
    }

    // Convert Map thành Array và sort theo thời gian
    const sortedTimeSlots = Array.from(slotsByTime.values()).sort((a, b) => {
      // So sánh ngày trước
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // Cùng ngày thì so sánh giờ
      const aHour = parseInt(a.slotTime.split(':')[0]);
      const bHour = parseInt(b.slotTime.split(':')[0]);
      return aHour - bHour;
    });

    console.log(`📅 [NEAREST-SLOT] Found ${sortedTimeSlots.length} unique time slots`);
    
    return sortedTimeSlots;

  } catch (error) {
    console.error('❌ [ERROR] Finding nearest slots failed:', error);
    throw error;
  }
};

// 👨‍⚕️ CHỌN DOCTOR TỐI ỦU CHO MỘT TIME SLOT CỤ THỂ
const selectOptimalDoctorForTimeSlot = (availableDoctors: Array<{
  doctorId: string;
  doctorName: string;
  slotId: any;
  bookedSlots: number;
}>): {
  doctorId: string;
  doctorName: string;
  slotId: any;
  bookedSlots: number;
} => {
  try {
    console.log(`👨‍⚕️ [DOCTOR-SELECT] Selecting optimal doctor from ${availableDoctors.length} candidates`);
    
    if (availableDoctors.length === 0) {
      throw new Error('Không có bác sĩ khả dụng cho time slot này');
    }

    // Nếu chỉ có 1 doctor → chọn luôn
    if (availableDoctors.length === 1) {
      const selectedDoctor = availableDoctors[0];
      console.log(`🎯 [DOCTOR-SELECT] Only 1 doctor available: ${selectedDoctor.doctorName}`);
      return selectedDoctor;
    }

    // Nếu có >1 doctor → chọn doctor ít booked slots nhất
    const sortedByBooked = [...availableDoctors].sort((a, b) => a.bookedSlots - b.bookedSlots);
    const selectedDoctor = sortedByBooked[0];
    
    console.log(`🏆 [DOCTOR-SELECT] Selected ${selectedDoctor.doctorName} with ${selectedDoctor.bookedSlots} booked slots`);
    console.log(`   📊 Other candidates:`, sortedByBooked.slice(1).map(d => `${d.doctorName}(${d.bookedSlots})`).join(', '));
    
    return selectedDoctor;

  } catch (error) {
    console.error('❌ [ERROR] Selecting optimal doctor failed:', error);
    throw error;
  }
};

// 🎯 SMART SLOT ASSIGNMENT - Logic mới với 3 bước rõ ràng
export const findBestAvailableSlot = async (): Promise<{
  doctorId: string;
  appointmentDate: Date;
  appointmentSlot: string;
  slotId: any;
  doctorName: string;
}> => {
  try {
    console.log('🚀 [SMART-ASSIGN] Starting intelligent slot assignment with new logic...');
    
    // BƯỚC 1: Tìm tất cả time slots gần nhất có slot trống
    const nearestTimeSlots = await findNearestAvailableTimeSlot();
    
    if (nearestTimeSlots.length === 0) {
      throw new Error('Không có slot nào khả dụng từ thời gian hiện tại. Vui lòng liên hệ để được hỗ trợ.');
    }

    // BƯỚC 2: Lặp qua từng time slot theo thứ tự gần nhất cho đến khi tìm được slot phù hợp
    for (const timeSlot of nearestTimeSlots) {
      console.log(`🔄 [SMART-ASSIGN] Checking time slot: ${timeSlot.date.toISOString().split('T')[0]} ${timeSlot.slotTime}`);
      console.log(`   📊 Available doctors: ${timeSlot.availableDoctors.length}`);

      if (timeSlot.availableDoctors.length === 0) {
        console.log(`   ⏭️ [SMART-ASSIGN] No doctors available for this slot, trying next...`);
        continue; // Chuyển sang slot tiếp theo
      }

      // BƯỚC 3: Chọn doctor tối ưu cho time slot này
      try {
        const selectedDoctor = selectOptimalDoctorForTimeSlot(timeSlot.availableDoctors);
    
        console.log(`🏆 [SMART-ASSIGN] Successfully found optimal slot:`);
        console.log(`   📅 Date: ${timeSlot.date.toISOString().split('T')[0]}`);
        console.log(`   🕐 Time: ${timeSlot.slotTime}`);
        console.log(`   👨‍⚕️ Doctor: ${selectedDoctor.doctorName} (${selectedDoctor.bookedSlots} booked slots)`);

    return {
          doctorId: selectedDoctor.doctorId,
          appointmentDate: timeSlot.date,
          appointmentSlot: timeSlot.slotTime,
          slotId: selectedDoctor.slotId,
          doctorName: selectedDoctor.doctorName
    };

      } catch (doctorSelectionError) {
        console.warn(`⚠️ [SMART-ASSIGN] Failed to select doctor for this slot:`, doctorSelectionError);
        continue; // Thử slot tiếp theo
      }
    }

    // Nếu đến đây nghĩa là không tìm được slot nào phù hợp
    throw new Error('Không thể tìm thấy slot phù hợp sau khi kiểm tra tất cả các time slot khả dụng. Vui lòng liên hệ để được hỗ trợ.');

  } catch (error) {
    console.error('❌ [ERROR] Smart assignment failed:', error);
    throw error;
  }
};

// 🔒 Book slot và set timeout để auto-release sau 15 phút
const bookSlotWithTimeout = async (doctorId: string, slotId: any, qaId: string) => {
  try {
    console.log('🔒 [BOOKING] Starting slot booking...', { doctorId, slotId, qaId });
    const DoctorSchedules = require('../models/DoctorSchedules').default;
    
    // 🔧 FIXED: MongoDB query đúng cho nested arrays
    const updateResult = await DoctorSchedules.updateOne(
      { 
        doctorId: new mongoose.Types.ObjectId(doctorId),
        'weekSchedule.slots._id': new mongoose.Types.ObjectId(slotId)
      },
      {
        $set: {
          'weekSchedule.$.slots.$[slot].status': 'Booked',
          'weekSchedule.$.slots.$[slot].bookedBy': qaId,
          'weekSchedule.$.slots.$[slot].bookedAt': new Date()
        }
      },
      {
        arrayFilters: [
          { 'slot._id': new mongoose.Types.ObjectId(slotId) }
        ]
      }
    );

    console.log(`🔒 [BOOKING] Update result:`, updateResult);
    
    if (updateResult.matchedCount === 0) {
      throw new Error(`Không tìm thấy doctor schedule với doctorId: ${doctorId}`);
    }
    
    if (updateResult.modifiedCount === 0) {
      console.warn(`⚠️ [BOOKING] No slot was modified. SlotId: ${slotId} might not exist or already booked`);
    }

    console.log(`🔒 [BOOKING] Slot ${slotId} booked for QA ${qaId}`);

    // Set timeout để auto-release sau 15 phút nếu chưa thanh toán
    setTimeout(async () => {
      try {
        const qa = await DoctorQA.findById(qaId);
        if (qa && qa.status === 'pending_payment') {
          // Chưa thanh toán sau 15 phút → release slot và cancel QA
          await releaseSlot(doctorId, slotId);
          await DoctorQA.findByIdAndUpdate(qaId, { status: 'cancelled' });
          console.log(`⏰ [TIMEOUT] Auto-cancelled QA ${qaId} after 15 minutes`);
        }
      } catch (error) {
        console.error('❌ [ERROR] Timeout handler failed:', error);
      }
    }, 15 * 60 * 1000); // 15 phút

  } catch (error) {
    console.error('❌ [ERROR] Booking slot failed:', error);
    throw error;
  }
};

// 🔓 Release slot về trạng thái Free
const releaseSlot = async (doctorId: string, slotId: any) => {
  try {
    const DoctorSchedules = require('../models/DoctorSchedules').default;
    
    const updateResult = await DoctorSchedules.updateOne(
      { 
        doctorId: new mongoose.Types.ObjectId(doctorId),
        'weekSchedule.slots._id': new mongoose.Types.ObjectId(slotId)
      },
      {
        $set: {
          'weekSchedule.$.slots.$[slot].status': 'Free'
        },
        $unset: {
          'weekSchedule.$.slots.$[slot].bookedBy': 1,
          'weekSchedule.$.slots.$[slot].bookedAt': 1
        }
      },
      {
        arrayFilters: [
          { 'slot._id': new mongoose.Types.ObjectId(slotId) }
        ]
      }
    );

    console.log(`🔓 [RELEASE] Update result:`, updateResult);

    console.log(`🔓 [RELEASE] Slot ${slotId} released`);

  } catch (error) {
    console.error('❌ [ERROR] Releasing slot failed:', error);
    throw error;
  }
};

// ✨ TẠO DOCTOR QA MỚI - Logic mới với auto assignment ngay lập tức
export const createDoctorQA = async (qaData: any) => {
  try {
    let { userId, fullName, phone, question, notes } = qaData;

    // Validate userId
    if (!isValidObjectId(userId)) {
      throw new Error('User ID không hợp lệ');
    }

    console.log('🚀 [CREATE-QA] Starting QA creation with smart assignment...');

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

    // STEP 2: Tìm slot tốt nhất trước khi tạo QA
    console.log('🔄 [CREATE-QA] Finding best available slot...');
    const assignment = await findBestAvailableSlot();
    console.log('✅ [CREATE-QA] Assignment result:', assignment);

    // ✅ VALIDATION: Đảm bảo assignment có đầy đủ thông tin
    if (!assignment || !assignment.doctorId || !assignment.appointmentDate || 
        !assignment.appointmentSlot || !assignment.slotId || !assignment.doctorName) {
      throw new Error(`Không thể tự động phân công bác sĩ. Chi tiết lỗi: ${JSON.stringify(assignment || 'null')}`);
    }

    // ✅ VALIDATION: Kiểm tra doctorId có hợp lệ không
    if (!isValidObjectId(assignment.doctorId)) {
      throw new Error(`Doctor ID không hợp lệ từ smart assignment: ${assignment.doctorId}`);
    }

    console.log(`✅ [CREATE-QA] Assignment validation passed for doctor: ${assignment.doctorName}`);

    // STEP 3: Tạo QA với thông tin đầy đủ (bao gồm service info)
    const newQA = await DoctorQA.create({
      userId,
      fullName,
      phone,
      question,
      notes,
      status: 'pending_payment',
      consultationFee: consultationService.price,  // Lấy phí từ service
      serviceId: consultationService._id,          // Thêm serviceId
      serviceName: consultationService.serviceName, // Thêm serviceName
      doctorId: new mongoose.Types.ObjectId(assignment.doctorId),
      appointmentDate: assignment.appointmentDate,
      appointmentSlot: assignment.appointmentSlot,
      slotId: assignment.slotId
    });

    console.log(`📝 [CREATE-QA] Created QA ${newQA._id} with assignment info`);

    // STEP 3: Book slot với timeout 15 phút
    await bookSlotWithTimeout(assignment.doctorId, assignment.slotId.toString(), newQA._id.toString());

    // STEP 4: Populate và return
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

    console.log(`✅ [CREATE-QA] Successfully assigned and booked:`);
    console.log(`   🏥 Service: ${consultationService.serviceName} - ${consultationService.price.toLocaleString('vi-VN')}đ`);
    console.log(`   📅 Date: ${assignment.appointmentDate.toISOString().split('T')[0]}`);
    console.log(`   🕐 Time: ${assignment.appointmentSlot}`);
    console.log(`   👨‍⚕️ Doctor: ${assignment.doctorName}`);

    return populatedQA;

  } catch (error) {
    console.error('❌ [ERROR] Creating QA failed:', error);
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
        await releaseSlot(qa.doctorId.toString(), qa.slotId);
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
        await releaseSlot(qa.doctorId.toString(), qa.slotId);
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
      await releaseSlot(qa.doctorId.toString(), qa.slotId);
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
      await releaseSlot(qa.doctorId.toString(), qa.slotId);
    }

    await DoctorQA.findByIdAndDelete(qaId);
    return qa;

  } catch (error) {
    console.error('Error deleting DoctorQA:', error);
    throw error;
  }
};

// 🧹 LEGACY FUNCTIONS - Deprecated, chỉ giữ để backward compatibility
export const findLeastBookedDoctor = async (): Promise<string> => {
  console.warn('⚠️ [DEPRECATED] findLeastBookedDoctor is deprecated. Use findBestAvailableSlot instead.');
  try {
    const result = await findBestAvailableSlot();
    return result.doctorId;
  } catch (error) {
    throw error;
  }
};

export const findBestDoctorForNextSlot = async () => {
  console.warn('⚠️ [DEPRECATED] findBestDoctorForNextSlot is deprecated. Use findBestAvailableSlot instead.');
  return await findBestAvailableSlot();
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
      await releaseSlot(qa.doctorId.toString(), qa.slotId);
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
          status: 'cancelled',
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