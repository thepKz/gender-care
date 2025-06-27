# Doctor Schedule Management - Hướng dẫn sử dụng

## 🎯 **Tổng quan**

Chức năng Quản lý lịch làm việc bác sĩ cho phép Manager và Admin xem, tìm kiếm và theo dõi lịch của tất cả bác sĩ trong hệ thống.

## 📋 **Tính năng chính**

### **1. Dashboard Overview**
- 📊 **Thống kê real-time**:
  - Tổng bác sĩ có lịch
  - Tổng số slots
  - Slots trống (available)
  - Slots đã đặt (booked)

### **2. Tìm kiếm và Filter**
- 🔍 **Tìm kiếm theo tên bác sĩ**
- 🎯 **Filter theo chuyên khoa**
- 📱 **Responsive search** với real-time results

### **3. Table View**
- 📋 **Danh sách đầy đủ** tất cả bác sĩ có lịch
- 📅 **Expandable rows** để xem chi tiết slots theo ngày
- ⚡ **Sort by**: Số ngày làm việc, tổng slots, update time
- 📄 **Pagination** với size options (10, 20, 50)

### **4. Chi tiết lịch làm việc**
- 👨‍⚕️ **Thông tin bác sĩ**: Tên, email, chuyên khoa
- 📊 **Thống kê slots**: Tổng, trống, đã đặt
- 📅 **Lịch theo ngày** với color coding:
  - 🟢 **Free slots** (màu xanh)
  - 🔴 **Booked slots** (màu đỏ)  
  - 🟠 **Absent slots** (màu cam)

## 🚀 **Cách sử dụng**

### **Truy cập**
1. Đăng nhập với role **Manager** hoặc **Admin**
2. Vào Dashboard → **"Lịch làm việc bác sĩ"**

### **Tìm kiếm bác sĩ**
1. Sử dụng **Search box** để tìm theo tên
2. Chọn **Chuyên khoa** từ dropdown filter
3. Kết quả hiển thị ngay lập tức

### **Xem chi tiết**
1. Click **Eye icon** ở cột "Thao tác"
2. Hoặc click **Expand button** để xem slots theo ngày
3. Modal hiển thị thông tin đầy đủ và thống kê

### **Làm mới dữ liệu**
- Click **"Làm mới"** để cập nhật dữ liệu mới nhất

## 🔧 **Technical Details**

### **API Endpoints**
```javascript
// Lấy tất cả lịch làm việc (Staff/Manager/Admin only)
doctorScheduleApi.getAll()

// Response format:
IDoctorSchedule[] = [
  {
    _id: string,
    doctorId: {
      _id: string,
      userId: { fullName, email },
      specialization: string
    },
    weekSchedule: [
      {
        dayOfWeek: string, // ISO date
        slots: [
          {
            slotTime: "07:00-08:00",
            status: "Free" | "Booked" | "Absent"
          }
        ]
      }
    ]
  }
]
```

### **Components Structure**
```
DoctorScheduleManagement/
├── Statistics Cards (4 cards)
├── Search & Filter Bar
├── Results Summary (when filtered)
└── Main Table
    ├── Basic Info Columns
    ├── Stats Columns (badges)
    ├── Actions Column
    └── Expandable Rows
        └── Detailed Slots by Date
```

### **Real-time Calculations**
- **Stats tự động tính** từ filtered data
- **Color coding** theo trạng thái slots
- **Responsive design** cho mobile/desktop

## 🎨 **UI/UX Features**

### **Visual Indicators**
- 🟢 **Green badges** - Available/Free slots
- 🔴 **Red badges** - Booked slots  
- 🟠 **Orange tags** - Absent slots
- 🔵 **Blue badges** - Total slots

### **Interactive Elements**
- **Hover tooltips** với full datetime
- **Expandable rows** smooth animation
- **Modal popups** với detailed info
- **Alert notifications** cho filtered results

### **Performance**
- **Lazy loading** cho large datasets
- **Debounced search** tránh spam API
- **Memoized calculations** cho stats
- **Optimized rendering** với React best practices

## 📱 **Mobile Support**

- ✅ **Responsive table** với horizontal scroll
- ✅ **Touch-friendly** buttons và interactions  
- ✅ **Readable text** với proper font sizes
- ✅ **Accessible** color contrast và ARIA labels

## 🔐 **Security & Permissions**

### **Role-based Access**
- ✅ **Manager**: Full read access to all schedules
- ✅ **Admin**: Full read access + future write permissions
- ❌ **Staff/Doctor/Customer**: No access (redirected)

### **Data Protection**
- 🔒 **JWT authentication** required
- 🔐 **Role middleware** verification
- 📡 **HTTPS only** data transmission
- 🛡️ **Input sanitization** cho search queries

## 🚧 **Future Enhancements**

### **Planned Features**
- 📝 **Edit schedules** directly from dashboard
- 📅 **Calendar view** với drag-drop editing
- 📊 **Advanced analytics** với charts
- 📤 **Export schedules** to CSV/PDF
- 🔔 **Real-time notifications** cho schedule changes
- 📱 **Mobile app** với push notifications

### **Performance Improvements**
- ⚡ **Virtual scrolling** cho large tables
- 🎯 **Advanced filtering** với date ranges
- 🔍 **Full-text search** với elasticsearch
- 📊 **Caching strategies** với Redis

---

**Liên hệ hỗ trợ**: Nếu gặp vấn đề, vui lòng liên hệ team development hoặc tạo issue trong hệ thống. 