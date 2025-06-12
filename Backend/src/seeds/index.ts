import seedDoctorQA from './doctorQASeeds';
import seedDoctors from './doctorSeed';
import seedMedicines from './medicinesSeed';
import seedServices from './servicesSeed';
import seedStaff from './staffSeed';
import seedUserProfiles from './userProfilesSeed';

export const runAllSeeds = async () => {
  try {
    console.log('🌱 Bắt đầu chạy tất cả seed data...');

    // Chạy seeds theo thứ tự dependency
    // await seedServices();     // Services trước (independent)
    // await seedMedicines();    // Medicines trước (independent)
    // await seedUserProfiles(); // UserProfiles (cần tạo user + profiles cho medical records)
    // await seedDoctors();      // Doctors sau
    // await seedDoctorQA();     // DoctorQA cuối (cần doctor + user)

    console.log('✅ Hoàn thành việc chạy tất cả seed data!');
  } catch (error) {
    console.error('❌ Lỗi khi chạy seeds:', error);
  }
};

// Export individual seeds nếu cần
export { seedDoctorQA, seedDoctors, seedMedicines, seedServices, seedStaff, seedUserProfiles };

