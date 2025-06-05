import seedDoctors from './doctorSeed';
import seedDoctorQA from './doctorQASeeds';
import seedStaff from './staffSeed';

export const runAllSeeds = async () => {
    console.log('🌱 Bắt đầu seed dữ liệu...');

    // Chạy các hàm seed theo thứ tự
    await seedStaff();
    await seedDoctors();
    await seedDoctorQA();

    console.log('✅ Hoàn thành seed dữ liệu!');
};

export { seedStaff, seedDoctors, seedDoctorQA }; 