# 🔐 HƯỚNG DẪN TEST AUTHENTICATION

## 📋 STEP 1: Đăng nhập để lấy token

### 1.1 Tạo staff user trước (để test STAFF APIs):
```bash
# Chạy trong terminal Backend:
npm run seed:doctors
```

### 1.2 Login để lấy accessToken:
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user1@gmail.com", 
  "password": "User123"
}
```

**Hoặc dùng staff demo (nếu có):**
```bash
{
  "email": "staff@genderhealthcare.com",
  "password": "staff123"
}
```

### 1.3 Copy accessToken từ response:
```json
{
  "message": "Đăng nhập thành công!",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "role": "staff"
  }
}
```

## 🎯 STEP 2: Sử dụng token trong Swagger

### 2.1 Mở Swagger UI:
```
http://localhost:5000/api-docs
```

### 2.2 Click nút **"Authorize"** ở góc phải trên cùng

### 2.3 Nhập token theo format:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ QUAN TRỌNG:**
- **KHÔNG** nhập "Bearer " trước token
- **CHỈ** nhập phần accessToken 
- **KHÔNG** nhập SECRET_KEY từ .env

### 2.4 Click "Authorize" để lưu

## 🧪 STEP 3: Test các APIs

### 3.1 Test APIs PUBLIC (không cần token):
- `GET /doctors` - Xem danh sách bác sĩ
- `GET /doctors/{id}/schedules` - Xem lịch bác sĩ
- `GET /doctors/{id}/available-slots` - Xem slot trống

### 3.2 Test APIs STAFF ONLY (cần token + role staff):
- `POST /doctors/{id}/schedules` - Tạo lịch cho bác sĩ
- `PUT /doctors/{id}/schedules` - Cập nhật booking
- `DELETE /doctors/{id}/schedules/{scheduleId}` - Xóa lịch

## 🔍 TROUBLESHOOTING

### Lỗi "Token không đúng định dạng JWT":
- ✅ Kiểm tra token có 3 phần ngăn cách bởi dấu chấm
- ✅ Không có khoảng trắng thừa
- ✅ Copy đúng accessToken từ login response

### Lỗi "Không có quyền truy cập":
- ✅ Đảm bảo user có role = "staff", "manager", hoặc "admin"
- ✅ User phải đăng nhập thành công

### Token hết hạn:
- ✅ Login lại để lấy token mới
- ✅ Token có thời hạn giới hạn

## 🎯 DEMO DATA ĐÃ TẠO:

### 5 Bác sĩ demo:
- dr.nguyen@genderhealthcare.com | doctor123
- dr.le@genderhealthcare.com | doctor123  
- dr.tran@genderhealthcare.com | doctor123
- dr.pham@genderhealthcare.com | doctor123
- dr.hoang@genderhealthcare.com | doctor123

### Test với doctor ID: 
Dùng `GET /doctors` để lấy danh sách và copy `_id` của bác sĩ để test. 