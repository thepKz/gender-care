import Doctor from '../models/Doctor';
import DoctorSchedules from '../models/DoctorSchedules';
import mongoose from 'mongoose';

// Hàm tạo các time slots cố định (7h-15h)
const generateTimeSlots = (isWeekend: boolean = false) => {
  const baseSlots = [
    '07:00-08:00',
    '08:00-09:00', 
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00'
  ];

  return baseSlots.map(slotTime => {
    let status = 'Free';
    
    // Cuối tuần: random 40% slots nghỉ
    if (isWeekend) {
      const rand = Math.random();
      if (rand < 0.4) status = 'Absent';
      else if (rand < 0.6) status = 'Booked';
    } else {
      // Ngày thường: random realistic
      const rand = Math.random();
      if (rand < 0.15) status = 'Booked';    // 15% đã đặt
      else if (rand < 0.2) status = 'Absent'; // 5% nghỉ
    }
    
    return {
      _id: new mongoose.Types.ObjectId(),
      slotTime,
      status
    };
  });
};

// Hàm tạo lịch cho 14 ngày tiếp theo
const generateWeekSchedule = (doctorId: mongoose.Types.ObjectId) => {
  const schedule = [];
  const today = new Date();
  
  for (let i = 0; i < 14; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    
    // Kiểm tra cuối tuần (Saturday = 6, Sunday = 0)
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    
    schedule.push({
      _id: new mongoose.Types.ObjectId(),
      dayOfWeek: currentDate,
      slots: generateTimeSlots(isWeekend)
    });
  }
  
  return schedule;
};

export const seedDoctorSchedules = async () => {
  try {
    console.log('🌱 Đang tạo Doctor Schedule seed data...');

    // Kiểm tra đã có schedule nào chưa
    const existingSchedules = await DoctorSchedules.countDocuments();
    if (existingSchedules > 0) {
      console.log('✅ Doctor Schedule seed data đã tồn tại, bỏ qua việc tạo mới');
      return;
    }

    // Lấy tất cả doctors hiện có
    const doctors = await Doctor.find({ isDeleted: { $ne: true } }).populate('userId', 'fullName');
    
    if (doctors.length === 0) {
      throw new Error('❌ Không tìm thấy bác sĩ nào. Vui lòng chạy doctorSeed trước!');
    }

    console.log(`📋 Tìm thấy ${doctors.length} bác sĩ, đang tạo lịch làm việc...`);

    // Tạo schedule cho từng bác sĩ
    const schedulePromises = doctors.map(async (doctor) => {
      const weekSchedule = generateWeekSchedule(doctor._id);
      
      const doctorSchedule = await DoctorSchedules.create({
        doctorId: doctor._id,
        weekSchedule: weekSchedule
      });

      const doctorName = (doctor as any).userId?.fullName || 'Unknown Doctor';
      console.log(`   ✅ Đã tạo lịch 14 ngày cho ${doctorName} (${weekSchedule.length} ngày × 8 slots)`);
      
      return doctorSchedule;
    });

    // Thực hiện tạo tất cả schedules
    const createdSchedules = await Promise.all(schedulePromises);

    // Thống kê kết quả
    const totalSlots = createdSchedules.reduce((total, schedule) => {
      return total + schedule.weekSchedule.reduce((dayTotal, day) => dayTotal + day.slots.length, 0);
    }, 0);

    console.log('\n🎉 Hoàn thành tạo Doctor Schedule seed data!');
    console.log(`📊 Thống kê:`);
    console.log(`   - Số bác sĩ: ${createdSchedules.length}`);
    console.log(`   - Tổng ngày làm việc: ${createdSchedules.length * 14}`);
    console.log(`   - Tổng time slots: ${totalSlots}`);
    console.log(`   - Thời gian: ${new Date().toLocaleDateString('vi-VN')} - ${new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')}`);

    return createdSchedules;

  } catch (error) {
    console.error('❌ Lỗi khi tạo doctor schedule seeds:', error);
    throw error;
  }
};

export default seedDoctorSchedules; 