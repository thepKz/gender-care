import mongoose from 'mongoose';
import DoctorSchedules from '../models/DoctorSchedules';
import Doctor from '../models/Doctor';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gender-healthcare';
    await mongoose.connect(mongoURI);
    console.log('✅ Kết nối MongoDB thành công');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    process.exit(1);
  }
};

const importDoctorSchedules = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Bắt đầu import Doctor Schedules...');

    // Kiểm tra đã có schedule nào chưa
    const existingSchedules = await DoctorSchedules.countDocuments();
    if (existingSchedules > 0) {
      console.log('⚠️ Đã có schedules trong database. Xóa hết để tạo mới? (y/N)');
      console.log('   Bỏ qua việc tạo mới để tránh duplicate...');
      return;
    }

    // Lấy tất cả doctors có sẵn (không populate)
    const doctors = await Doctor.find();
    if (doctors.length === 0) {
      console.warn('⚠️ Không tìm thấy doctor nào trong database.');
      console.log('💡 Hãy đảm bảo đã có doctors trong database trước khi import schedules.');
      return;
    }

    console.log(`📋 Tìm thấy ${doctors.length} bác sĩ trong database`);

    // Định nghĩa time slots theo khung giờ làm việc thực tế
    const timeSlots = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    // Tạo schedule cho tháng 6/2025 (30 ngày)
    const year = 2025;
    const month = 5; // June = month 5 (0-indexed)
    const daysInMonth = 30;

    let totalSchedulesCreated = 0;
    let totalSlotsCreated = 0;

    for (const doctor of doctors) {
      console.log(`📅 Tạo schedule cho Doctor ID: ${doctor._id}`);
      
      const weekSchedule = [];

      // Tạo schedule cho từng ngày trong tháng 6/2025
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

        // Bác sĩ nghỉ chủ nhật (dayOfWeek === 0)
        if (dayOfWeek === 0) {
          continue;
        }

        // Tạo slots cho ngày làm việc
        const dailySlots = timeSlots.map(slotTime => {
          // Random một số slots bị "Booked" để realistic hơn (15% chance)
          const randomStatus = Math.random() < 0.85 ? 'Free' : 'Booked';
          
          return {
            _id: new mongoose.Types.ObjectId(),
            slotTime,
            status: randomStatus
          };
        });

        // Thêm vào weekSchedule
        weekSchedule.push({
          _id: new mongoose.Types.ObjectId(),
          dayOfWeek: currentDate,
          slots: dailySlots
        });

        totalSlotsCreated += dailySlots.length;
      }

      // Tạo DoctorSchedule record
      await DoctorSchedules.create({
        doctorId: doctor._id,
        weekSchedule: weekSchedule
      });

      console.log(`   ✅ Tạo ${weekSchedule.length} ngày làm việc`);
      totalSchedulesCreated++;
    }

    console.log('\n🎉 Hoàn thành import Doctor Schedules!');
    console.log('📊 Thống kê chi tiết:');
    console.log(`   📋 Số bác sĩ có schedule: ${totalSchedulesCreated}`);
    console.log(`   📅 Thời gian: Tháng 6/2025 (30 ngày)`);
    console.log(`   ⏰ Time slots mỗi ngày: ${timeSlots.length} slots`);
    console.log(`   �� Khung giờ: 8:00-11:30 và 13:00-17:00`);
    console.log(`   🚫 Nghỉ: Chủ nhật`);
    console.log(`   🎯 Tổng slots tạo: ${totalSlotsCreated} slots`);
    console.log(`   📈 Tỷ lệ Available: ~85% slots`);
    
    console.log('\n💡 Giờ đây bạn có thể:');
    console.log('   - Truy cập /booking để test chọn ngày & giờ');
    console.log('   - API /doctor-schedules sẽ trả về data');
    console.log('   - Frontend calendar sẽ hiển thị slots available');

  } catch (error) {
    console.error('❌ Lỗi khi import doctor schedules:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Đã ngắt kết nối MongoDB');
    process.exit(0);
  }
};

// Chạy import
console.log('🚀 Doctor Schedules Import Tool');
console.log('================================');
importDoctorSchedules(); 