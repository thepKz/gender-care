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
  userRoutes
} from "./routes";

const app = express();
const port = process.env.PORT || 8000;

// Load swagger document
const swaggerPath = path.resolve(__dirname, "swagger.yaml");
const swaggerDocument = YAML.load(swaggerPath);



// Cho phép tất cả các origin
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());

app.get("/", (_req, res) => {
  console.log("Log message on backend");
  res.send("Welcome to the Gender Healthcare API");
});

// Cấu hình API prefix và Swagger docs
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Cấu hình Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Gender Healthcare API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    basePath: '/api'
  }
}));

apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", userRoutes);


// Export the app for testing purposes
export { app };

// Only start the server if this file is run directly (not imported as a module)
if (require.main === module) {
  console.log('Connecting to MongoDB...');
  console.log('MongoDB URI:', process.env.MONGO_URI?.split('@')[1]); // Log URI an toàn (không hiện credentials)

  mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => {
      console.log("Connected to MongoDB successfully");
      app.listen(port, () => {
        console.log(`Server started at ${new Date().toISOString()}`);
        console.log(`Server is running on port ${port}`);
        console.log(`API Documentation available at ${process.env.API_URL || `https://gender-healthcare-service-management.onrender.com`}/api-docs/`);
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
