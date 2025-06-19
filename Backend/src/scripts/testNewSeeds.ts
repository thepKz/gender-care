import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { seedDoctorSchedules } from '../seeds/doctorScheduleSeeds';
import { seedServicePackages } from '../seeds/servicePackageSeeds';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/genderhealthcare';
    await mongoose.connect(mongoURI);
    console.log('✅ Kết nối MongoDB thành công');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    process.exit(1);
  }
};

const testNewSeeds = async () => {
  try {
    console.log('🧪 Bắt đầu test seeds mới...\n');

    // Test Doctor Schedules Seed
    console.log('═══════════════════════════════════════');
    console.log('🔬 TESTING DOCTOR SCHEDULES SEED');
    console.log('═══════════════════════════════════════');
    await seedDoctorSchedules();

    console.log('\n═══════════════════════════════════════');
    console.log('📦 TESTING SERVICE PACKAGES SEED');
    console.log('═══════════════════════════════════════');
    await seedServicePackages();

    console.log('\n🎉 Hoàn thành test tất cả seeds mới!');
    console.log('💡 Lưu ý: Seeds sẽ tự động kiểm tra và bỏ qua nếu data đã tồn tại');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await testNewSeeds();
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Lỗi chạy script:', error);
    process.exit(1);
  });
}

export { testNewSeeds }; 