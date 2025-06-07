
import bcrypt from 'bcryptjs';
import Doctor from '../models/Doctor';
import User from '../models/User';

<<<<<<< HEAD
// Data demo cho 5 user accounts với role doctor
const userDemoData = [
  {
    email: 'dr.lehoa@genderhealthcare.com',
    password: 'Doctor123!',
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
    password: 'Doctor123!',
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
    password: 'Doctor123!', 
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
    password: 'Doctor123!',
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
    password: 'Doctor123!',
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
=======
const seedDoctors = async () => {
>>>>>>> origin/fetch/medical-function
  try {
    // Kiểm tra đã có doctor nào chưa
    const existingDoctors = await Doctor.countDocuments();
    if (existingDoctors > 0) {
      console.log('✅ Doctor seed data đã tồn tại, bỏ qua việc tạo mới');
      return;
    }

    console.log('🌱 Đang tạo Doctor seed data...');

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
          image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
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
          image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
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
          image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face',
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
          image: 'https://images.unsplash.com/photo-1594824694996-0ff5843e293c?w=300&h=300&fit=crop&crop=face',
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
          image: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=300&h=300&fit=crop&crop=face',
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
    console.log('   Email: dr.nguyen@genderhealthcare.com | Password: doctor123');
    console.log('   Email: dr.le@genderhealthcare.com | Password: doctor123');
    console.log('   Email: dr.tran@genderhealthcare.com | Password: doctor123');
    console.log('   Email: dr.pham@genderhealthcare.com | Password: doctor123');
    console.log('   Email: dr.hoang@genderhealthcare.com | Password: doctor123');

  } catch (error) {
    console.error('❌ Lỗi khi seed doctors:', error);
  }
};

export default seedDoctors; 

