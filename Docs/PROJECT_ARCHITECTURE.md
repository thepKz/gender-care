# GENDER HEALTHCARE - KIẾN TRÚC DỰ ÁN

## TỔNG QUAN DỰ ÁN

### Mô tả
Hệ thống Quản lý Dịch vụ Chăm sóc Sức khỏe Giới tính là một ứng dụng web full-stack được thiết kế để hỗ trợ cơ sở y tế trong việc quản lý và cung cấp các dịch vụ chăm sóc sức khỏe sinh sản một cách hiệu quả.

### Kiến trúc Tổng thể
- **Architecture Pattern**: 3-Tier Architecture (Client-Server-Database)
- **Communication**: RESTful API với JSON
- **Authentication**: JWT-based với role management
- **Database**: MongoDB (NoSQL Document Database)

---

## BACKEND ARCHITECTURE

### Cấu trúc Thư mục
```
Backend/src/
├── controllers/        # Request handlers và response logic
│   ├── authController.ts      # Xử lý authentication
│   ├── userController.ts      # Quản lý user operations
│   └── loginHistoryController.ts
├── models/            # MongoDB schemas với Mongoose
│   ├── User.ts               # User model
│   ├── AuthToken.ts          # Token management
│   ├── LoginHistory.ts       # Login tracking
│   └── OtpCode.ts           # OTP verification
├── routes/            # API endpoint definitions
├── services/          # Business logic layer
├── middleware/        # Custom middleware functions
├── types/            # TypeScript type definitions
├── utils/            # Helper functions và utilities
├── errors/           # Custom error handling
├── swagger.yaml      # API documentation
└── index.ts          # Application entry point
```

### Tech Stack
- **Runtime**: Node.js 18+ với TypeScript
- **Framework**: Express.js 4.x
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: 
  - JWT (jsonwebtoken)
  - bcryptjs cho password hashing
  - Google OAuth 2.0
- **File Storage**: Cloudinary cho image/file uploads
- **Email Service**: Nodemailer với Mailtrap
- **Payment**: PayOS integration
- **API Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest với SuperTest
- **Process Management**: 
  - node-cron cho scheduled tasks
  - express-rate-limit cho rate limiting

### Kiến trúc Patterns
1. **MVC (Model-View-Controller)**: Tách biệt logic xử lý
2. **Layered Architecture**: 
   - Controller Layer → Service Layer → Model Layer
3. **Repository Pattern**: Truy xuất dữ liệu thông qua models
4. **Middleware Pattern**: Authentication, validation, error handling

### API Design
- **RESTful API** với HTTP methods chuẩn
- **Endpoint Structure**: `/api/{resource}/{action}`
- **Response Format**: JSON với status codes chuẩn
- **Error Handling**: Centralized error middleware
- **Versioning**: URL versioning (v1, v2, etc.)

### Security Implementation
- **JWT Authentication** với refresh token
- **Password Encryption** bằng bcryptjs
- **CORS Configuration** cho multiple origins
- **Rate Limiting** để chống spam
- **Input Validation** và sanitization
- **MongoDB Injection Protection**

---

## FRONTEND ARCHITECTURE

### Cấu trúc Thư mục
```
Frontend/src/
├── components/        # Reusable React components
│   ├── common/           # Shared UI components
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Card/
│   ├── layouts/          # Layout components
│   │   ├── Header/
│   │   ├── Footer/
│   │   └── Sidebar/
│   ├── specific/         # Feature-specific components
│   │   ├── auth/
│   │   ├── blog/
│   │   ├── consultation/
│   │   └── menstrualCycle/
│   └── ui/              # UI kit components
├── pages/             # Page components (route destinations)
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard pages
│   ├── consultation/     # Consultation pages
│   ├── menstrualCycle/   # Cycle tracking pages
│   └── stiTesting/       # STI testing pages
├── redux/             # State management
│   ├── slices/           # Redux Toolkit slices
│   │   ├── authSlice.ts
│   │   └── blogSlice.ts
│   ├── store.ts          # Redux store configuration
│   └── hooks.ts          # Custom Redux hooks
├── api/               # API service layer
│   ├── axiosConfig.ts    # Axios configuration
│   └── endpoints/        # API endpoint definitions
├── hooks/             # Custom React hooks
├── routes/            # Routing configuration
├── types/             # TypeScript interfaces
├── utils/             # Helper functions
├── styles/            # Global styles và themes
└── assets/            # Static assets
```

### Tech Stack
- **Framework**: React 18 với TypeScript
- **Build Tool**: Vite (fast HMR, optimized builds)
- **State Management**: Redux Toolkit với Redux Persist
- **UI Framework**: Ant Design 5.x
- **Styling**: 
  - TailwindCSS (utility-first)
  - CSS Modules cho component-scoped styles
- **Routing**: React Router v6 với lazy loading
- **HTTP Client**: Axios với interceptors
- **Animation**: 
  - Framer Motion (declarative animations)
  - GSAP (complex animations)
- **Form Handling**: Ant Design Forms với validation
- **Date Handling**: Moment.js
- **Icons**: React Icons, Iconsax React
- **Map Integration**: React Leaflet

### Kiến trúc Patterns
1. **Component-Based Architecture**: Reusable, composable components
2. **Container/Presentational Pattern**: Separation of concerns
3. **Custom Hooks Pattern**: Logic reuse và separation
4. **Redux Pattern**: Predictable state management
5. **Higher-Order Components**: Cross-cutting concerns

### State Management Strategy
- **Redux Toolkit** cho global state
- **Local State** (useState) cho component-specific data
- **React Query/SWR** cho server state caching (future enhancement)
- **Context API** cho theme và configuration

### Performance Optimizations
- **Code Splitting** với React.lazy và Suspense
- **Bundle Optimization** với Vite's tree shaking
- **Image Optimization** với lazy loading
- **Memoization** với React.memo, useMemo, useCallback
- **Virtual Scrolling** cho large lists (future enhancement)

---

## DATABASE DESIGN

### MongoDB Schema Design
Sử dụng **Document-Based NoSQL** với embedded và referenced documents:

#### Core Collections:
1. **Users**: Thông tin người dùng và authentication
2. **Doctors**: Hồ sơ bác sĩ/tư vấn viên  
3. **Appointments**: Quản lý lịch hẹn
4. **Services**: Catalog dịch vụ y tế
5. **MenstrualCycles**: Dữ liệu chu kỳ sinh lý
6. **TestResults**: Kết quả xét nghiệm STI
7. **Feedbacks**: Đánh giá và phản hồi

#### Relationship Design:
- **One-to-One**: User ↔ Doctor, User ↔ StaffDetails
- **One-to-Many**: User → Appointments, Doctor → Appointments
- **Many-to-Many**: Services ↔ Appointments (through references)

### Data Access Patterns
- **Mongoose ODM** cho schema validation
- **Indexing Strategy** cho performance optimization
- **Aggregation Pipeline** cho complex queries
- **Population** cho referenced documents

---

## API INTEGRATION

### REST API Design
```
Base URL: /api/v1

Authentication:
POST /api/auth/login
POST /api/auth/register  
POST /api/auth/refresh
POST /api/auth/logout

User Management:
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/login-history

Consultation:
GET    /api/consultations
POST   /api/consultations
PUT    /api/consultations/:id
DELETE /api/consultations/:id

STI Testing:
GET    /api/sti-tests
POST   /api/sti-tests
GET    /api/sti-tests/:id/results
```

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

---

## SECURITY ARCHITECTURE

### Authentication Flow
1. **User Login** → JWT Token Generation
2. **Token Storage** → HttpOnly Cookies + localStorage backup
3. **API Requests** → Bearer Token in Authorization header
4. **Token Refresh** → Automatic refresh via interceptors
5. **Logout** → Token invalidation

### Authorization Strategy
- **Role-Based Access Control (RBAC)**
- **Roles**: admin, manager, staff, consultant, customer, guest
- **Permissions**: Granular permissions per role
- **Route Protection**: Frontend route guards + Backend middleware

### Data Protection
- **Password Hashing**: bcryptjs với salt rounds
- **Input Sanitization**: mongoose validation + custom validators
- **CORS Policy**: Restricted origins cho production
- **Rate Limiting**: Express rate limiter
- **File Upload Security**: Multer với file type validation

---

## DEPLOYMENT ARCHITECTURE

### Development Environment
```
Frontend: Vite Dev Server (localhost:5173)
Backend: Nodemon + ts-node (localhost:5000)
Database: MongoDB Local/Atlas
```

### Production Architecture
```
Frontend: Static hosting (Vercel/Netlify)
Backend: Node.js server (Render/Railway)
Database: MongoDB Atlas
CDN: Cloudinary cho static assets
```

### CI/CD Pipeline
- **Version Control**: Git với GitHub
- **Automated Testing**: Jest cho backend, React Testing Library cho frontend
- **Build Process**: TypeScript compilation + Vite build
- **Deployment**: Automated deployment via GitHub Actions

---

## MONITORING & MAINTENANCE

### Logging Strategy
- **Application Logs**: Winston logger
- **Error Tracking**: Custom error middleware
- **Performance Monitoring**: Response time tracking
- **User Activity**: Login history tracking

### Backup & Recovery
- **Database Backup**: MongoDB Atlas automated backups
- **File Backup**: Cloudinary redundancy
- **Code Versioning**: Git history preservation

---

## FUTURE ENHANCEMENTS

### Technical Improvements
1. **Microservices Architecture**: Service decomposition
2. **GraphQL API**: Flexible data fetching
3. **Real-time Features**: WebSocket/Server-Sent Events
4. **Caching Layer**: Redis implementation
5. **Advanced Analytics**: Data visualization dashboard

### Performance Optimizations
1. **Database Optimization**: Query optimization, indexing
2. **Frontend Performance**: Bundle splitting, lazy loading
3. **CDN Integration**: Global content delivery
4. **Server-Side Rendering**: Next.js migration consideration

---

## DEVELOPMENT GUIDELINES

### Code Standards
- **TypeScript Strict Mode**: Type safety enforcement
- **ESLint + Prettier**: Code formatting consistency
- **Naming Conventions**: camelCase, PascalCase theo context
- **Component Structure**: Functional components với hooks
- **Error Handling**: Try-catch blocks với meaningful messages

### Testing Strategy
- **Unit Tests**: Jest cho business logic
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Cypress cho user workflows (future)
- **Test Coverage**: Minimum 80% coverage target

### Git Workflow
- **Branch Strategy**: Feature branches + main branch
- **Commit Messages**: Conventional commits format
- **Code Review**: Pull request reviews
- **Release Management**: Semantic versioning

---

*Tài liệu này được cập nhật theo tiến độ phát triển dự án* 