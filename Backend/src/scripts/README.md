# 📊 SCRIPT INSERT SAMPLE DATA CHO APPOINTMENT APIs

## 🎯 **Mục đích**
Script này sẽ insert sample data vào MongoDB để test các Appointment APIs mà không cần tạo schema/model trước.

## 🚀 **Cách chạy**

### **1. Đảm bảo đã cài đặt dependencies**
```bash
cd Backend
npm install mongodb dotenv
```

### **2. Kiểm tra file .env**
Đảm bảo có `MONGO_URI` trong file `.env`:
```env
MONGO_URI=mongodb://localhost:27017/your_database_name
# hoặc
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

### **3. Chạy script**
```bash
cd Backend/src/scripts
node insert-sample-data.js
```

## 📋 **Data sẽ được insert**

### **Collections được tạo:**
- `users` - 4 user accounts (2 customers + 2 doctors)
- `doctors` - 2 doctor profiles  
- `userprofiles` - 3 user health profiles
- `services` - 4 dịch vụ y tế
- `servicepackages` - 2 gói dịch vụ
- `doctorschedules` - 2 lịch làm việc bác sĩ với time slots
- `appointments` - 4 cuộc hẹn mẫu (các trạng thái khác nhau)
- `bills` - 2 hóa đơn mẫu

### **Test Accounts:**
```
👤 CUSTOMERS:
- Email: nguyenthimai@gmail.com | Password: password123
- Email: tranthihuong@gmail.com | Password: password123

👨‍⚕️ DOCTORS:  
- Email: bs.lethihoa@gmail.com | Password: password123
- Email: bs.nguyenvanan@gmail.com | Password: password123
```

## 🧪 **Appointment Data Test Cases**

### **Trạng thái Appointments:**
1. **Confirmed** - Cuộc hẹn đã xác nhận
2. **Pending** - Cuộc hẹn chờ xác nhận  
3. **Completed** - Cuộc hẹn đã hoàn thành
4. **Cancelled** - Cuộc hẹn đã hủy

### **Loại Appointments:**
- **consultation** - Tư vấn trực tiếp
- **test** - Xét nghiệm  
- **package** - Đặt theo gói dịch vụ

### **Địa điểm:**
- **Online** - Tư vấn online
- **clinic** - Tại phòng khám
- **home** - Tại nhà

## ⚠️ **Lưu ý**

1. **Trước khi chạy**: Backup database nếu có data quan trọng
2. **Duplicate handling**: Script sẽ skip nếu user đã tồn tại
3. **Error handling**: Script sẽ tiếp tục chạy nếu gặp lỗi ở một collection
4. **ObjectIds**: Tất cả ObjectIds đã được fix cứng để đảm bảo relationship

## 🔍 **Kiểm tra Data sau khi insert**

### **Sử dụng MongoDB Compass:**
1. Kết nối đến database
2. Kiểm tra các collection đã được tạo
3. Xem sample data trong từng collection

### **Sử dụng MongoDB Shell:**
```javascript
// Kết nối database
use your_database_name

// Kiểm tra appointments
db.appointments.find().pretty()

// Kiểm tra doctor schedules  
db.doctorschedules.find().pretty()

// Kiểm tra users
db.users.find({role: "doctor"}).pretty()
```

## 🚧 **Troubleshooting**

### **Lỗi kết nối MongoDB:**
- Kiểm tra MONGO_URI trong .env
- Đảm bảo MongoDB đang chạy
- Kiểm tra network/firewall

### **Lỗi duplicate key:**
- Script sẽ tự động skip user đã tồn tại
- Các collection khác sẽ báo lỗi nhưng không ảnh hưởng

### **Lỗi missing database:**
- Database sẽ được tự động tạo nếu chưa tồn tại
- Collections sẽ được tự động tạo khi insert data

## ✅ **Sau khi insert thành công**

Bạn có thể:
1. ✅ Implement Appointment APIs
2. ✅ Test với Postman/Thunder Client
3. ✅ Kiểm tra logic đặt lịch/hủy lịch
4. ✅ Test permission matrix với các role khác nhau

## 🔄 **Xóa sample data (nếu cần)**

```javascript
// Kết nối MongoDB shell
use your_database_name

// Xóa toàn bộ sample data
db.appointments.deleteMany({})
db.bills.deleteMany({})
db.doctorschedules.deleteMany({})
db.servicepackages.deleteMany({})
db.services.deleteMany({})
db.userprofiles.deleteMany({})
db.doctors.deleteMany({})

// Xóa sample users (nếu muốn)
db.users.deleteMany({
  email: {
    $in: [
      "nguyenthimai@gmail.com",
      "tranthihuong@gmail.com", 
      "bs.lethihoa@gmail.com",
      "bs.nguyenvanan@gmail.com"
    ]
  }
})
``` 