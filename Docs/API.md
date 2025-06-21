# API Documentation - Gender Healthcare Service Management

## Tổng quan
Hệ thống Gender Healthcare Service Management cung cấp API RESTful cho quản lý dịch vụ chăm sóc sức khỏe giới tính.

**Base URL**: `http://localhost:5000/api`

## Phân quyền (Role Hierarchy)

### Cấu trúc phân quyền
```
admin (level 100)     → Tất cả quyền
  ↓
manager (level 80)    → Quyền staff + manager
  ↓  
staff (level 60)      → Quyền cơ bản nhân viên
doctor (level 60)     → Quyền bác sĩ (song song staff)
  ↓
customer (level 20)   → Quyền khách hàng
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

## 1. Authentication & Authorization

### `/api/auth` - Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | 🔓 | Đăng ký người dùng mới |
| `POST` | `/verify-email` | 🔓 | Xác thực email |
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

### Sample Request/Response

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

## 2. User Management

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

## 3. Doctor Management

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

#### Statistics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/statistics/all` | 👩‍💼 | Thống kê tất cả bác sĩ |
| `GET` | `/:id/statistics` | 👩‍💼 | Thống kê bác sĩ |

---

## 4. Service Management

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

## 5. Appointment Management

### `/api/appointments` - Appointments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách cuộc hẹn |
| `GET` | `/my-appointments` | 👤 | Cuộc hẹn của tôi |
| `GET` | `/:id` | 👤 | Chi tiết cuộc hẹn |
| `POST` | `/` | 👤 | Đặt lịch hẹn |
| `PUT` | `/:id` | 👩‍💼 | Cập nhật cuộc hẹn |
| `PUT` | `/:id/status` | 👩‍💼 | Cập nhật trạng thái |
| `DELETE` | `/:id` | 👨‍💼 | Hủy cuộc hẹn |

---

## 6. Medical Management

### `/api/medical-records` - Medical Records

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách hồ sơ y tế |
| `GET` | `/patient/:patientId` | 👨‍⚕️ | Hồ sơ của bệnh nhân |
| `GET` | `/:id` | 👨‍⚕️ | Chi tiết hồ sơ |
| `POST` | `/` | 👨‍⚕️ | Tạo hồ sơ y tế |
| `PUT` | `/:id` | 👨‍⚕️ | Cập nhật hồ sơ |
| `DELETE` | `/:id` | 👨‍💼 | Xóa hồ sơ |

### `/api/medicines` - Medicines

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👨‍⚕️ | Danh sách thuốc |
| `GET` | `/:id` | 👨‍⚕️ | Chi tiết thuốc |
| `POST` | `/` | 👨‍💼 | Thêm thuốc mới |
| `PUT` | `/:id` | 👨‍💼 | Cập nhật thuốc |
| `DELETE` | `/:id` | 👨‍💼 | Xóa thuốc |

### `/api/medication-reminders` - Medication Reminders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👨‍⚕️ | Danh sách nhắc nhở |
| `GET` | `/patient/:patientId` | 👨‍⚕️ | Nhắc nhở của bệnh nhân |
| `GET` | `/:id` | 👨‍⚕️ | Chi tiết nhắc nhở |
| `POST` | `/` | 👨‍⚕️ | Tạo nhắc nhở |
| `PUT` | `/:id` | 👨‍⚕️ | Cập nhật nhắc nhở |
| `DELETE` | `/:id` | 👨‍⚕️ | Xóa nhắc nhở |

---

## 7. Test Management

### `/api/test-categories` - Test Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔓 | Danh sách loại xét nghiệm |
| `GET` | `/:id` | 🔓 | Chi tiết loại xét nghiệm |
| `POST` | `/` | 👨‍💼 | Tạo loại xét nghiệm |
| `PUT` | `/:id` | 👨‍💼 | Cập nhật loại xét nghiệm |
| `DELETE` | `/:id` | 👨‍💼 | Xóa loại xét nghiệm |

### `/api/appointment-tests` - Appointment Tests

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách xét nghiệm |
| `GET` | `/appointment/:appointmentId` | 👨‍⚕️ | Xét nghiệm của cuộc hẹn |
| `GET` | `/:id` | 👨‍⚕️ | Chi tiết xét nghiệm |
| `POST` | `/` | 👨‍⚕️ | Tạo xét nghiệm |
| `PUT` | `/:id` | 👨‍⚕️ | Cập nhật xét nghiệm |
| `DELETE` | `/:id` | 👨‍💼 | Xóa xét nghiệm |

### `/api/test-results` - Test Results

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách kết quả xét nghiệm |
| `GET` | `/test/:testId` | 👨‍⚕️ | Kết quả của xét nghiệm |
| `GET` | `/:id` | 👨‍⚕️ | Chi tiết kết quả |
| `POST` | `/` | 👨‍⚕️ | Tạo kết quả |
| `PUT` | `/:id` | 👨‍⚕️ | Cập nhật kết quả |
| `DELETE` | `/:id` | 👨‍💼 | Xóa kết quả |

### `/api/test-result-items` - Test Result Items

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách chi tiết kết quả |
| `GET` | `/result/:resultId` | 👨‍⚕️ | Chi tiết của kết quả |
| `GET` | `/:id` | 👨‍⚕️ | Chi tiết item |
| `POST` | `/` | 👨‍⚕️ | Tạo chi tiết kết quả |
| `PUT` | `/:id` | 👨‍⚕️ | Cập nhật chi tiết |
| `DELETE` | `/:id` | 👨‍💼 | Xóa chi tiết |

---

## 8. Communication

### `/api/doctor-qa` - Doctor Q&A

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/questions` | 👩‍💼 | Danh sách câu hỏi |
| `GET` | `/questions/:id` | 👨‍⚕️ | Chi tiết câu hỏi |
| `POST` | `/questions` | 👤 | Đặt câu hỏi |
| `POST` | `/questions/:id/answer` | 👨‍⚕️ | Trả lời câu hỏi |
| `PUT` | `/questions/:id` | 👤 | Cập nhật câu hỏi |
| `DELETE` | `/questions/:id` | 👨‍💼 | Xóa câu hỏi |

### `/api/meetings` - Meetings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👩‍💼 | Danh sách cuộc họp |
| `GET` | `/:id` | 👤 | Chi tiết cuộc họp |
| `POST` | `/` | 👩‍💼 | Tạo cuộc họp |
| `PUT` | `/:id` | 👩‍💼 | Cập nhật cuộc họp |
| `DELETE` | `/:id` | 👨‍💼 | Xóa cuộc họp |

---

## 9. Payment

### `/api/payments` - Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/create-payment-link` | 👤 | Tạo link thanh toán |
| `GET` | `/payment-info/:orderCode` | 👤 | Thông tin thanh toán |
| `POST` | `/confirm-webhook` | 🔓 | Webhook xác nhận |

---

## 10. System Logs

### `/api/system-logs` - System Logs ⭐ NEW

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👨‍💼 | Danh sách system logs |
| `GET` | `/stats` | 👨‍💼 | Thống kê logs |
| `POST` | `/cleanup` | 🔒 | Xóa logs cũ |
| `POST` | `/test-log` | 👨‍💼 | Tạo test log |
| `POST` | `/export` | 👨‍💼 | Export logs |

#### Log Levels & Permissions
- **public**: Manager + Admin có thể xem
- **manager**: Manager + Admin có thể xem  
- **admin**: Chỉ Admin có thể xem

#### Log Actions
- Authentication: `login`, `logout`, `register`, `password_change`
- User Management: `user_create`, `user_update`, `user_delete`, `role_change`
- Appointments: `appointment_create`, `appointment_update`, `appointment_cancel`
- Medical: `medical_record_create`, `prescription_create`
- System: `system_error`, `security_violation`, `data_export`

---

## 11. Dashboard & Reports

### `/api/dashboard` - Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/management` | 👨‍💼 | Dashboard cho management |
| `GET` | `/operational` | 👩‍💼 | Dashboard cho operations |

### `/api/login-history` - Login History

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/:userId` | 👩‍💼 | Lịch sử đăng nhập |
| `POST` | `/` | 🔐 | Tạo log đăng nhập |

### `/api/notification-days` - Notification Days

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 👤 | Danh sách ngày thông báo |
| `GET` | `/:id` | 👤 | Chi tiết ngày thông báo |
| `POST` | `/` | 👤 | Tạo ngày thông báo |
| `PUT` | `/:id` | 👤 | Cập nhật ngày thông báo |
| `DELETE` | `/:id` | 👤 | Xóa ngày thông báo |

---

## Common Response Format

### Success Response
```javascript
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {
    // Response data
  },
  "pagination": { // Khi có phân trang
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Mô tả lỗi",
  "error": "Chi tiết lỗi (chỉ trong development)",
  "code": "ERROR_CODE" // Optional
}
```

### Common Error Codes
- `401` - Unauthorized (chưa đăng nhập)
- `403` - Forbidden (không có quyền)
- `404` - Not Found (không tìm thấy)
- `422` - Validation Error (dữ liệu không hợp lệ)
- `500` - Internal Server Error

---

## Authentication

### Headers Required
```javascript
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

### Token Management
- **Access Token**: Hết hạn sau 1 giờ
- **Refresh Token**: Hết hạn sau 7 ngày
- **Auto Refresh**: Frontend tự động refresh khi access token hết hạn

---

## Rate Limiting
- **Auth endpoints**: 5 requests/minute
- **File upload**: 3 requests/minute
- **General APIs**: 100 requests/minute

---

## API Changelog

### v2.5.0 (2025-01-25)
- ✅ Added System Logs Management API
- ✅ Added role hierarchy support cho tất cả endpoints
- ✅ Enhanced permission system with level-based access

### v2.4.0 (2024-01-20)
- ✅ Added Doctor schedule bulk operations
- ✅ Enhanced appointment management
- ✅ Added test management APIs

### v2.3.0 (2024-01-15)
- ✅ Added medical records API
- ✅ Enhanced user management
- ✅ Added medication reminders

---

**Tài liệu này được cập nhật thường xuyên. Vui lòng kiểm tra changelog để biết các thay đổi mới nhất.**

**Liên hệ**: Team phát triển Gender Healthcare Service Management 