// Tạo file script để kiểm tra biến môi trường
require('dotenv').config();
if (!process.env.SECRET_KEY) {
  console.error('CRITICAL ERROR: SECRET_KEY is missing from environment variables!');
  console.log('Please ensure your .env file contains SECRET_KEY=your_secret_key');
} 