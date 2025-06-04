import bcrypt from 'bcryptjs';
import User from '../models/User';
import { Doctor } from '../models/Doctor';

// Data demo cho 5 user accounts với role doctor
const userDemoData = [
  {
    email: 'dr.lehoa@genderhealthcare.com',
    password: 'doctor123',
    fullName: 'BS. Lê Thị Hoa',
    phone: '0901234568',
    role: 'doctor',
    emailVerified: true,
    isActive: true,
    gender: 'female',
    address: 'TP. Hồ Chí Minh'
  },
  {
    email: 'dr.tranminh@genderhealthcare.com', 
    password: 'doctor123',
    fullName: 'BS. Trần Minh Đức',
    phone: '0901234569',
    role: 'doctor',
    emailVerified: true,
    isActive: true,
    gender: 'male',
    address: 'TP. Hồ Chí Minh'
  },
  {
    email: 'dr.nguyenlan@genderhealthcare.com',
    password: 'doctor123', 
    fullName: 'BS. Nguyễn Thị Lan',
    phone: '0901234570',
    role: 'doctor',
    emailVerified: true,
    isActive: true,
    gender: 'female',
    address: 'TP. Hồ Chí Minh'
  },
  {
    email: 'dr.hoangnam@genderhealthcare.com',
    password: 'doctor123',
    fullName: 'BS. Hoàng Văn Nam', 
    phone: '0901234571',
    role: 'doctor',
    emailVerified: true,
    isActive: true,
    gender: 'male',
    address: 'TP. Hồ Chí Minh'
  },
  {
    email: 'dr.phamthuy@genderhealthcare.com',
    password: 'doctor123',
    fullName: 'BS. Phạm Thị Thùy',
    phone: '0901234572', 
    role: 'doctor',
    emailVerified: true,
    isActive: true,
    gender: 'female',
    address: 'TP. Hồ Chí Minh'
  }
];

// Data demo cho 5 doctor records
const doctorDemoData = [
  {
    bio: 'Chuyên gia về sức khỏe sinh sản nữ và điều trị vô sinh',
    experience: 12,
    rating: 4.9,
    specialization: 'Phụ khoa - Sinh sản',
    education: 'Thạc sĩ Y khoa - Đại học Y Phạm Ngọc Thạch',
    certificate: 'Chứng chỉ chuyên khoa cấp I Nội tiết'
  },
  {
    bio: 'Chuyên gia về sức khỏe sinh sản nam và điều trị vô sinh',
    experience: 15,
    rating: 4.8,
    specialization: 'Nam khoa - Sinh sản',
    education: 'Tiến sĩ Y khoa - Đại học Y Dược TP.HCM', 
    certificate: 'Chứng chỉ chuyên khoa cấp II Nam khoa'
  },
  {
    bio: 'Chuyên gia tư vấn sức khỏe tình dục và kế hoạch hóa gia đình',
    experience: 8,
    rating: 4.7,
    specialization: 'Tư vấn sức khỏe tình dục',
    education: 'Bác sĩ đa khoa - Đại học Y khoa Phạm Ngọc Thạch',
    certificate: 'Chứng chỉ tư vấn kế hoạch hóa gia đình'
  },
  {
    bio: 'Chuyên gia về các bệnh lây truyền qua đường tình dục',
    experience: 10,
    rating: 4.6,
    specialization: 'Nhiễm khuẩn học - STI',
    education: 'Thạc sĩ Y khoa - Đại học Y Dược TP.HCM',
    certificate: 'Chứng chỉ chuyên khoa cấp I Nhiễm khuẩn'
  },
  {
    bio: 'Chuyên gia tâm lý học tình dục và trị liệu cặp đôi',
    experience: 6,
    rating: 4.8,
    specialization: 'Tâm lý học tình dục',
    education: 'Thạc sĩ Tâm lý học - Đại học Khoa học Xã hội và Nhân văn',
    certificate: 'Chứng chỉ trị liệu tâm lý cặp đôi'
  }
];

export const seedDoctors = async () => {
  try {
    // Kiểm tra xem đã có data demo chưa
    const existingDoctor = await User.findOne({ email: 'dr.lehoa@genderhealthcare.com' });
    if (existingDoctor) {
      console.log('Doctor demo data đã tồn tại, bỏ qua seed');
      return;
    }

    console.log('Bắt đầu seed doctor data...');

    // Tạo 5 user accounts
    const createdUsers = [];
    for (let i = 0; i < userDemoData.length; i++) {
      const userData = userDemoData[i];
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Tạo user
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      
      createdUsers.push(user);
      console.log(`Đã tạo user: ${user.fullName}`);
    }

    // Tạo 5 doctor records tương ứng
    for (let i = 0; i < doctorDemoData.length; i++) {
      const doctorData = doctorDemoData[i];
      const userId = createdUsers[i]._id;
      
      // Tạo doctor
      const doctor = await Doctor.create({
        userId,
        ...doctorData
      });
      
      console.log(`Đã tạo doctor: ${createdUsers[i].fullName}`);
    }

    console.log('Seed doctor data thành công!');
  } catch (error) {
    console.error('Lỗi khi seed doctor data:', error);
  }
}; 