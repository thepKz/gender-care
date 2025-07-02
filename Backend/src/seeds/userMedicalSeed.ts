import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, UserProfiles, Doctor, Appointments, MedicalRecords } from '../models';

export const seedUserMedicalData = async () => {
  try {
    console.log('🌱 Starting User Medical Data Seeding...');

    // 1. Tạo 2 Users
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const users = await User.insertMany([
      {
        email: 'patient1@gmail.com',
        password: hashedPassword,
        fullName: 'Nguyễn Thị Hạnh',
        phone: '0987654321',
        role: 'customer',
        emailVerified: true,
        isActive: true,
        gender: 'female',
        address: 'Hà Nội',
        year: new Date('1990-05-15')
      },
      {
        email: 'patient2@gmail.com', 
        password: hashedPassword,
        fullName: 'Trần Văn Nam',
        phone: '0976543210',
        role: 'customer',
        emailVerified: true,
        isActive: true,
        gender: 'male',
        address: 'TP.HCM',
        year: new Date('1985-12-20')
      }
    ]);

    console.log(`✅ Created ${users.length} users`);

    // 2. Tạo 1 Doctor để làm doctorId cho medical records
    const doctorUser = await User.create({
      email: 'doctor.medical@clinic.com',
      password: hashedPassword,
      fullName: 'Bác sĩ Lê Thị Minh',
      phone: '0123456789',
      role: 'doctor',
      emailVerified: true,
      isActive: true,
      gender: 'female',
      address: 'Bệnh viện ABC'
    });

    const doctor = await Doctor.create({
      userId: doctorUser._id,
      bio: 'Bác sĩ chuyên khoa Sản Phụ khoa với 10 năm kinh nghiệm',
      experience: 10,
      rating: 4.8,
      specialization: 'Sản Phụ khoa',
      education: 'Đại học Y Hà Nội',
      certificate: 'Chứng chỉ hành nghề số 12345'
    });

    console.log('✅ Created doctor for medical records');

    // 3. Tạo UserProfiles và Medical Records
    const allProfiles = [];
    const allAppointments = [];
    const allMedicalRecords = [];

    for (let userIndex = 0; userIndex < users.length; userIndex++) {
      const user = users[userIndex];
      
      // Tạo 3 profiles cho mỗi user
      for (let profileIndex = 1; profileIndex <= 3; profileIndex++) {
        const profileName = userIndex === 0 
          ? [`Nguyễn Thị Hạnh`, `Con gái - Nguyễn Thị Lan`, `Con trai - Nguyễn Văn Minh`][profileIndex - 1]
          : [`Trần Văn Nam`, `Vợ - Nguyễn Thị Thu`, `Con gái - Trần Thị Hương`][profileIndex - 1];

        const profileGender = userIndex === 0 
          ? ['female', 'female', 'male'][profileIndex - 1]
          : ['male', 'female', 'female'][profileIndex - 1];

        const profileYear = userIndex === 0
          ? [new Date('1990-05-15'), new Date('2015-08-10'), new Date('2018-03-25')][profileIndex - 1]
          : [new Date('1985-12-20'), new Date('1992-07-18'), new Date('2020-11-05')][profileIndex - 1];

        // Tạo UserProfile
        const profile = await UserProfiles.create({
          ownerId: user._id,
          fullName: profileName,
          gender: profileGender,
          phone: user.phone,
          year: profileYear
        });

        allProfiles.push(profile);

        // Tạo Appointment cho mỗi profile  
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() - Math.floor(Math.random() * 30)); // Random trong 30 ngày qua

        const appointment = await Appointments.create({
          createdByUserId: user._id,
          profileId: profile._id,
          appointmentDate: appointmentDate,
          appointmentTime: ['09:00', '14:00', '16:00'][profileIndex - 1],
          appointmentType: 'consultation',
          typeLocation: 'clinic',
          address: 'Phòng khám ABC, 123 Đường XYZ',
          description: `Khám sức khỏe định kỳ cho ${profileName}`,
          status: 'completed'
        });

        allAppointments.push(appointment);

        // Tạo Medical Record tương ứng với từng profile
        const medicalRecordData = getMedicalRecordData(userIndex, profileIndex, profileGender);
        
        const medicalRecord = await MedicalRecords.create({
          doctorId: doctor._id,
          profileId: profile._id,
          appointmentId: appointment._id,
          conclusion: medicalRecordData.conclusion,
          symptoms: medicalRecordData.symptoms,
          treatment: medicalRecordData.treatment,
          medicines: medicalRecordData.medicines,
          notes: medicalRecordData.notes,
          status: "completed"
        });

        allMedicalRecords.push(medicalRecord);

        console.log(`✅ Created profile, appointment & medical record: ${profileName}`);
      }
    }

    console.log(`🎉 Seeding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Doctor: 1`);
    console.log(`   - UserProfiles: ${allProfiles.length}`);
    console.log(`   - Appointments: ${allAppointments.length}`);
    console.log(`   - Medical Records: ${allMedicalRecords.length}`);

  } catch (error) {
    console.error('❌ Error seeding user medical data:', error);
    throw error;
  }
};

// Hàm helper tạo dữ liệu medical record đa dạng
function getMedicalRecordData(userIndex: number, profileIndex: number, gender: string) {
  const medicalData = [
    // User 1 - Nguyễn Thị Hạnh
    [
      // Profile 1 - Chính chủ (female)
      {
        conclusion: 'Viêm nhiễm phụ khoa nhẹ',
        symptoms: 'Ngứa vùng kín, khí hư bất thường, đau bụng dưới nhẹ',
        treatment: 'Sử dụng thuốc kháng sinh và gel vệ sinh phụ khoa, kiêng quan hệ trong 1 tuần',
        medicines: [
          {
            name: 'Metronidazole',
            type: 'antibiotic' as const,
            dosage: '500mg',
            frequency: 2,
            timingInstructions: 'Sáng và tối sau ăn',
            duration: '7 ngày',
            instructions: 'Uống đủ liều, không bỏ sót. Tránh uống rượu khi dùng thuốc.'
          },
          {
            name: 'Lactacyd Feminine',
            type: 'other' as const,
            dosage: '5ml',
            frequency: 2,
            timingInstructions: 'Sáng và tối khi tắm',
            duration: '2 tuần',
            instructions: 'Pha loãng với nước sạch, vệ sinh nhẹ nhàng.'
          }
        ],
        notes: 'Tái khám sau 1 tuần. Giữ vệ sinh cá nhân, mặc đồ lót cotton.'
      },
      // Profile 2 - Con gái (female, 9 tuổi)
      {
        conclusion: 'Viêm họng cấp tính',
        symptoms: 'Sốt 38.5°C, đau họng, khó nuốt, ho khan',
        treatment: 'Nghỉ ngơi, uống nhiều nước, dùng thuốc theo đơn',
        medicines: [
          {
            name: 'Paracetamol trẻ em',
            type: 'painkiller' as const,
            dosage: '250mg',
            frequency: 3,
            timingInstructions: 'Sáng, trưa, tối sau ăn',
            duration: '5 ngày',
            instructions: 'Chỉ uống khi sốt trên 38°C. Cách nhau ít nhất 6 tiếng.'
          },
          {
            name: 'Amoxicillin trẻ em',
            type: 'antibiotic' as const,
            dosage: '125mg',
            frequency: 3,
            timingInstructions: 'Sáng, trưa, tối trước ăn 30 phút',
            duration: '7 ngày',
            instructions: 'Uống đủ liều theo đơn. Không được ngừng thuốc khi hết triệu chứng.'
          }
        ],
        notes: 'Cho bé uống nhiều nước ấm, ăn mềm. Tái khám nếu sốt không giảm sau 3 ngày.'
      },
      // Profile 3 - Con trai (male, 6 tuổi)
      {
        conclusion: 'Viêm da cơ địa (Eczema)',
        symptoms: 'Da khô, ngứa, đỏ ở khuỷu tay và đầu gối',
        treatment: 'Thoa kem dưỡng ẩm, tránh chất kích ứng, dùng thuốc theo đơn',
        medicines: [
          {
            name: 'Hydrocortisone cream 1%',
            type: 'other' as const,
            dosage: 'Lượng vừa đủ',
            frequency: 2,
            timingInstructions: 'Sáng và tối sau tắm',
            duration: '2 tuần',
            instructions: 'Thoa mỏng lên vùng da bị viêm. Không thoa quá 2 tuần liên tục.'
          },
          {
            name: 'Cetaphil Baby Moisturizer',
            type: 'other' as const,
            dosage: 'Lượng vừa đủ',
            frequency: 3,
            timingInstructions: 'Sau mỗi lần tắm và khi da khô',
            duration: 'Sử dụng lâu dài',
            instructions: 'Thoa đều lên toàn thân, đặc biệt vùng da khô.'
          }
        ],
        notes: 'Tránh xà phòng mạnh, mặc quần áo cotton. Cắt ngắn móng tay để tránh gãi.'
      }
    ],
    // User 2 - Trần Văn Nam  
    [
      // Profile 1 - Chính chủ (male)
      {
        conclusion: 'Viêm dạ dày - tá tràng',
        symptoms: 'Đau bụng trên rốn, ợ hơi, buồn nôn, đầy bụng sau ăn',
        treatment: 'Ăn nhỏ nhiều bữa, tránh cay nóng, uống thuốc theo đơn',
        medicines: [
          {
            name: 'Omeprazole',
            type: 'other' as const,
            dosage: '20mg',
            frequency: 1,
            timingInstructions: 'Sáng trước ăn 30 phút',
            duration: '4 tuần',
            instructions: 'Nuốt nguyên viên, không nhai. Uống đều đặn mỗi ngày.'
          },
          {
            name: 'Domperidone',
            type: 'other' as const,
            dosage: '10mg',
            frequency: 3,
            timingInstructions: 'Trước mỗi bữa ăn 15 phút',
            duration: '2 tuần',
            instructions: 'Giúp tiêu hóa và giảm buồn nôn.'
          }
        ],
        notes: 'Kiêng rượu bia, cà phê, thức ăn cay. Ăn chậm, nhai kỹ. Tái khám sau 2 tuần.'
      },
      // Profile 2 - Vợ (female)
      {
        conclusion: 'Thiểu năng tuần hoàn não',
        symptoms: 'Đau đầu, chóng mặt, mệt mỏi, khó tập trung',
        treatment: 'Nghỉ ngơi đầy đủ, tập thể dục nhẹ, dùng thuốc cải thiện tuần hoàn',
        medicines: [
          {
            name: 'Ginkgo Biloba',
            type: 'other' as const,
            dosage: '120mg',
            frequency: 2,
            timingInstructions: 'Sáng và chiều sau ăn',
            duration: '1 tháng',
            instructions: 'Cải thiện tuần hoàn máu não, tăng khả năng tập trung.'
          },
          {
            name: 'Vitamin B Complex',
            type: 'vitamin' as const,
            dosage: '1 viên',
            frequency: 1,
            timingInstructions: 'Sáng sau ăn',
            duration: '2 tháng',
            instructions: 'Bổ sung vitamin nhóm B cho hệ thần kinh.'
          }
        ],
        notes: 'Ngủ đủ 8 tiếng, tránh stress. Tập yoga hoặc đi bộ 30 phút/ngày.'
      },
      // Profile 3 - Con gái (female, 4 tuổi)
      {
        conclusion: 'Viêm phế quản cấp',
        symptoms: 'Ho có đờm, sốt nhẹ, khó thở, thở khò khè',
        treatment: 'Xông mũi họng, uống nhiều nước ấm, dùng thuốc theo đơn',
        medicines: [
          {
            name: 'Salbutamol syrup',
            type: 'other' as const,
            dosage: '2.5ml',
            frequency: 3,
            timingInstructions: 'Sáng, trưa, tối sau ăn',
            duration: '7 ngày',
            instructions: 'Giúp giãn phế quản, giảm khó thở. Lắc đều trước khi uống.'
          },
          {
            name: 'Carbocisteine syrup',
            type: 'other' as const,
            dosage: '2.5ml',
            frequency: 3,
            timingInstructions: 'Sáng, trưa, tối trước ăn',
            duration: '5 ngày',
            instructions: 'Làm loãng đờm, dễ tống đờm ra ngoài.'
          }
        ],
        notes: 'Xông mũi họng 2 lần/ngày. Tránh khói thuốc, bụi. Tái khám nếu ho không giảm sau 1 tuần.'
      }
    ]
  ];

  return medicalData[userIndex][profileIndex - 1];
} 