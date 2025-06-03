import mongoose from 'mongoose';
import DoctorQA from '../models/DoctorQA';
import Doctor from '../models/Doctor';
import User from '../models/User';

export const seedDoctorQA = async () => {
  try {
    // Kiểm tra xem đã có data DoctorQA chưa
    const existingQAs = await DoctorQA.countDocuments();
    if (existingQAs > 0) {
      console.log('✅ DoctorQA seed data đã tồn tại, bỏ qua việc tạo mới');
      return;
    }

    console.log('🌱 Đang tạo DoctorQA seed data...');

    // Lấy user customer và doctor từ DB
    const customerUser = await User.findOne({ role: 'customer' });
    const doctorUser = await User.findOne({ role: 'doctor' });
    
    if (!customerUser) {
      console.log('❌ Không tìm thấy user customer để tạo DoctorQA seed');
      return;
    }

    if (!doctorUser) {
      console.log('❌ Không tìm thấy user doctor để tạo DoctorQA seed');
      return;
    }

    // Lấy doctor record
    const doctor = await Doctor.findOne({ userId: doctorUser._id });
    if (!doctor) {
      console.log('❌ Không tìm thấy doctor record để tạo DoctorQA seed');
      return;
    }

    // Tạo 3 DoctorQA mẫu với các status khác nhau
    const doctorQASeeds = [
      {
        doctorId: doctor._id,
        userId: customerUser._id,
        fullName: customerUser.fullName,
        phone: customerUser.phone || '0987654321',
        question: 'Tôi bị đau bụng thường xuyên sau khi ăn, có phải bệnh gì không? Triệu chứng kéo dài khoảng 2 tuần rồi.',
        notes: 'Đau nhiều nhất vào buổi tối, có kèm theo đầy hơi',
        status: 'pending_payment',
        consultationFee: 200000,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z')
      },
      {
        doctorId: doctor._id,
        userId: customerUser._id,
        fullName: customerUser.fullName,
        phone: customerUser.phone || '0987654321',
        question: 'Con tôi 5 tuổi bị sốt 38.5 độ từ hôm qua, có cần đưa đi viện ngay không?',
        notes: 'Bé ăn uống bình thường, tinh thần khá tỉnh táo',
        status: 'paid',
        consultationFee: 200000,
        createdAt: new Date('2024-01-16T14:20:00Z'),
        updatedAt: new Date('2024-01-16T15:45:00Z')
      },
      {
        doctorId: doctor._id,
        userId: customerUser._id,
        fullName: customerUser.fullName,
        phone: customerUser.phone || '0987654321',
        question: 'Tôi bị mất ngủ liên tục 1 tuần nay, có thuốc gì không gây nghiện để điều trị không?',
        notes: 'Stress công việc nhiều, thường xuyên lo lắng',
        status: 'completed',
        consultationFee: 200000,
        appointmentDate: new Date('2024-01-17T00:00:00Z'),
        appointmentSlot: '14:00-15:00',
        slotId: new mongoose.Types.ObjectId(),
        doctorNotes: 'Đã tư vấn về việc quản lý stress và kê đơn thuốc an thần nhẹ. Khuyên theo dõi thêm 1 tuần.',
        createdAt: new Date('2024-01-17T09:15:00Z'),
        updatedAt: new Date('2024-01-17T15:30:00Z')
      }
    ];

    // Insert tất cả DoctorQA
    const createdQAs = await DoctorQA.insertMany(doctorQASeeds);
    
    console.log(`✅ Đã tạo thành công ${createdQAs.length} DoctorQA mẫu:`);
    createdQAs.forEach((qa, index) => {
      console.log(`   ${index + 1}. Status: ${qa.status} - Question: ${qa.question.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi tạo DoctorQA seed data:', error);
  }
};

// Export default để có thể import dễ dàng
export default seedDoctorQA; 