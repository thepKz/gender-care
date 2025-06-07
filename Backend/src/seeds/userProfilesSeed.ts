import bcrypt from 'bcryptjs';
import User from '../models/User';
import UserProfiles from '../models/UserProfiles';

const seedUserProfiles = async () => {
  try {
    console.log('🌱 Bắt đầu seeding UserProfiles...');

    // Kiểm tra xem đã có data chưa để tránh duplicate
    const existingUserProfiles = await UserProfiles.findOne({ fullName: 'Nguyễn Văn Anh' });
    if (existingUserProfiles) {
      console.log('📝 UserProfiles seed data đã tồn tại, bỏ qua...');
      return;
    }

    // Tạo user customer chính (chủ tài khoản)
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const mainUser = await User.create({
      email: 'nguyen.van.anh@gmail.com',
      password: hashedPassword,
      fullName: 'Nguyễn Văn Anh',
      phone: '0987654321',
      role: 'customer',
      emailVerified: true,
      isActive: true,
      gender: 'male',
      address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
      year: new Date('1995-03-15')
    });

    console.log('✅ Đã tạo user chính:', mainUser.email);

    // Tạo UserProfiles cho cả gia đình
    const userProfiles = [
      {
        ownerId: mainUser._id,
        fullName: 'Nguyễn Văn Anh',
        gender: 'male',
        phone: '0987654321',
        year: new Date('1995-03-15')
      },
      {
        ownerId: mainUser._id,
        fullName: 'Trần Thị Bình',
        gender: 'female', 
        phone: '0976543210',
        year: new Date('1997-07-22')
      },
      {
        ownerId: mainUser._id,
        fullName: 'Nguyễn Thị Cẩm',
        gender: 'female',
        phone: null,
        year: new Date('2020-12-10')
      }
    ];

    // Insert tất cả profiles
    const createdProfiles = await UserProfiles.insertMany(userProfiles);
    
    console.log('✅ Đã tạo các UserProfiles:');
    createdProfiles.forEach((profile, index) => {
      const relationship = index === 0 ? '(Chính chủ)' : 
                          index === 1 ? '(Vợ)' : '(Con gái)';
      console.log(`   - ${profile.fullName} ${relationship}`);
    });

    console.log(`🎉 Hoàn thành seeding UserProfiles: ${createdProfiles.length} profiles cho gia đình`);

  } catch (error) {
    console.error('❌ Lỗi khi seeding UserProfiles:', error);
    throw error;
  }
};

export default seedUserProfiles; 