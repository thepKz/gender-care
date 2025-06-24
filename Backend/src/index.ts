import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from 'dotenv';
import express from "express";
import mongoose from "mongoose";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import {
  appointmentRoutes,
  appointmentTestsRoutes,
  authRoutes,
  dashboardRoutes,
  doctorQARoutes,
  doctorRoutes,
  loginHistoryRoutes,
  medicalRecordsRoutes,
  medicationRemindersRoutes,
  medicinesRoutes,
  meetingRoutes,
  notificationDaysRoutes,
  packagePurchaseRoutes,
  paymentRoutes,
  servicePackageRoutes,
  serviceRoutes,
  serviceTestCategoriesRoutes,
  systemLogRoutes,
  testCategoriesRoutes,
  testResultItemsRoutes,
  testResultsRoutes,
  userProfileRoutes,
  userRoutes
} from "./routes";

import { runAllSeeds } from "./seeds";

// Load biến môi trường từ file .env (phải đặt ở đầu file)
// Try multiple paths for .env file
const envPaths = [
  path.join(__dirname, '../.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'Backend/.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`✅ .env loaded from: ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (error) {
    // Try next path
  }
}

if (!envLoaded) {
  console.log('⚠️ No .env file found, trying default dotenv.config()');
  dotenv.config();
}

// Debug: Check if .env is loaded
console.log('🔍 Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('PAYOS_CLIENT_ID exists:', !!process.env.PAYOS_CLIENT_ID);
console.log('PAYOS_API_KEY exists:', !!process.env.PAYOS_API_KEY);
console.log('PAYOS_CHECKSUM_KEY exists:', !!process.env.PAYOS_CHECKSUM_KEY);

// Khởi tạo app express
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy để lấy real IP từ reverse proxy/load balancer
app.set('trust proxy', true); // Cho phép lấy IP từ X-Forwarded-For header

// Middleware để extract real IP address
app.use((req, res, next) => {
  // Lấy real IP từ các headers phổ biến
  req.realIP = req.ip || 
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.headers['x-real-ip']?.toString() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown';

  // Convert IPv6 localhost về IPv4 cho development
  if (req.realIP === '::1' || req.realIP === '::ffff:127.0.0.1') {
    req.realIP = '127.0.0.1';
  }

  // Chỉ log IP cho authentication endpoints để tránh spam
  if (req.path.includes('/auth/') || req.path.includes('/login')) {
  console.log(`🌐 Real IP detected: ${req.realIP} (Original: ${req.ip})`);
  }
  next();
});

// Cấu hình CORS cho nhiều origin
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
  'https://gender-healthcare.vercel.app',
  'https://gender-healthcare-service-management.onrender.com',
  'http://localhost:5000',
  'https://team05.ksfu.cloud',

];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Thêm cookie-parser để đọc cookie

// Cấu hình CORS với Cross-Origin-Opener-Policy
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Quan trọng: cho phép gửi cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Để support legacy browsers
}));

// Thêm headers để fix COOP policy cho Google OAuth
app.use((req, res, next) => {
  // Set Cross-Origin-Opener-Policy để support Google OAuth
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');

  // Additional security headers
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

// Phục vụ tài liệu Swagger
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('Swagger documentation loaded successfully');
} catch (error) {
  console.error('Error loading swagger.yaml:', error);
  // Tạm thời skip swagger để server có thể chạy
  console.log('Skipping Swagger documentation due to YAML error');
}

// Kết nối đến cơ sở dữ liệu MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB đã kết nối: ${conn.connection.host}`);

    // Chạy seed data sau khi kết nối DB thành công - Disable để tránh memory issues
    if (process.env.NODE_ENV === 'development' && process.env.RUN_SEEDS === 'true') {
      await runAllSeeds();
    }

  } catch (error) {
    console.error(`Lỗi: ${error}`);
    process.exit(1);
  }
};

connectDB();

// Thiết lập routes
const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/login-history', loginHistoryRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/doctors', doctorRoutes);
apiRouter.use('/services', serviceRoutes);
apiRouter.use('/service-packages', servicePackageRoutes);
apiRouter.use('/service-test-categories', serviceTestCategoriesRoutes);
apiRouter.use('/package-purchases', packagePurchaseRoutes);

// Thêm Test Management routes
apiRouter.use('/test-categories', testCategoriesRoutes);
apiRouter.use('/appointment-tests', appointmentTestsRoutes);
apiRouter.use('/test-results', testResultsRoutes);
apiRouter.use('/test-result-items', testResultItemsRoutes);

// Thêm DoctorQA & Meeting routes
apiRouter.use('/', doctorQARoutes);
apiRouter.use('/', meetingRoutes);
apiRouter.use('/medical-records', medicalRecordsRoutes);
apiRouter.use('/medicines', medicinesRoutes);
apiRouter.use('/medication-reminders', medicationRemindersRoutes);
apiRouter.use('/notification-days', notificationDaysRoutes);
apiRouter.use('/user-profiles', userProfileRoutes);
apiRouter.use('/appointments', appointmentRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/system-logs', systemLogRoutes);

// Middleware xử lý lỗi
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Đã xảy ra lỗi server!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Khởi động server (trừ khi đang chạy test)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
  });
}

export default app;
