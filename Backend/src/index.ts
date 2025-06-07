import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from 'dotenv';
import express from "express";
import mongoose from "mongoose";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { authRoutes, loginHistoryRoutes, userRoutes, doctorRoutes, serviceRoutes, servicePackageRoutes, doctorQARoutes, userProfileRoutes, appointmentRoutes } from "./routes";
import { medicalRecordsRoutes, medicinesRoutes, medicationRemindersRoutes, notificationDaysRoutes } from "./routes";
import { runAllSeeds } from "./seeds";

// Load biến môi trường từ file .env (phải đặt ở đầu file)
dotenv.config();

// Khởi tạo app express
const app = express();
const PORT = process.env.PORT || 5000;

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
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Kết nối đến cơ sở dữ liệu MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB đã kết nối: ${conn.connection.host}`);

    // Chạy seed data sau khi kết nối DB thành công
    if (process.env.NODE_ENV !== 'production') {
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
apiRouter.use('/doctors', doctorRoutes);
apiRouter.use('/services', serviceRoutes);
apiRouter.use('/service-packages', servicePackageRoutes);
apiRouter.use('/', doctorQARoutes);
apiRouter.use('/user-profiles', userProfileRoutes);
apiRouter.use('/appointments', appointmentRoutes);

// Middleware xử lý lỗi
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Đã xảy ra lỗi server!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

export default app;
