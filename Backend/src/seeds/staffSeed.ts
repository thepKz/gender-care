import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const seedStaff = async () => {
  try {
    // Kết nối MongoDB
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI không được định nghĩa trong .env');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📁 Đã kết nối MongoDB thành công');

    // Kiểm tra staff đã tồn tại chưa
    const existingStaff = await User.findOne({ email: 'staff@genderhealthcare.com' });
    
    if (existingStaff) {
      console.log('✅ Staff user đã tồn tại');
      console.log('📋 Thông tin đăng nhập Staff:');
      console.log('Email: staff@genderhealthcare.com');
      console.log('Password: staff123');
      process.exit(0);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('staff123', 10);
    
    // Tạo staff user
    const newStaff = await User.create({
      email: 'staff@genderhealthcare.com',
      password: hashedPassword,
      fullName: 'Nhân viên Demo',
      phone: '0987654321',
      role: 'staff',
      emailVerified: true,
      isActive: true,
      gender: 'male',
      address: 'Hà Nội'
    });

    console.log('✅ Đã tạo staff user thành công!');
    console.log('📋 Thông tin đăng nhập Staff:');
    console.log('Email: staff@genderhealthcare.com');
    console.log('Password: staff123');
    console.log('Role: staff');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed staff:', error);
    process.exit(1);
  }
};

// Chạy seed nếu file được gọi trực tiếp
if (require.main === module) {
  seedStaff();
}

export default seedStaff; 