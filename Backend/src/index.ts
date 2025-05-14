import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
// @ts-ignore
dotenv.config();

// Routes
import {
  authRoutes,
  cartRoutes,
  categoryRoutes,
  messageRoutes,
  notificationRoutes,
  orderRoutes,
  paymentRoutes,
  productRoutes,
  promotionRoutes,
  reviewRoutes,
  userRoutes,
  wishlistRoutes
} from "./routes";

const app = express();

// Load swagger document
const swaggerPath = path.resolve(__dirname, "swagger.yaml");
const swaggerDocument = YAML.load(swaggerPath);

// Update swagger server URL from env
swaggerDocument.servers[0].url = process.env.API_URL || "http://localhost:5000";

const allowedOrigins = [
  "http://localhost:3000", // Frontend development server
  "http://127.0.0.1:3000",
  process.env.STAGING_URL,
  process.env.API_URL,
  process.env.CLIENT_URL,
  process.env.PRODUCTION_URL,
  process.env.BACKEND_URL,
].filter(Boolean); // Remove undefined values

console.log("Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Cho phép truy cập không có origin (như từ Postman hoặc các công cụ API)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        console.log(`Origin ${origin} not allowed by CORS`);
        var msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      console.log(`Origin ${origin} allowed by CORS`);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  console.log("Log message on backend");
  res.send("Welcome to the GreenWeave API");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "GreenWeave API Documentation"
}));

// Cấu hình routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/wishlists", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);

// Export the app for testing purposes
export { app };

// Only start the server if this file is run directly (not imported as a module)
if (require.main === module) {
  const port = process.env.PORT || 5000;

  console.log('Connecting to MongoDB...');
  console.log('MongoDB URI:', process.env.MONGO_URI?.split('@')[1]); // Log URI an toàn (không hiện credentials)

  mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => {
      console.log("Connected to MongoDB successfully");
      app.listen(port, () => {
        console.log(`Server started at ${new Date().toISOString()}`);
        console.log(`Server is running on port ${port}`);
        console.log(`API Documentation available at ${process.env.API_URL || `http://localhost:${port}`}/api-docs`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection error details:");
      console.error("Name:", error.name);
      console.error("Message:", error.message);
      console.error("Code:", error.code);
      if (error.name === 'MongoServerError') {
        console.error("Please check your MongoDB credentials and database name");
      }
      process.exit(1); // Thoát process nếu không kết nối được database
    });
}
