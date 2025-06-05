import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const seedStaff = async () => {
  try {
    // Kiểm tra staff đã tồn tại chưa
    const existingStaff = await User.findOne({ email: 'staff@genderhealthcare.com' });
    
    if (existingStaff) {
      console.log('✅ Staff user đã tồn tại');
      return;
    }

    console.log('🌱 Đang tạo Staff seed data...');

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
    console.log('   Email: staff@genderhealthcare.com');
    console.log('   Password: staff123');
    console.log('   Role: staff');

  } catch (error) {
    console.error('❌ Lỗi khi seed staff:', error);
  }
};

export default seedStaff; 