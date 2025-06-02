import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Doctor from '../models/Doctor';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const seedDoctors = async () => {
  try {
    // Kết nối MongoDB
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI không được định nghĩa trong .env');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📁 Đã kết nối MongoDB thành công');

    // Xóa dữ liệu bác sĩ cũ (nếu có)
    const existingDoctors = await Doctor.find().populate('userId');
    for (const doctor of existingDoctors) {
      if (doctor.userId) {
        await User.findByIdAndDelete(doctor.userId);
      }
      await Doctor.findByIdAndDelete(doctor._id);
    }
    console.log('🗑️  Đã xóa dữ liệu bác sĩ demo cũ');

    // Data demo cho 5 bác sĩ
    const doctorsData = [
      {
        user: {
          email: 'dr.nguyen@genderhealthcare.com',
          password: 'doctor123',
          fullName: 'BS. Nguyễn Văn Nam',
          phone: '0901234567',
          role: 'doctor' as const,
          emailVerified: true,
          isActive: true,
          gender: 'male',
          address: 'Hà Nội'
        },
        doctor: {
          bio: 'Bác sĩ chuyên khoa Nội tiết - Sinh sản nam với 15 năm kinh nghiệm',
          experience: 15,
          rating: 4.8,
          specialization: 'Nội tiết - Sinh sản nam',
          education: 'Tiến sĩ Y khoa - Đại học Y Hà Nội',
          certificate: 'Chứng chỉ chuyên khoa cấp I Nội tiết'
        }
      },
      {
        user: {
          email: 'dr.le@genderhealthcare.com',
          password: 'doctor123',
          fullName: 'BS. Lê Thị Hoa',
          phone: '0901234568',
          role: 'doctor' as const,
          emailVerified: true,
          isActive: true,
          gender: 'female',
          address: 'TP. Hồ Chí Minh'
        },
        doctor: {
          bio: 'Chuyên gia về sức khỏe sinh sản nữ và điều trị vô sinh',
          experience: 12,
          rating: 4.9,
          specialization: 'Phụ khoa - Sinh sản',
          education: 'Thạc sĩ Y khoa - Đại học Y Phạm Ngọc Thạch',
          certificate: 'Chứng chỉ chuyên khoa cấp II Phụ sản'
        }
      },
      {
        user: {
          email: 'dr.tran@genderhealthcare.com',
          password: 'doctor123',
          fullName: 'BS. Trần Minh Đức',
          phone: '0901234569',
          role: 'doctor' as const,
          emailVerified: true,
          isActive: true,
          gender: 'male',
          address: 'Đà Nẵng'
        },
        doctor: {
          bio: 'Bác sĩ chuyên về tâm lý học giới tính và tư vấn chuyển đổi giới tính',
          experience: 8,
          rating: 4.7,
          specialization: 'Tâm lý học giới tính',
          education: 'Thạc sĩ Tâm lý học - Đại học Quốc gia TP.HCM',
          certificate: 'Chứng chỉ tư vấn tâm lý giới tính quốc tế'
        }
      },
      {
        user: {
          email: 'dr.pham@genderhealthcare.com',
          password: 'doctor123',
          fullName: 'BS. Phạm Thị Lan',
          phone: '0901234570',
          role: 'doctor' as const,
          emailVerified: true,
          isActive: true,
          gender: 'female',
          address: 'Hải Phòng'
        },
        doctor: {
          bio: 'Chuyên gia phẫu thuật thẩm mỹ và tái tạo hình dạng cơ thể',
          experience: 10,
          rating: 4.6,
          specialization: 'Phẫu thuật thẩm mỹ giới tính',
          education: 'Tiến sĩ Y khoa - Đại học Y Hải Phòng',
          certificate: 'Chứng chỉ phẫu thuật tạo hình quốc tế'
        }
      },
      {
        user: {
          email: 'dr.hoang@genderhealthcare.com',
          password: 'doctor123',
          fullName: 'BS. Hoàng Văn Tuấn',
          phone: '0901234571',
          role: 'doctor' as const,
          emailVerified: true,
          isActive: true,
          gender: 'male',
          address: 'Cần Thơ'
        },
        doctor: {
          bio: 'Bác sĩ điều trị hormone và chăm sóc sức khỏe người chuyển giới',
          experience: 7,
          rating: 4.5,
          specialization: 'Điều trị hormone',
          education: 'Thạc sĩ Y khoa - Đại học Y Cần Thơ',
          certificate: 'Chứng chỉ điều trị hormone replacement therapy'
        }
      }
    ];

    // Tạo từng bác sĩ
    for (const data of doctorsData) {
      // Hash password
      const hashedPassword = await bcrypt.hash(data.user.password, 10);
      
      // Tạo User trước
      const newUser = await User.create({
        ...data.user,
        password: hashedPassword
      });

      // Tạo Doctor với userId
      const newDoctor = await Doctor.create({
        ...data.doctor,
        userId: newUser._id
      });

      console.log(`✅ Đã tạo bác sĩ: ${data.user.fullName} (${data.doctor.specialization})`);
    }

    console.log('🎉 Hoàn thành seed 5 bác sĩ demo!');
    console.log('\n📋 Thông tin đăng nhập:');
    console.log('Email: dr.nguyen@genderhealthcare.com | Password: doctor123');
    console.log('Email: dr.le@genderhealthcare.com | Password: doctor123');
    console.log('Email: dr.tran@genderhealthcare.com | Password: doctor123');
    console.log('Email: dr.pham@genderhealthcare.com | Password: doctor123');
    console.log('Email: dr.hoang@genderhealthcare.com | Password: doctor123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed doctors:', error);
    process.exit(1);
  }
};

// Chạy seed nếu file được gọi trực tiếp
if (require.main === module) {
  seedDoctors();
}

export default seedDoctors; 