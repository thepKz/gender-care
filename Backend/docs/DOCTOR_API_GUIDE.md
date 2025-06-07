# Doctor API Documentation

## 📋 Tổng quan

API đã được cải thiện để tăng bảo mật và hiệu suất.

## 🔒 Chính sách bảo mật

- **Email & Phone**: Ẩn khỏi API public để bảo vệ privacy bác sĩ
- **Contact Info**: Chỉ hiển thị cho staff/admin qua endpoint riêng

## 📚 API Endpoints

### 1. GET /doctors - Lấy danh sách bác sĩ (Public)

**Request:**

```http
GET /api/doctors?page=1&limit=10
```

**Query Parameters:**

- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số records/trang (default: 10, max: 50)

**Response (200):**

```json
{
  "doctors": [
    {
      "_id": "64f123abc456789012345678",
      "userId": {
        "fullName": "BS. Lê Thị Hoa",
        "avatar": "avatar_url",
        "gender": "female",
        "address": "TP. Hồ Chí Minh"
      },
      "bio": "Chuyên gia về sức khỏe sinh sản nữ",
      "experience": 12,
      "rating": 4.9,
      "specialization": "Phụ khoa - Sinh sản",
      "education": "Thạc sĩ Y khoa",
      "certificate": "Chứng chỉ chuyên khoa cấp I"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. GET /doctors/:id - Lấy thông tin bác sĩ (Public)

**Request:**

```http
GET /api/doctors/64f123abc456789012345678
```

**Response (200):**

```json
{
  "_id": "64f123abc456789012345678",
  "userId": {
    "fullName": "BS. Lê Thị Hoa",
    "avatar": "avatar_url",
    "gender": "female",
    "address": "TP. Hồ Chí Minh"
  },
  "bio": "Chuyên gia về sức khỏe sinh sản nữ",
  "experience": 12,
  "rating": 4.9,
  "specialization": "Phụ khoa - Sinh sản",
  "education": "Thạc sĩ Y khoa",
  "certificate": "Chứng chỉ chuyên khoa cấp I"
}
```

### 3. GET /doctors/:id/contact - Lấy thông tin liên hệ (Staff/Admin only)

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Request:**

```http
GET /api/doctors/64f123abc456789012345678/contact
```

**Response (200):**

```json
{
  "_id": "64f123abc456789012345678",
  "userId": {
    "fullName": "BS. Lê Thị Hoa",
    "email": "bs.lehoa@genderhealthcare.com",
    "phone": "0901234568",
    "avatar": "avatar_url",
    "gender": "female",
    "address": "TP. Hồ Chí Minh"
  },
  "bio": "Chuyên gia về sức khỏe sinh sản nữ",
  "experience": 12,
  "rating": 4.9,
  "specialization": "Phụ khoa - Sinh sản",
  "education": "Thạc sĩ Y khoa",
  "certificate": "Chứng chỉ chuyên khoa cấp I"
}
```

## ❌ Error Responses

### 400 - Bad Request

```json
{
  "message": "ID bác sĩ không hợp lệ"
}
```

### 404 - Not Found

```json
{
  "message": "Không tìm thấy bác sĩ"
}
```

### 403 - Forbidden (cho /contact endpoint)

```json
{
  "message": "Không có quyền truy cập"
}
```

## 🔧 Cải thiện so với phiên bản cũ

1. **Bảo mật**: Ẩn email/phone khỏi API public
2. **Performance**: Thêm pagination, giới hạn 50 records/request
3. **Validation**: Kiểm tra ObjectId format
4. **Error Handling**: Phân loại và xử lý lỗi rõ ràng hơn
5. **Flexibility**: API riêng cho contact info khi cần thiết

## 💡 Workflow đề xuất

1. **Frontend public**: Sử dụng `/doctors` và `/doctors/:id` để hiển thị
2. **Admin panel**: Sử dụng `/doctors/:id/contact` để quản lý
3. **Booking system**: Sau khi confirm appointment, có thể access contact info
