# 🏥 Gender Healthcare - Hệ thống Quản lý Dịch vụ Chăm sóc Sức khỏe Giới tính

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Hệ thống quản lý dịch vụ chăm sóc sức khỏe giới tính toàn diện, bảo mật và hiện đại

[🚀 Demo Live](https://gender-healthcare.vercel.app) | [📖 Documentation](./Docs) | [🐛 Bug Report](https://github.com/issues) | [💡 Feature Request](https://github.com/issues)

</div>

---

## 📋 Mục lục

- [🎯 Giới thiệu](#-giới-thiệu)
- [✨ Tính năng chính](#-tính-năng-chính)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Kiến trúc hệ thống](#️-kiến-trúc-hệ-thống)
- [👥 Phân quyền người dùng](#-phân-quyền-người-dùng)
- [⚡ Quick Start](#-quick-start)
- [📁 Cấu trúc dự án](#-cấu-trúc-dự-án)
- [🔐 Bảo mật](#-bảo-mật)
- [📊 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)

---

## 🎯 Giới thiệu

**Gender Healthcare Service Management** là một hệ thống quản lý dịch vụ chăm sóc sức khỏe giới tính tiên tiến, được thiết kế để hỗ trợ các cơ sở y tế trong việc cung cấp dịch vụ chăm sóc sức khỏe sinh sản một cách hiệu quả, bảo mật và thuận tiện.

### 🎯 Mục tiêu
- **Số hóa quy trình**: Chuyển đổi số các quy trình y tế truyền thống
- **Nâng cao trải nghiệm**: Cung cấp dịch vụ tiện lợi và dễ tiếp cận
- **Tối ưu hóa vận hành**: Giảm thiểu thời gian và chi phí vận hành
- **Bảo đảm bảo mật**: Bảo vệ thông tin nhạy cảm theo chuẩn y tế

---

## ✨ Tính năng chính

### 🏥 **Quản lý Cơ sở Y tế**
- 📊 Dashboard tổng quan cho ban quản lý
- 📝 Quản lý blog giáo dục giới tính
- 💼 Catalog dịch vụ và bảng giá chi tiết
- 📈 Báo cáo và thống kê chi tiết

### 👤 **Quản lý Người dùng**
- 🔐 Đăng ký/đăng nhập với xác thực OTP
- 👥 Phân quyền chi tiết theo vai trò
- 📋 Quản lý hồ sơ cá nhân toàn diện
- 🔒 Bảo vệ quyền riêng tư tối đa

### 📅 **Đặt lịch Tư vấn**
- 🗓️ Đặt lịch tư vấn trực tuyến với chuyên gia
- ⏰ Quản lý lịch làm việc linh hoạt
- 🔔 Hệ thống thông báo và nhắc nhở thông minh
- ⭐ Đánh giá và phản hồi sau tư vấn

### 🔬 **Xét nghiệm STI**
- 🧪 Đặt lịch xét nghiệm các bệnh lây truyền qua đường tình dục
- 📋 Quản lý quy trình từ đặt lịch đến trả kết quả
- 📱 Xem kết quả xét nghiệm trực tuyến an toàn
- 🏥 Tư vấn theo dõi sau xét nghiệm

### 📊 **Theo dõi Chu kỳ Sinh lý**
- 📅 Ghi lại chu kỳ kinh nguyệt chi tiết
- 🎯 Dự đoán ngày rụng trứng chính xác
- 💊 Nhắc nhở uống thuốc tránh thai
- 📈 Phân tích xu hướng sức khỏe sinh sản

### 💰 **Thanh toán & Billing**
- 💳 Tích hợp cổng thanh toán PayOS
- 🧾 Quản lý hóa đơn và lịch sử thanh toán
- 🎁 Hệ thống gói dịch vụ và khuyến mãi
- 📊 Báo cáo tài chính chi tiết

---

## 🛠️ Tech Stack

### **Backend Architecture**
```typescript
Framework      : Express.js + TypeScript
Runtime        : Node.js 18+
Database       : MongoDB + Mongoose ODM
Authentication : JWT + bcryptjs + Google OAuth
File Storage   : Cloudinary
Email Service  : Nodemailer + Mailtrap
Payment        : PayOS Gateway
Documentation  : Swagger/OpenAPI 3.0
Testing        : Jest + SuperTest
Process Mgmt   : node-cron + express-rate-limit
```

### **Frontend Architecture**
```typescript
Framework      : React 18 + TypeScript
Build Tool     : Vite (HMR + Optimization)
State Mgmt     : Redux Toolkit + Redux Persist
UI Framework   : Ant Design 5.x + TailwindCSS
Routing        : React Router v6 + Lazy Loading
HTTP Client    : Axios + Interceptors
Animation      : Framer Motion + GSAP
Form Handling  : Ant Design Forms + Validation
Date Utils     : Moment.js
Icons          : React Icons + Iconsax React
Maps           : React Leaflet
```

### **DevOps & Tools**
```bash
Containerization : Docker + Docker Compose
CI/CD           : GitHub Actions
Monitoring      : Winston Logger + Error Tracking
Code Quality    : ESLint + Prettier + TypeScript
Version Control : Git + Conventional Commits
API Testing     : Postman + REST Client
Performance     : Lighthouse + Web Vitals
```

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│                 │    │                 │    │                 │
│ React + TS      │◄──►│ Express + TS    │◄──►│ MongoDB Atlas   │
│ Redux Toolkit   │    │ JWT Auth        │    │ Collections:    │
│ Ant Design      │    │ REST API        │    │ - Users         │
│ TailwindCSS     │    │ Swagger Docs    │    │ - Appointments  │
│ Vite Build      │    │ Rate Limiting   │    │ - TestResults   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Static Hosting  │    │ Node.js Server  │    │ Cloud Storage   │
│ Vercel/Netlify  │    │ Render/Railway  │    │ Cloudinary CDN  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Architectural Patterns**
- **3-Tier Architecture**: Client → Server → Database
- **MVC Pattern**: Model-View-Controller separation
- **Layered Architecture**: Controller → Service → Model
- **Component-Based**: Reusable React components
- **RESTful API**: Standard HTTP methods và status codes

---

## 👥 Phân quyền người dùng

| Vai trò | Mô tả | Quyền hạn chính |
|---------|-------|-----------------|
| 👑 **Administrator** | Quản trị viên hệ thống | Quản lý toàn bộ hệ thống, phân quyền, bảo mật |
| 🏢 **Manager** | Quản lý cơ sở y tế | Giám sát hoạt động, báo cáo, quản lý nhân sự |
| 👩‍💼 **Staff** | Nhân viên y tế | Vận hành hệ thống, quản lý lịch hẹn, xét nghiệm |
| 👩‍⚕️ **Consultant** | Tư vấn viên chuyên khoa | Tư vấn sức khỏe, quản lý lịch làm việc |
| 👤 **Customer** | Người dùng đã đăng ký | Sử dụng đầy đủ các dịch vụ của hệ thống |
| 👻 **Guest** | Khách truy cập | Xem thông tin công khai, đăng ký tài khoản |

---

## ⚡ Quick Start

### **Prerequisites**
```bash
Node.js >= 18.x
npm >= 8.x
MongoDB >= 6.x
Git >= 2.x
```

### **1. Clone Repository**
```bash
git clone https://github.com/your-org/gender-healthcare.git
cd gender-healthcare
```

### **2. Backend Setup**
```bash
cd Backend
npm install

# Tạo và cấu hình .env
cp .env.example .env
# Cập nhật các biến môi trường trong .env

# Khởi chạy development server
npm run dev
```

### **3. Frontend Setup**
```bash
cd Frontend
npm install

# Tạo file environment (nếu cần)
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env.local

# Khởi chạy development server
npm run dev
```

### **4. Access Application**
```bash
Frontend: http://localhost:5173
Backend:  http://localhost:5000
API Docs: http://localhost:5000/api-docs
```

### **Environment Variables**

#### Backend (.env)
```bash
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/gender_healthcare
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
MAILTRAP_TOKEN=your-mailtrap-token
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key
```

#### Frontend (.env.local)
```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_ENVIRONMENT=development
```

---

## 📁 Cấu trúc dự án

```
Gender_Healthcare/
│
├── 📂 Backend/
│   ├── 📂 src/
│   │   ├── 📂 controllers/     # Request handlers
│   │   ├── 📂 models/          # MongoDB schemas
│   │   ├── 📂 routes/          # API endpoints
│   │   ├── 📂 services/        # Business logic
│   │   ├── 📂 middleware/      # Custom middleware
│   │   ├── 📂 types/           # TypeScript types
│   │   ├── 📂 utils/           # Utility functions
│   │   ├── 📂 errors/          # Error handlers
│   │   ├── 📄 swagger.yaml     # API documentation
│   │   └── 📄 index.ts         # Entry point
│   ├── 📂 tests/               # Test files
│   ├── 📄 package.json
│   └── 📄 tsconfig.json
│
├── 📂 Frontend/
│   ├── 📂 public/              # Static assets
│   ├── 📂 src/
│   │   ├── 📂 components/      # Reusable components
│   │   │   ├── 📂 common/      # Shared components
│   │   │   ├── 📂 layouts/     # Layout components
│   │   │   ├── 📂 specific/    # Feature components
│   │   │   └── 📂 ui/          # UI kit components
│   │   ├── 📂 pages/           # Page components
│   │   ├── 📂 redux/           # State management
│   │   ├── 📂 api/             # API services
│   │   ├── 📂 hooks/           # Custom hooks
│   │   ├── 📂 routes/          # Routing config
│   │   ├── 📂 types/           # TypeScript types
│   │   ├── 📂 utils/           # Utility functions
│   │   ├── 📂 styles/          # Global styles
│   │   └── 📂 assets/          # Images, fonts, etc.
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   └── 📄 vite.config.ts
│
├── 📂 Docs/                    # Documentation
│   ├── 📄 PROJECT_OVERVIEW.md  # Project overview
│   ├── 📄 PROJECT_ARCHITECTURE.md # Architecture docs
│   ├── 📄 ERD.txt              # Database design
│   ├── 📄 CODING_CONVENTION.md # Coding standards
│   └── 📄 CONTEXT/             # Project context
│
├── 📂 .github/
│   └── 📂 workflows/           # CI/CD workflows
│
├── 📄 README.md
├── 📄 .gitignore
└── 📄 docker-compose.yml
```

---

## 🔐 Bảo mật

### **Authentication & Authorization**
- 🔑 **JWT Authentication** với access + refresh tokens
- 🔐 **Password Hashing** sử dụng bcryptjs với salt rounds
- 🌐 **Google OAuth 2.0** integration
- 📱 **OTP Verification** cho email và phone
- 🚪 **Role-based Access Control (RBAC)**

### **Data Protection**
- 🛡️ **Input Validation** và sanitization
- 🔒 **HTTPS Enforcement** cho production
- 🚫 **CORS Policy** restricted origins
- ⚡ **Rate Limiting** chống spam và brute force
- 🗄️ **MongoDB Injection Protection**

### **Privacy & Compliance**
- 🏥 **HIPAA Compliant** data handling
- 🔐 **Encryption at Rest** cho sensitive data
- 🚀 **Secure File Upload** với validation
- 📝 **Audit Logging** cho security events
- 🔄 **Regular Security Updates**

---

## 📊 API Documentation

### **Swagger/OpenAPI**
- **Local**: http://localhost:5000/api-docs
- **Production**: https://api.yourdomain.com/api-docs

### **Main Endpoints**

#### Authentication
```http
POST /api/auth/register     # User registration
POST /api/auth/login        # User login  
POST /api/auth/refresh      # Token refresh
POST /api/auth/logout       # User logout
POST /api/auth/verify-otp   # OTP verification
```

#### User Management
```http
GET    /api/users/profile   # Get user profile
PUT    /api/users/profile   # Update profile
GET    /api/users/history   # Get login history
DELETE /api/users/account   # Delete account
```

#### Appointments
```http
GET    /api/appointments         # List appointments
POST   /api/appointments         # Create appointment
GET    /api/appointments/:id     # Get appointment details
PUT    /api/appointments/:id     # Update appointment
DELETE /api/appointments/:id     # Cancel appointment
```

#### STI Testing
```http
GET    /api/sti-tests           # List available tests
POST   /api/sti-tests           # Book test
GET    /api/sti-tests/:id       # Get test details
GET    /api/sti-tests/:id/results # Get test results
```

### **Response Format**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 🧪 Testing

### **Backend Testing**
```bash
cd Backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run test:auth         # Authentication tests
```

### **Frontend Testing**
```bash
cd Frontend

# Run component tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### **Test Coverage Targets**
- **Backend**: 80%+ line coverage
- **Frontend**: 70%+ component coverage
- **Integration**: 90%+ API endpoint coverage
- **E2E**: Key user flows (planned)

---

## 🚀 Deployment

### **Development Environment**
```bash
# Docker Compose setup
docker-compose up -d

# Manual setup
npm run dev:backend   # Terminal 1
npm run dev:frontend  # Terminal 2
```

### **Production Deployment**

#### **Frontend (Vercel/Netlify)**
```bash
npm run build
# Deploy dist/ folder to static hosting
```

#### **Backend (Render/Railway)**
```bash
npm run build
npm start
# Configure environment variables
```

#### **Database (MongoDB Atlas)**
- Set up MongoDB Atlas cluster
- Configure connection string
- Set up backup policies

### **Environment URLs**
- **Development**: http://localhost:5173
- **Staging**: https://staging.yourdomain.com
- **Production**: https://yourdomain.com

---

## 🤝 Contributing

### **Development Workflow**
1. **Fork** repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Create** Pull Request

### **Commit Convention**
```bash
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
style(scope): formatting changes
refactor(scope): code refactoring
test(scope): add tests
chore(scope): maintenance tasks
```

### **Code Quality**
- **ESLint + Prettier** for formatting
- **TypeScript** strict mode
- **Conventional Commits** format
- **Pull Request** reviews required
- **Unit tests** for new features

### **Development Guidelines**
- Follow [TypeScript best practices](./Docs/DEVELOPMENT_GUIDE.md)
- Write comprehensive tests
- Document API changes
- Update README for new features
- Follow [Coding Conventions](./Docs/CODING_CONVENTION.md)

---

## 📞 Support & Contact

### **Documentation**
- 📖 [Project Architecture](./Docs/PROJECT_ARCHITECTURE.md)
- 🛠️ [Development Guide](./Docs/DEVELOPMENT_GUIDE.md)
- 🗄️ [Database Design](./Docs/ERD.txt)
- 📝 [Coding Conventions](./Docs/CODING_CONVENTION.md)

### **Support Channels**
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/discussions)
- 📧 **Email**: support@genderhealthcare.com
- 💬 **Community**: [Discord Server](https://discord.gg/genderhealthcare)

### **Development Team**
- **Backend Team**: Node.js/TypeScript specialists
- **Frontend Team**: React/TypeScript experts  
- **DevOps Team**: Cloud infrastructure specialists
- **QA Team**: Testing and quality assurance

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Ant Design** for the comprehensive UI components
- **React Team** for the amazing framework
- **MongoDB** for the flexible database solution
- **Vercel** for the excellent hosting platform
- **All contributors** who helped make this project possible

---

<div align="center">

**⭐ If you find this project helpful, please give it a star! ⭐**

Made with ❤️ by [Gender Healthcare Development Team](https://github.com/gender-healthcare-team)

*Last updated: December 2024*

</div> 