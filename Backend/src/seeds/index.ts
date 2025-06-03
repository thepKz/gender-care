import seedDoctors from './doctorSeed';
import { seedDoctorQA } from './doctorQASeeds';

// Main function để chạy tất cả seeds
export const runAllSeeds = async () => {
  try {
    console.log('🌱 Bắt đầu chạy tất cả seed data...');
    
    // Chạy seeds theo thứ tự dependency
    await seedDoctors();    // Doctors trước
    await seedDoctorQA();   // DoctorQA sau (cần doctor + user)
    
    console.log('✅ Hoàn thành việc chạy tất cả seed data!');
  } catch (error) {
    console.error('❌ Lỗi khi chạy seeds:', error);
  }
};

// Export individual seeds nếu cần
export { seedDoctors, seedDoctorQA }; 