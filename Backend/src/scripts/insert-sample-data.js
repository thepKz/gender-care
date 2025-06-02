const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

// Đọc .env từ thư mục Backend (2 cấp lên từ scripts/)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Kiểm tra và xử lý MONGO_URI
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/gender-healthcare";

if (!process.env.MONGO_URI) {
  console.log('⚠️  Không tìm thấy MONGO_URI trong file .env');
  console.log('🔧 Sử dụng default: mongodb://localhost:27017/gender-healthcare');
  console.log('💡 Để sử dụng URI khác, tạo file .env với MONGO_URI=your_connection_string');
} else {
  console.log('✅ Đã tìm thấy MONGO_URI trong file .env');
  console.log('🔗 Kết nối tới MongoDB Atlas...');
}

// Extract DB name from URI safely
let DB_NAME;
try {
  DB_NAME = MONGO_URI.split('/').pop().split('?')[0];
  if (!DB_NAME || DB_NAME === '') {
    DB_NAME = 'gender-healthcare'; // Default database name if not specified
  }
} catch (error) {
  DB_NAME = 'gender-healthcare'; // Default database name
}

console.log(`🎯 Target Database: ${DB_NAME}`);

async function insertSampleData() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('🔗 Đã kết nối MongoDB để insert sample data...');
    
    const db = client.db(DB_NAME);
    
    // ====================================
    // 1. INSERT USERS (bổ sung doctors)
    // ====================================
    const newUsers = [
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd02"),
        email: "bs.lethihoa@gmail.com",
        password: "$2b$10$hashedpassword3",
        fullName: "BS. Lê Thị Hoa",
        phone: "0903456789",
        avatar: "https://example.com/doctor1.jpg",
        gender: "female",
        address: "789 Trần Hưng Đạo, Quận 1, TP.HCM",
        year: new Date("1985-03-10"),
        role: "doctor",
        emailVerified: true,
        isActive: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd03"),
        email: "bs.nguyenvanan@gmail.com",
        password: "$2b$10$hashedpassword4",
        fullName: "BS. Nguyễn Văn An",
        phone: "0904567890",
        avatar: "https://example.com/doctor2.jpg",
        gender: "male",
        address: "321 Pasteur, Quận 3, TP.HCM",
        year: new Date("1982-07-25"),
        role: "doctor",
        emailVerified: true,
        isActive: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcdef"),
        email: "nguyenthimai@gmail.com",
        password: "$2b$10$hashedpassword1",
        fullName: "Nguyễn Thị Mai",
        phone: "0901234567",
        avatar: "https://example.com/avatar1.jpg",
        gender: "female",
        address: "123 Nguyễn Văn Cừ, Quận 5, TP.HCM",
        year: new Date("1992-05-15"),
        role: "customer",
        emailVerified: true,
        isActive: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd01"),
        email: "tranthihuong@gmail.com",
        password: "$2b$10$hashedpassword2",
        fullName: "Trần Thị Hương",
        phone: "0902345678",
        avatar: "https://example.com/avatar2.jpg",
        gender: "female",
        address: "456 Lê Văn Sỹ, Quận 3, TP.HCM",
        year: new Date("1988-08-20"),
        role: "customer",
        emailVerified: true,
        isActive: true,
        createdAt: new Date("2024-01-02T00:00:00Z"),
        updatedAt: new Date("2024-01-02T00:00:00Z")
      }
    ];

    // Insert users (ignore duplicates if exist)
    for (const user of newUsers) {
      try {
        await db.collection('users').insertOne(user);
        console.log(`✅ Inserted user: ${user.fullName}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  User already exists: ${user.fullName}`);
        } else {
          console.error(`❌ Error inserting user ${user.fullName}:`, error.message);
        }
      }
    }

    // ====================================
    // 2. INSERT DOCTORS
    // ====================================
    const doctors = [
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd10"),
        userId: new ObjectId("672a1b2c3d4e5f6789abcd02"),
        bio: "Bác sĩ chuyên khoa Sản phụ khoa với hơn 15 năm kinh nghiệm. Tốt nghiệp Đại học Y Dược TP.HCM, từng công tác tại các bệnh viện lớn.",
        experience: 15,
        rating: 4.8,
        specialization: "Sản phụ khoa",
        education: "Tiến sĩ Y học - Đại học Y Dược TP.HCM",
        certificate: "Chứng chỉ hành nghề số 12345/BYT",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd11"),
        userId: new ObjectId("672a1b2c3d4e5f6789abcd03"),
        bio: "Bác sĩ chuyên khoa Nội tiết - Đái tháo đường với 12 năm kinh nghiệm điều trị các bệnh lý nội tiết tố nữ.",
        experience: 12,
        rating: 4.7,
        specialization: "Nội tiết học",
        education: "Thạc sĩ Y học - Đại học Y khoa Phạm Ngọc Thạch",
        certificate: "Chứng chỉ hành nghề số 67890/BYT",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z")
      }
    ];

    await db.collection('doctors').insertMany(doctors);
    console.log('✅ Inserted doctors');

    // ====================================
    // 3. INSERT USER PROFILES
    // ====================================
    const userProfiles = [
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd20"),
        ownerId: new ObjectId("672a1b2c3d4e5f6789abcdef"),
        fullName: "Nguyễn Thị Mai",
        gender: "female",
        phone: "0901234567",
        year: new Date("1992-05-15"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd21"),
        ownerId: new ObjectId("672a1b2c3d4e5f6789abcdef"),
        fullName: "Nguyễn Thị Hương (Con gái)",
        gender: "female",
        phone: "",
        year: new Date("2015-12-10"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd22"),
        ownerId: new ObjectId("672a1b2c3d4e5f6789abcd01"),
        fullName: "Trần Thị Hương",
        gender: "female",
        phone: "0902345678",
        year: new Date("1988-08-20"),
        createdAt: new Date("2024-01-02T00:00:00Z"),
        updatedAt: new Date("2024-01-02T00:00:00Z")
      }
    ];

    await db.collection('userprofiles').insertMany(userProfiles);
    console.log('✅ Inserted user profiles');

    // ====================================
    // 4. INSERT SERVICES
    // ====================================
    const services = [
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd30"),
        serviceName: "Tư vấn sức khỏe giới tính",
        price: 300000,
        description: "Tư vấn về các vấn đề sức khỏe sinh sản, giới tính với bác sĩ chuyên khoa",
        isDeleted: false,
        serviceType: "consultation",
        availableAt: ["Online", "Center"]
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd31"),
        serviceName: "Xét nghiệm STI cơ bản",
        price: 850000,
        description: "Xét nghiệm các bệnh lây truyền qua đường tình dục (HIV, Syphilis, Gonorrhea, Chlamydia)",
        isDeleted: false,
        serviceType: "test",
        availableAt: ["Center"]
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd32"),
        serviceName: "Khám phụ khoa tổng quát",
        price: 500000,
        description: "Khám sức khỏe phụ khoa định kỳ, tầm soát ung thư cổ tử cung",
        isDeleted: false,
        serviceType: "consultation",
        availableAt: ["Center"]
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd33"),
        serviceName: "Tư vấn kế hoạch hóa gia đình",
        price: 200000,
        description: "Tư vấn các phương pháp tránh thai, kế hoạch hóa gia đình",
        isDeleted: false,
        serviceType: "consultation",
        availableAt: ["Online", "Center", "Athome"]
      }
    ];

    await db.collection('services').insertMany(services);
    console.log('✅ Inserted services');

    // ====================================
    // 5. INSERT SERVICE PACKAGES
    // ====================================
    const servicePackages = [
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd40"),
        name: "Gói chăm sóc sức khỏe phụ nữ cơ bản",
        description: "Bao gồm tư vấn sức khỏe giới tính + khám phụ khoa tổng quát",
        priceBeforeDiscount: 800000,
        price: 650000,
        serviceIds: [
          new ObjectId("672a1b2c3d4e5f6789abcd30"),
          new ObjectId("672a1b2c3d4e5f6789abcd32")
        ],
        isActive: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd41"),
        name: "Gói xét nghiệm toàn diện",
        description: "Bao gồm xét nghiệm STI + tư vấn kết quả với bác sĩ",
        priceBeforeDiscount: 1150000,
        price: 1000000,
        serviceIds: [
          new ObjectId("672a1b2c3d4e5f6789abcd31"),
          new ObjectId("672a1b2c3d4e5f6789abcd30")
        ],
        isActive: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z")
      }
    ];

    await db.collection('servicepackages').insertMany(servicePackages);
    console.log('✅ Inserted service packages');

    // ====================================
    // 6. INSERT DOCTOR SCHEDULES
    // ====================================
    const doctorSchedules = [
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd50"),
        doctorId: new ObjectId("672a1b2c3d4e5f6789abcd10"),
        weekSchedule: [
          {
            _id: new ObjectId("672a1b2c3d4e5f6789abcd60"),
            dayOfWeek: "Monday",
            slots: [
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd70"),
                slotTime: "08:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd71"),
                slotTime: "09:00",
                isBooked: true
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd72"),
                slotTime: "10:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd73"),
                slotTime: "14:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd74"),
                slotTime: "15:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd75"),
                slotTime: "16:00",
                isBooked: true
              }
            ]
          },
          {
            _id: new ObjectId("672a1b2c3d4e5f6789abcd61"),
            dayOfWeek: "Tuesday",
            slots: [
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd76"),
                slotTime: "08:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd77"),
                slotTime: "09:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd78"),
                slotTime: "10:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd79"),
                slotTime: "14:00",
                isBooked: false
              }
            ]
          },
          {
            _id: new ObjectId("672a1b2c3d4e5f6789abcd62"),
            dayOfWeek: "Wednesday",
            slots: [
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd7a"),
                slotTime: "08:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd7b"),
                slotTime: "09:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd7c"),
                slotTime: "15:00",
                isBooked: false
              }
            ]
          }
        ],
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcd51"),
        doctorId: new ObjectId("672a1b2c3d4e5f6789abcd11"),
        weekSchedule: [
          {
            _id: new ObjectId("672a1b2c3d4e5f6789abcd63"),
            dayOfWeek: "Monday",
            slots: [
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd7d"),
                slotTime: "09:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd7e"),
                slotTime: "10:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd7f"),
                slotTime: "14:00",
                isBooked: false
              }
            ]
          },
          {
            _id: new ObjectId("672a1b2c3d4e5f6789abcd64"),
            dayOfWeek: "Thursday",
            slots: [
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd80"),
                slotTime: "08:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd81"),
                slotTime: "09:00",
                isBooked: false
              },
              {
                _id: new ObjectId("672a1b2c3d4e5f6789abcd82"),
                slotTime: "15:00",
                isBooked: false
              }
            ]
          }
        ],
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z")
      }
    ];

    await db.collection('doctorschedules').insertMany(doctorSchedules);
    console.log('✅ Inserted doctor schedules');

    // ====================================
    // 7. INSERT APPOINTMENTS
    // ====================================
    const appointments = [
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcde0"),
        createdByUserId: new ObjectId("672a1b2c3d4e5f6789abcdef"),
        profileId: new ObjectId("672a1b2c3d4e5f6789abcd20"),
        serviceId: new ObjectId("672a1b2c3d4e5f6789abcd30"),
        slotId: new ObjectId("672a1b2c3d4e5f6789abcd71"), // Slot 09:00 Monday đã booked
        appointmentDate: new Date("2024-06-10T00:00:00Z"), // Monday
        appointmentTime: "09:00",
        appointmentType: "consultation",
        typeLocation: "Online",
        address: "",
        description: "Tư vấn về chu kỳ kinh nguyệt không đều",
        notes: "Khách hàng báo chu kỳ kéo dài 45 ngày",
        status: "confirmed",
        createdAt: new Date("2024-06-05T00:00:00Z"),
        updatedAt: new Date("2024-06-06T00:00:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcde1"),
        createdByUserId: new ObjectId("672a1b2c3d4e5f6789abcdef"),
        profileId: new ObjectId("672a1b2c3d4e5f6789abcd20"),
        packageId: new ObjectId("672a1b2c3d4e5f6789abcd40"),
        slotId: new ObjectId("672a1b2c3d4e5f6789abcd75"), // Slot 16:00 Monday đã booked
        appointmentDate: new Date("2024-06-10T00:00:00Z"), // Monday
        appointmentTime: "16:00",
        appointmentType: "consultation",
        typeLocation: "clinic",
        address: "789 Trần Hưng Đạo, Quận 1, TP.HCM",
        description: "Khám sức khỏe phụ khoa định kỳ theo gói",
        notes: "Khách hàng mua gói chăm sóc sức khỏe phụ nữ cơ bản",
        status: "pending",
        createdAt: new Date("2024-06-07T00:00:00Z"),
        updatedAt: new Date("2024-06-07T00:00:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcde2"),
        createdByUserId: new ObjectId("672a1b2c3d4e5f6789abcd01"),
        profileId: new ObjectId("672a1b2c3d4e5f6789abcd22"),
        serviceId: new ObjectId("672a1b2c3d4e5f6789abcd31"),
        slotId: new ObjectId("672a1b2c3d4e5f6789abcd7d"), // Slot bác sĩ khác
        appointmentDate: new Date("2024-06-10T00:00:00Z"), // Monday
        appointmentTime: "09:00",
        appointmentType: "test",
        typeLocation: "clinic",
        address: "321 Pasteur, Quận 3, TP.HCM",
        description: "Xét nghiệm STI định kỳ",
        notes: "Khách hàng yêu cầu bảo mật thông tin",
        status: "completed",
        createdAt: new Date("2024-06-01T00:00:00Z"),
        updatedAt: new Date("2024-06-10T17:00:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcde3"),
        createdByUserId: new ObjectId("672a1b2c3d4e5f6789abcd01"),
        profileId: new ObjectId("672a1b2c3d4e5f6789abcd22"),
        serviceId: new ObjectId("672a1b2c3d4e5f6789abcd33"),
        slotId: new ObjectId("672a1b2c3d4e5f6789abcd80"), // Slot Thursday 08:00
        appointmentDate: new Date("2024-06-13T00:00:00Z"), // Thursday
        appointmentTime: "08:00",
        appointmentType: "consultation",
        typeLocation: "home",
        address: "456 Lê Văn Sỹ, Quận 3, TP.HCM",
        description: "Tư vấn kế hoạch hóa gia đình tại nhà",
        notes: "Khách hàng có con nhỏ, không thể ra ngoài",
        status: "cancelled",
        createdAt: new Date("2024-06-08T00:00:00Z"),
        updatedAt: new Date("2024-06-09T00:00:00Z")
      }
    ];

    await db.collection('appointments').insertMany(appointments);
    console.log('✅ Inserted appointments');

    // ====================================
    // 8. INSERT BILLS
    // ====================================
    const bills = [
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcde5"),
        userId: new ObjectId("672a1b2c3d4e5f6789abcdef"),
        profileId: new ObjectId("672a1b2c3d4e5f6789abcd20"),
        billNumber: "BILL-2024060001",
        appointmentId: new ObjectId("672a1b2c3d4e5f6789abcde0"),
        subtotal: 300000,
        discountAmount: 0,
        totalAmount: 300000,
        status: "paid",
        createdAt: new Date("2024-06-05T00:00:00Z"),
        updatedAt: new Date("2024-06-05T10:30:00Z")
      },
      {
        _id: new ObjectId("672a1b2c3d4e5f6789abcde6"),
        userId: new ObjectId("672a1b2c3d4e5f6789abcdef"),
        profileId: new ObjectId("672a1b2c3d4e5f6789abcd20"),
        billNumber: "BILL-2024060002",
        packageId: new ObjectId("672a1b2c3d4e5f6789abcd40"),
        appointmentId: new ObjectId("672a1b2c3d4e5f6789abcde1"),
        subtotal: 650000,
        discountAmount: 50000,
        totalAmount: 600000,
        status: "pending",
        createdAt: new Date("2024-06-07T00:00:00Z"),
        updatedAt: new Date("2024-06-07T00:00:00Z")
      }
    ];

    await db.collection('bills').insertMany(bills);
    console.log('✅ Inserted bills');

    // ====================================
    // SUMMARY
    // ====================================
    console.log('\n🎉 ĐÃ INSERT THÀNH CÔNG SAMPLE DATA!');
    console.log('📊 Data đã insert:');
    console.log('- 4 Users (2 customers, 2 doctors)');
    console.log('- 2 Doctor profiles');
    console.log('- 3 User profiles (including family)');  
    console.log('- 4 Services');
    console.log('- 2 Service packages');
    console.log('- 2 Doctor schedules với time slots');
    console.log('- 4 Sample appointments (các trạng thái khác nhau)');
    console.log('- 2 Bills');
    console.log('\n🚀 SẴN SÀNG TEST APPOINTMENT APIs!');
    
    // Hiển thị accounts để test
    console.log('\n👤 TEST ACCOUNTS:');
    console.log('📋 CUSTOMERS:');
    console.log('- Email: nguyenthimai@gmail.com | Pass: password123');
    console.log('- Email: tranthihuong@gmail.com | Pass: password123');
    console.log('👨‍⚕️ DOCTORS:');
    console.log('- Email: bs.lethihoa@gmail.com | Pass: password123');
    console.log('- Email: bs.nguyenvanan@gmail.com | Pass: password123');
    
  } catch (error) {
    console.error('❌ Lỗi khi insert data:', error);
  } finally {
    await client.close();
    console.log('🔒 Đã đóng kết nối MongoDB');
  }
}

// Chạy script
insertSampleData().catch(console.error); 