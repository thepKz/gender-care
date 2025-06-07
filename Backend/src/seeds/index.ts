import seedDoctors from './doctorSeed';
import seedMedicines from './medicinesSeed';
import seedUserProfiles from './userProfilesSeed';
import seedDoctorQA from './doctorQASeeds';
import seedStaff from './staffSeed';

export const runAllSeeds = async () => {
  try {
<<<<<<< HEAD
    console.log('Bắt đầu chạy seed data...');
=======
    console.log('🌱 Bắt đầu chạy tất cả seed data...');
>>>>>>> origin/fetch/medical-function
    
    // Chạy seeds theo thứ tự dependency
    await seedMedicines();    // Medicines trước (independent)
    await seedUserProfiles(); // UserProfiles (cần tạo user + profiles cho medical records)
    await seedDoctors();      // Doctors sau
    await seedDoctorQA();     // DoctorQA cuối (cần doctor + user)
    
<<<<<<< HEAD
    console.log('Hoàn thành seed data!');
  } catch (error) {
    console.error('Lỗi khi chạy seed data:', error);
=======
    console.log('✅ Hoàn thành việc chạy tất cả seed data!');
  } catch (error) {
    console.error('❌ Lỗi khi chạy seeds:', error);
>>>>>>> origin/fetch/medical-function
  }
};

// Export individual seeds nếu cần
export { seedStaff, seedDoctors, seedDoctorQA, seedMedicines, seedUserProfiles }; 
