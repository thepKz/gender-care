# Manager API Guide - User Management

## 🔐 Authentication
Tất cả API cần header: `Authorization: Bearer <manager-jwt-token>`

## 📋 **1. GET /api/users - Lấy danh sách người dùng**

### Request:
```javascript
GET /api/users?page=1&limit=10&role=customer&search=nguyen&sortBy=createdAt&sortOrder=desc
```

### Query Parameters:
- `page` (number): Trang hiện tại (default: 1)
- `limit` (number): Số lượng per page (default: 10)
- `role` (string): Filter theo role (admin, manager, staff, doctor, customer)
- `search` (string): Tìm theo tên, email, phone
- `sortBy` (string): Sắp xếp theo field (createdAt, fullName, email)
- `sortOrder` (string): asc/desc (default: desc)

### Response:
```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "users": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "limit": 10
    },
    "statistics": {
      "totalUsers": 50,
      "roleStats": {
        "customer": 30,
        "doctor": 10,
        "staff": 8,
        "manager": 1,
        "admin": 1
      }
    }
  }
}
```

---

## ➕ **2. POST /api/users - Tạo người dùng mới**

### Request:
```javascript
POST /api/users
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "role": "customer", // customer, doctor, staff (không thể tạo admin)
  "gender": "male",
  "address": "TP.HCM"
}
```

### Response:
```json
{
  "success": true,
  "message": "Tạo người dùng thành công",
  "data": {
    "_id": "user_id",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "customer"
  }
}
```

---

## 🔍 **3. GET /api/users/:userId - Chi tiết người dùng**

### Request:
```javascript
GET /api/users/60f7b3b3b3b3b3b3b3b3b3b3
```

### Response:
```json
{
  "success": true,
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "user": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "role": "doctor",
      "isActive": true
    },
    "additionalInfo": { // Nếu là doctor
      "bio": "Bác sĩ chuyên khoa...",
      "experience": 5,
      "specialization": "Sản phụ khoa"
    }
  }
}
```

---

## 🔧 **4. PUT /api/users/:userId/role - Cập nhật role**

### Request:
```javascript
PUT /api/users/60f7b3b3b3b3b3b3b3b3b3b3/role
{
  "newRole": "staff",
  "reason": "Thăng cấp thành nhân viên",
  "doctorProfile": { // Nếu role = doctor
    "bio": "Thông tin bác sĩ",
    "specialization": "Chuyên khoa",
    "experience": 5
  }
}
```

### Response:
```json
{
  "success": true,
  "message": "Cập nhật role thành công: customer → staff",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "oldRole": "customer",
    "newRole": "staff"
  }
}
```

---

## 🔄 **5. PATCH /api/users/:userId/toggle-status - Bật/tắt trạng thái**

### Request:
```javascript
PATCH /api/users/60f7b3b3b3b3b3b3b3b3b3b3/toggle-status
{
  "reason": "Vi phạm quy định"
}
```

### Response:
```json
{
  "success": true,
  "message": "Cập nhật trạng thái thành công",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "newStatus": false,
    "reason": "Vi phạm quy định"
  }
}
```

---

## 🗑️ **6. DELETE /api/users/:userId - Xóa người dùng**

### Request:
```javascript
DELETE /api/users/60f7b3b3b3b3b3b3b3b3b3b3
{
  "reason": "Tài khoản spam",
  "hardDelete": false // Manager chỉ được soft delete
}
```

### Response:
```json
{
  "success": true,
  "message": "Vô hiệu hóa tài khoản thành công",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "action": "soft_delete"
  }
}
```

---

## 📊 **7. GET /api/users/statistics - Thống kê hệ thống**

### Request:
```javascript
GET /api/users/statistics
```

### Response:
```json
{
  "success": true,
  "message": "Lấy thống kê thành công",
  "data": {
    "totalUsers": 100,
    "activeUsers": 95,
    "inactiveUsers": 5,
    "roleDistribution": {
      "customer": 70,
      "doctor": 15,
      "staff": 10,
      "manager": 4,
      "admin": 1
    },
    "recentRegistrations": {
      "today": 5,
      "thisWeek": 20,
      "thisMonth": 50
    }
  }
}
```

---

## ⚠️ **Manager Restrictions:**
- ❌ Không thể tạo/sửa/xóa Admin accounts
- ❌ Không thể hard delete (chỉ soft delete)
- ✅ Có thể quản lý customer, doctor, staff
- ✅ Có thể xem tất cả thống kê

---

## 🧪 **Testing:**
1. Chỉnh sửa `MANAGER_TOKEN` trong file `test-manager-api.js`
2. Chạy: `node test-manager-api.js`
3. Kiểm tra logs để xác nhận API hoạt động

---

## 🔗 **Related APIs:**
- `/api/login-history` - Xem lịch sử đăng nhập
- `/api/doctors` - Quản lý bác sĩ chi tiết
- `/api/appointments` - Quản lý cuộc hẹn 