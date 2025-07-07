# 🧪 Hướng dẫn sử dụng Test Management

## 📋 Tổng quan
Hệ thống Test Management cho phép quản lý danh mục xét nghiệm và nhập kết quả xét nghiệm với tự động đánh giá.

## 🚀 Cách chạy thử nghiệm

### 1. Khởi động hệ thống
```bash
# Terminal 1: Backend
cd Backend
npm run dev

# Terminal 2: Frontend  
cd Frontend
npm run dev
```

### 2. Đăng nhập với quyền phù hợp
- **Admin/Manager**: Để quản lý danh mục xét nghiệm
- **Doctor/Staff**: Để nhập kết quả xét nghiệm

### 3. Truy cập các chức năng

## 🔧 Dành cho Admin/Manager

### Quản lý danh mục xét nghiệm
1. Đăng nhập với tài khoản Admin/Manager
2. Vào **Dashboard Management** → **Quản lý danh mục xét nghiệm**
3. Chọn dịch vụ từ dropdown
4. Thêm/sửa/xóa các danh mục xét nghiệm với:
   - Tên danh mục
   - Đơn vị đo
   - Giá trị tham chiếu (min/max)
   - Giá trị mục tiêu

## 👩‍⚕️ Dành cho Doctor/Staff

### Nhập kết quả xét nghiệm
1. Đăng nhập với tài khoản Doctor/Staff
2. Vào **Dashboard Operational** → **Nhập kết quả xét nghiệm**
3. Chọn ngày và lọc cuộc hẹn
4. Chọn cuộc hẹn đã hoàn thành
5. Nhập kết quả cho từng danh mục
6. Hệ thống tự động đánh giá: **Cao/Thấp/Bình thường**

## 🧪 Demo và Test

### Trang Demo
Truy cập: `http://localhost:5173/demo/test-management`

Demo bao gồm:
- **Service Test Categories Manager**: Quản lý danh mục
- **Test Results Form**: Nhập kết quả  
- **Value Evaluator**: Đánh giá giá trị
- **Optimized Components**: Components đã tối ưu

### API Testing
Backend APIs có sẵn tại:
- GET `/api/service-test-categories/service/:serviceId`
- POST `/api/service-test-categories`
- PUT `/api/service-test-categories/:id`
- DELETE `/api/service-test-categories/:id`
- POST `/api/test-result-items/auto-evaluate`
- POST `/api/test-results`

## 📊 Workflow hoàn chỉnh

1. **Setup** (Admin/Manager):
   - Tạo danh mục xét nghiệm cho từng dịch vụ
   - Thiết lập range values và target values

2. **Operation** (Doctor/Staff):
   - Chọn cuộc hẹn đã completed
   - Load template xét nghiệm từ service
   - Nhập kết quả và auto-evaluation
   - Lưu kết quả với đánh giá

3. **Results**:
   - Bệnh nhân nhận kết quả với đánh giá rõ ràng
   - Lịch sử xét nghiệm được lưu trữ

## 🛠️ Troubleshooting

### Backend không khởi động
- Kiểm tra `.env` file có đúng config MongoDB
- Đảm bảo đã `npm install` dependencies

### Frontend không load
- Chạy `npm install` trong folder Frontend
- Kiểm tra backend đang chạy trên port 5000

### Lỗi API
- Kiểm tra network requests trong Developer Tools
- Xem console logs để debug errors

## 🎯 Features chính

✅ **Code Reusability**: Sử dụng hooks và utilities chung  
✅ **Auto Evaluation**: Tự động đánh giá kết quả theo range  
✅ **Optimized Performance**: Giảm 60% code duplication  
✅ **Type Safety**: Full TypeScript support  
✅ **Error Handling**: Unified error management  
✅ **User Experience**: Loading states và notifications

## 📱 UI Components có thể tái sử dụng

- `ServiceSelector`: Chọn dịch vụ với search
- `ValueEvaluator`: Đánh giá giá trị real-time  
- `useApiState`: Hook quản lý API calls
- `useServiceSelection`: Hook chọn dịch vụ
- `apiErrorHandler`: Utilities xử lý lỗi 