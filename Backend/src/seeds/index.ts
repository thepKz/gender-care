import { seedDoctors } from './doctorSeed';

export const runAllSeeds = async () => {
  try {
    console.log('Bắt đầu chạy seed data...');
    
    // Chạy seed doctors
    await seedDoctors();
    
    console.log('Hoàn thành seed data!');
  } catch (error) {
    console.error('Lỗi khi chạy seed data:', error);
  }
}; 