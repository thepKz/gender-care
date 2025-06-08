import { runAllSeeds } from '../seeds';

// Chạy all seeds
runAllSeeds()
  .then(() => {
    console.log('✅ Tất cả seeds hoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi khi chạy seeds:', error);
    process.exit(1);
  }); 