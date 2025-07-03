# API Documentation - Gender Healthcare Service Management System

## 📋 Tổng quan
Hệ thống Gender Healthcare Service Management cung cấp API RESTful toàn diện cho quản lý dịch vụ chăm sóc sức khỏe giới tính.

**Base URL**: `http://localhost:5000/api`  
**Version**: v1.0  
**Content-Type**: `application/json`

---

## 🔐 Phân quyền (Role Hierarchy)

### Cấu trúc phân quyền
```
admin (level 100)     → Tất cả quyền hệ thống
  ↓
manager (level 80)    → Quyền staff + quản lý cấp cao
  ↓  
staff (level 60)      → Quyền cơ bản nhân viên y tế
doctor (level 60)     → Quyền bác sĩ/tư vấn viên (song song staff)
  ↓
customer (level 20)   → Quyền người dùng đã đăng ký
  ↓
guest (level 0)       → Khách truy cập (chưa đăng ký)
```

### Ký hiệu phân quyền
- 🔓 **Public**: Không cần authentication
- 🔐 **Auth**: Cần authentication
- 👤 **Customer+**: Customer trở lên  
- 👨‍⚕️ **Doctor+**: Doctor trở lên
- 👩‍💼 **Staff+**: Staff, Manager, Admin
- 👨‍💼 **Manager+**: Manager, Admin
- 🔒 **Admin Only**: Chỉ Admin

---

## 1. 🔑 Authentication & Authorization

### `/api/auth` - Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | 🔓 | Đăng ký người dùng mới |
| `POST` | `/verify-email` | 🔓 | Xác thực email sau đăng ký |
| `POST` | `/verify-otp` | 🔓 | Xác thực OTP |
| `POST` | `/new-verify` | 🔓 | Gửi lại email xác thực |
| `POST` | `/login` | 🔓 | Đăng nhập thường |
| `POST` | `/login-google` | 🔓 | Đăng nhập Google OAuth |
| `POST` | `/login-admin` | 🔓 | Đăng nhập admin/manager |
| `POST` | `/check-email` | 🔓 | Kiểm tra email có tồn tại |
| `POST` | `/check-phone` | 🔓 | Kiểm tra số điện thoại |
| `POST` | `/logout` | 🔐 | Đăng xuất |
| `POST` | `/refresh-token` | 🔐 | Làm mới access token |
| `POST` | `/forgot-password` | 🔓 | Quên mật khẩu |
| `POST` | `/reset-password` | 🔓 | Đặt lại mật khẩu |

### 🔍 Sample Request/Response

```javascript
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "message": "Đăng nhập thành công",
  "user": {
    "id": "userId",
    "email": "user@example.com",
    "role": "customer",
    "fullName": "Nguyễn Văn A"
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

---

## 2. 👥 User Management

### `/api/users` - User Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/profile/me` | 🔐 | Lấy thông tin profile hiện tại |
| `PUT` | `/profile/me` | 🔐 | Cập nhật profile |
| `PUT` | `/profile/me/avatar` | 🔐 | Cập nhật avatar |
| `PUT` | `/profile/me/change-password` | 🔐 | Đổi mật khẩu |
| `POST` | `/profile/me/avatar/upload` | 🔐 | Upload avatar image |
| `GET` | `/` | 👩‍💼 | Lấy danh sách người dùng |
| `POST` | `/` | 👩‍💼 | Tạo người dùng mới |
| `GET` | `/statistics` | 👩‍💼 | Thống kê hệ thống |
| `GET` | `/:userId` | 👩‍💼 | Lấy thông tin user theo ID |
| `PUT` | `/:userId/role` | 👩‍💼 | Cập nhật role user |
| `PATCH` | `/:userId/toggle-status` | 👩‍💼 | Bật/tắt status user |
| `DELETE` | `/:userId` | 👩‍💼 | Xóa user |

### `/api/user-profiles` - User Profiles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Lấy tất cả user profiles |
| `GET` | `/:id` | 👩‍💼 | Lấy user profile theo ID |
| `PUT` | `/:id` | 👩‍💼 | Cập nhật user profile |

---

## 3. 👨‍⚕️ Doctor Management

### `/api/doctors` - Doctor Management

#### Basic CRUD
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔓 | Danh sách bác sĩ (public) |
| `GET` | `/:id/public` | 🔓 | Thông tin bác sĩ (public) |
| `GET` | `/:id` | 👩‍💼 | Chi tiết bác sĩ (staff+) |
| `POST` | `/` | 👨‍💼 | Tạo bác sĩ mới |
| `PUT` | `/:id` | 👩‍💼 | Cập nhật bác sĩ |
| `DELETE` | `/:id` | 👨‍💼 | Xóa bác sĩ |

#### Advanced Features
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/upload-image` | 👩‍💼 | Upload ảnh bác sĩ |
| `GET` | `/details/all` | 👩‍💼 | Tất cả bác sĩ với chi tiết |
| `GET` | `/:id/details` | 👩‍💼 | Bác sĩ với feedback + status |
| `GET` | `/:id/feedbacks` | 🔓 | Feedback của bác sĩ |
| `GET` | `/:id/status` | 👩‍💼 | Trạng thái bác sĩ |
| `PUT` | `/:id/status` | 👨‍💼 | Cập nhật trạng thái |

#### Schedule Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/available` | 🔓 | Bác sĩ có lịch trống |
| `GET` | `/available/staff` | 👩‍💼 | Tất cả slots (staff view) |
| `GET` | `/schedules/all` | 🔓 | Lịch tất cả bác sĩ |
| `GET` | `/schedules/all/staff` | 👩‍💼 | Lịch tất cả (staff view) |
| `GET` | `/:id/schedules` | 🔓 | Lịch của bác sĩ |
| `GET` | `/:id/schedules/staff` | 👩‍💼 | Lịch bác sĩ (staff view) |
| `GET` | `/:id/available-slots` | 🔓 | Slots trống theo ngày |
| `GET` | `/:id/available-slots/staff` | 👩‍💼 | Tất cả slots (staff view) |
| `POST` | `/:id/schedules` | 👩‍💼 | Tạo lịch cho bác sĩ |
| `POST` | `/:id/schedules/bulk` | 👩‍💼 | Tạo lịch hàng loạt |
| `POST` | `/:id/schedules/bulk-days` | 👨‍💼 | Tạo lịch nhiều ngày |
| `POST` | `/:id/schedules/bulk-month` | 👨‍💼 | Tạo lịch cả tháng |
| `POST` | `/:id/book-slot` | 👨‍💼 | Book slot cho customer |
| `PUT` | `/:id/schedules` | 👩‍💼 | Cập nhật booking status |
| `DELETE` | `/:id/schedules/:scheduleId` | 👨‍💼 | Xóa lịch bác sĩ |

---

## 4. 🏥 Service Management

### `/api/services` - Services

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔓 | Danh sách dịch vụ |
| `GET` | `/:id` | 🔓 | Chi tiết dịch vụ |
| `POST` | `/` | 👨‍💼 | Tạo dịch vụ mới |
| `PUT` | `/:id` | 👨‍💼 | Cập nhật dịch vụ |
| `DELETE` | `/:id` | 👨‍💼 | Xóa dịch vụ |

### `/api/service-packages` - Service Packages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔓 | Danh sách gói dịch vụ |
| `GET` | `/:id` | 🔓 | Chi tiết gói dịch vụ |
| `POST` | `/` | 👨‍💼 | Tạo gói dịch vụ |
| `PUT` | `/:id` | 👨‍💼 | Cập nhật gói dịch vụ |
| `DELETE` | `/:id` | 👨‍💼 | Xóa gói dịch vụ |

### `/api/package-purchases` - Package Purchases

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách mua gói |
| `GET` | `/:id` | 👩‍💼 | Chi tiết giao dịch |
| `POST` | `/` | 👤 | Mua gói dịch vụ |

---

## 5. 📅 Appointment Management

### `/api/appointments` - Appointments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách cuộc hẹn |
| `GET` | `/my-appointments` | 👤 | Cuộc hẹn của tôi |
| `GET` | `/:id` | 👤 | Chi tiết cuộc hẹn |
| `POST` | `/` | 👤 | Đặt lịch hẹn |
| `PUT` | `/:id` | 👩‍💼 | Cập nhật cuộc hẹn |
| `DELETE` | `/:id` | 👩‍💼 | Hủy cuộc hẹn |
| `POST` | `/:id/confirm` | 👩‍💼 | Xác nhận cuộc hẹn |
| `POST` | `/:id/complete` | 👩‍💼 | Hoàn thành cuộc hẹn |
| `POST` | `/:id/cancel` | 👤 | Hủy cuộc hẹn (customer) |

---

## 6. 💳 Payment Management

### `/api/payments` - Payment Processing

#### Appointment Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/appointments/:appointmentId/create` | 🔐 | Tạo link thanh toán appointment |
| `GET` | `/appointments/:appointmentId/status` | 🔐 | Kiểm tra trạng thái thanh toán |
| `POST` | `/appointments/:appointmentId/cancel` | 🔐 | Hủy thanh toán appointment |
| `POST` | `/appointments/:appointmentId/fast-confirm` | 🔐 | Xác nhận nhanh thanh toán |
| `POST` | `/appointments/:appointmentId/force-check` | 🔐 | Force check và assign doctor |

#### Consultation Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/consultations/:doctorQAId/create` | 🔐 | Tạo link thanh toán consultation |
| `GET` | `/consultations/:doctorQAId/status` | 🔐 | Kiểm tra trạng thái thanh toán |
| `POST` | `/consultations/:doctorQAId/cancel` | 🔐 | Hủy thanh toán consultation |
| `POST` | `/consultations/:qaId/fast-confirm` | 🔐 | Xác nhận nhanh thanh toán |

#### Webhook & System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/webhook` | 🔓 | PayOS webhook (no auth) |

---

## 7. 🧪 Test Results Management

### `/api/test-results` - Test Results

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách kết quả xét nghiệm |
| `GET` | `/my-results` | 👤 | Kết quả xét nghiệm của tôi |
| `GET` | `/:id` | 👤 | Chi tiết kết quả xét nghiệm |
| `POST` | `/` | 👩‍💼 | Tạo kết quả xét nghiệm |
| `PUT` | `/:id` | 👩‍💼 | Cập nhật kết quả |
| `DELETE` | `/:id` | 👩‍💼 | Xóa kết quả xét nghiệm |

### `/api/test-result-items` - Test Result Items

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách chi tiết items |
| `GET` | `/:id` | 👩‍💼 | Chi tiết item |
| `POST` | `/` | 👩‍💼 | Tạo test result item |
| `PUT` | `/:id` | 👩‍💼 | Cập nhật item |
| `DELETE` | `/:id` | 👩‍💼 | Xóa item |

### `/api/test-categories` - Test Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔓 | Danh sách danh mục xét nghiệm |
| `GET` | `/:id` | 🔓 | Chi tiết danh mục |
| `POST` | `/` | 👨‍💼 | Tạo danh mục mới |
| `PUT` | `/:id` | 👨‍💼 | Cập nhật danh mục |
| `DELETE` | `/:id` | 👨‍💼 | Xóa danh mục |

### `/api/service-test-categories` - Service Test Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔓 | Danh sách service test categories |
| `GET` | `/:id` | 🔓 | Chi tiết category |
| `POST` | `/` | 👨‍💼 | Tạo category mới |
| `PUT` | `/:id` | 👨‍💼 | Cập nhật category |
| `DELETE` | `/:id` | 👨‍💼 | Xóa category |

---

## 8. 🩸 Menstrual Cycle Tracking

### `/api/menstrual-cycles` - Menstrual Cycles

#### Basic CRUD
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/menstrual-cycles` | 🔐 | Tạo chu kỳ mới |
| `GET` | `/menstrual-cycles` | 🔐 | Danh sách chu kỳ |
| `GET` | `/menstrual-cycles/calendar` | 🔐 | Dữ liệu lịch chu kỳ |
| `GET` | `/menstrual-cycles/:id` | 🔐 | Chi tiết chu kỳ |
| `PUT` | `/menstrual-cycles/:id` | 🔐 | Cập nhật chu kỳ |
| `DELETE` | `/menstrual-cycles/:id` | 🔐 | Xóa chu kỳ |

#### Advanced Reports & Analysis
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/menstrual-cycles/three-cycle-comparison` | 🔐♀️ | So sánh 3 chu kỳ gần nhất |
| `GET` | `/menstrual-cycles/predictive-analysis` | 🔐♀️ | Phân tích dự đoán |
| `GET` | `/menstrual-cycles/health-assessment` | 🔐♀️ | Đánh giá sức khỏe |
| `GET` | `/menstrual-cycles/:id/detailed-report` | 🔐♀️ | Báo cáo chi tiết chu kỳ |
| `GET` | `/menstrual-cycles/:id/analysis` | 🔐 | Phân tích chu kỳ |
| `GET` | `/menstrual-cycles/:id/guidance` | 🔐 | Hướng dẫn chăm sóc |
| `POST` | `/menstrual-cycles/:id/auto-complete` | 🔐 | Tự động hoàn thành chu kỳ |

#### Cycle Days Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/cycle-days` | 🔐 | Tạo/cập nhật ngày chu kỳ |
| `GET` | `/menstrual-cycles/:id/cycle-days` | 🔐 | Danh sách ngày trong chu kỳ |
| `GET` | `/cycle-days/:id` | 🔐 | Chi tiết ngày chu kỳ |
| `PUT` | `/cycle-days/:id` | 🔐 | Cập nhật ngày chu kỳ |
| `DELETE` | `/cycle-days/:id` | 🔐 | Xóa ngày chu kỳ |

#### Reports & Comparison
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/reports/generate/:cycleId` | 🔐 | Tạo báo cáo chu kỳ |
| `GET` | `/reports/:cycleId` | 🔐 | Xem báo cáo chu kỳ |
| `GET` | `/reports/comparison` | 🔐 | So sánh 3 chu kỳ |

#### Reminders Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/reminders` | 🔐 | Cài đặt nhắc nhở |
| `PUT` | `/reminders` | 🔐 | Cập nhật cài đặt nhắc nhở |
| `POST` | `/reminders/notify` | 🔓 | Trigger nhắc nhở (cronjob) |
| `GET` | `/reminders/stats` | 🔐 | Thống kê nhắc nhở |
| `POST` | `/reminders/test-email` | 🔐 | Test gửi email nhắc nhở |

#### Advanced Logic & Analysis
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/logic/generate-post-peak` | 🔐 | Tạo ngày post-peak |
| `POST` | `/logic/validate-day` | 🔐 | Validate dữ liệu ngày |
| `GET` | `/logic/gender-prediction/:cycleId` | 🔐 | Dự đoán giới tính thai nhi |

#### Data Management & Recovery
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/menstrual-cycles/auto-fix` | 🔐♀️ | Tự động sửa dữ liệu chu kỳ |
| `POST` | `/menstrual-cycles/validate-advanced` | 🔐♀️ | Validate dữ liệu nâng cao |
| `POST` | `/menstrual-cycles/reset-all` | 🔐♀️ | Reset tất cả chu kỳ |
| `POST` | `/menstrual-cycles/create-flexible` | 🔐♀️ | Tạo chu kỳ linh hoạt |
| `POST` | `/menstrual-cycles/clean-duplicates` | 🔐♀️ | Xóa dữ liệu trùng lặp |

**Note**: 🔐♀️ = Yêu cầu authentication + giới tính nữ

---

## 9. 💬 Doctor Q&A System

### `/api/doctor-qa` - Doctor Q&A

#### Slot Checking & Availability
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/check-slot/:date/:slotTime` | 🔓 | Kiểm tra slot có sẵn không |
| `GET` | `/available-slots-for-date/:date` | 🔓 | Lấy tất cả slots trong ngày |
| `GET` | `/doctors-workload` | 👩‍💼 | Thống kê workload bác sĩ |
| `GET` | `/best-assignment` | 👩‍💼 | Tìm assignment tốt nhất |
| `GET` | `/least-booked-doctor` | 👩‍💼 | Tìm bác sĩ ít booking nhất |

#### Q&A Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/` | 🔐 | Tạo yêu cầu tư vấn cơ bản |
| `POST` | `/create-with-selected-slot` | 🔐 | Tạo QA với slot đã chọn |
| `GET` | `/` | 👩‍💼 | Danh sách tất cả QA |
| `GET` | `/my-requests` | 🔐 | QA của user hiện tại |
| `GET` | `/my` | 👨‍⚕️ | QA của bác sĩ hiện tại |
| `GET` | `/live` | 👨‍⚕️ | Consultation đang LIVE |
| `GET` | `/today` | 👨‍⚕️ | Consultation hôm nay |
| `GET` | `/:id` | 🔐 | Chi tiết QA theo ID |
| `GET` | `/doctor/:doctorId` | 🔐 | QA của bác sĩ cụ thể |

#### QA Status & Workflow
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `PUT` | `/:id/confirm` | 👨‍⚕️ | Bác sĩ confirm/reject QA |
| `PUT` | `/:id/confirm-consultation` | 🔐 | Xác nhận consultation đã thanh toán |
| `PUT` | `/:id/schedule` | 👩‍💼 | Staff xếp lịch cụ thể |
| `PUT` | `/:id/status` | 👩‍💼 | Cập nhật trạng thái tổng quát |
| `PUT` | `/:id/cancel-by-doctor` | 👨‍⚕️ | Bác sĩ hủy consultation |
| `PUT` | `/:id/cancel-by-user` | 🔐 | User hủy consultation |
| `DELETE` | `/:id` | 👩‍💼 | Xóa QA |

#### Meeting Integration
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/:id/check-meeting` | 👨‍⚕️ | Kiểm tra có Meeting record chưa |
| `POST` | `/:id/create-meeting` | 👨‍⚕️ | Tạo hồ sơ Meeting |
| `PUT` | `/:id/complete-consultation` | 👨‍⚕️ | Hoàn thành consultation & meeting |
| `PUT` | `/:id/update-meeting` | 👨‍⚕️ | Cập nhật meeting notes |
| `GET` | `/:id/meeting-details` | 👨‍⚕️ | Chi tiết meeting |
| `GET` | `/:id/meeting` | 🔐 | Lấy meeting info |
| `POST` | `/:id/join-meeting` | 🔐 | Join meeting |
| `PUT` | `/:id/complete-meeting` | 👨‍⚕️ | Hoàn thành meeting |

#### Payment Integration
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `PUT` | `/:id/payment` | 🔓 | Cập nhật trạng thái thanh toán (webhook) |

#### Manual Triggers & Batch Processing
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `PUT` | `/:id/manual-schedule` | 👩‍💼 | Manually trigger auto-scheduling |
| `POST` | `/batch-process-paid` | 👩‍💼 | Batch process tất cả paid QAs |

---

## 10. 📋 Medical Records

### `/api/medical-records` - Medical Records

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách hồ sơ y tế |
| `GET` | `/my-records` | 👤 | Hồ sơ y tế của tôi |
| `GET` | `/:id` | 👤 | Chi tiết hồ sơ y tế |
| `POST` | `/` | 👩‍💼 | Tạo hồ sơ y tế mới |
| `PUT` | `/:id` | 👩‍💼 | Cập nhật hồ sơ y tế |
| `DELETE` | `/:id` | 👩‍💼 | Xóa hồ sơ y tế |

---

## 11. 💊 Medication Management

### `/api/medicines` - Medicines

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔓 | Danh sách thuốc |
| `GET` | `/:id` | 🔓 | Chi tiết thuốc |
| `POST` | `/` | 👨‍💼 | Thêm thuốc mới |
| `PUT` | `/:id` | 👨‍💼 | Cập nhật thông tin thuốc |
| `DELETE` | `/:id` | 👨‍💼 | Xóa thuốc |

### `/api/medication-reminders` - Medication Reminders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/` | 👤 | Tạo nhắc nhở uống thuốc |
| `GET` | `/my` | 👤 | Nhắc nhở của tôi |
| `GET` | `/:id` | 🔐 | Chi tiết nhắc nhở |
| `PUT` | `/:id` | 👤 | Cập nhật nhắc nhở |
| `PATCH` | `/:id/status` | 👤 | Tạm dừng/kích hoạt nhắc nhở |
| `DELETE` | `/:id` | 👤 | Xóa nhắc nhở |
| `GET` | `/staff/all` | 👩‍💼 | Tất cả nhắc nhở (staff view) |

---

## 12. 📝 Blog Management

### `/api/blog-posts` - Blog Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔓 | Danh sách bài blog |
| `GET` | `/:id` | 🔓 | Chi tiết bài blog |
| `POST` | `/` | 👩‍💼 | Tạo bài blog mới |
| `PUT` | `/:id` | 👩‍💼 | Cập nhật bài blog |
| `DELETE` | `/:id` | 👩‍💼 | Xóa bài blog |

---

## 13. 📊 Dashboard & Reports

### `/api/dashboard` - Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/stats` | 👩‍💼 | Thống kê tổng quan dashboard |

### `/api/reports` - Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/management` | 👨‍💼 | Báo cáo quản lý (admin/manager) |
| `POST` | `/detailed` | 👨‍💼 | Báo cáo chi tiết có filter |
| `POST` | `/export` | 👨‍💼 | Export báo cáo ra Excel |
| `POST` | `/seed-sample-data` | 🔒 | Tạo dữ liệu mẫu (Admin only) |
| `GET` | `/analytics` | 🔐 | Báo cáo phân tích |

---

## 14. 🔧 System Management

### `/api/system-logs` - System Logs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách system logs |
| `GET` | `/:id` | 👩‍💼 | Chi tiết system log |
| `POST` | `/` | 👩‍💼 | Tạo system log |
| `DELETE` | `/:id` | 🔒 | Xóa system log |

### `/api/login-history` - Login History

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Lịch sử đăng nhập |
| `GET` | `/my-history` | 🔐 | Lịch sử đăng nhập của tôi |

### `/api/google-auth` - Google Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/login` | 🔓 | Đăng nhập Google OAuth |
| `GET` | `/callback` | 🔓 | Callback Google OAuth |

---

## 15. 🔔 Notifications

### `/api/notification-days` - Notification Days

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔐 | Danh sách ngày thông báo |
| `GET` | `/:id` | 🔐 | Chi tiết ngày thông báo |
| `POST` | `/` | 🔐 | Tạo ngày thông báo |
| `PUT` | `/:id` | 🔐 | Cập nhật ngày thông báo |
| `DELETE` | `/:id` | 🔐 | Xóa ngày thông báo |

---

## 16. 🎥 Meeting Management

### `/api/meetings` - Meetings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách cuộc họp |
| `GET` | `/:id` | 🔐 | Chi tiết cuộc họp |
| `POST` | `/` | 👨‍⚕️ | Tạo cuộc họp mới |
| `PUT` | `/:id` | 👨‍⚕️ | Cập nhật cuộc họp |
| `DELETE` | `/:id` | 👨‍⚕️ | Xóa cuộc họp |

---

## 17. 🏃 Consultation Management

### `/api/consultations` - Consultations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách consultation |
| `GET` | `/:id` | 🔐 | Chi tiết consultation |
| `POST` | `/` | 👤 | Tạo consultation mới |
| `PUT` | `/:id` | 👨‍⚕️ | Cập nhật consultation |

---

## 🔗 Common Error Codes

| Status Code | Description | Example Response |
|-------------|-------------|------------------|
| `200` | Success | `{"success": true, "data": {...}}` |
| `201` | Created | `{"success": true, "message": "Created successfully"}` |
| `400` | Bad Request | `{"success": false, "message": "Invalid input"}` |
| `401` | Unauthorized | `{"success": false, "message": "Authentication required"}` |
| `403` | Forbidden | `{"success": false, "message": "Access denied"}` |
| `404` | Not Found | `{"success": false, "message": "Resource not found"}` |
| `422` | Validation Error | `{"success": false, "errors": [...]}` |
| `500` | Server Error | `{"success": false, "message": "Internal server error"}` |

---

## 📝 Request/Response Format

### Standard Response Format
```javascript
{
  "success": boolean,
  "message": string,
  "data": object | array,
  "errors": array, // Only for validation errors
  "pagination": { // Only for paginated responses
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

### Authentication Header
```javascript
{
  "Authorization": "Bearer <jwt_token>"
}
```

### Pagination Query Parameters
```javascript
?page=1&limit=10&sort=createdAt&order=desc&search=keyword
```

---

**Last Updated**: 2024-01-20  
**API Version**: v1.0  
**Documentation Maintainer**: Development Team

Trả lời bằng tiếng Việt 