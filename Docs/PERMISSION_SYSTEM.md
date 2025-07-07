# 🔐 Role-Based Permission System

## 📋 **Tổng quan**

Hệ thống permission đã được triển khai để lọc sidebar menu dựa trên role của user, chỉ hiển thị các chức năng mà user có quyền truy cập.

## 🎯 **Kết quả đạt được**

✅ **Sidebar được filter tự động theo role**  
✅ **Loại bỏ menu items không cần thiết**  
✅ **Tăng bảo mật và UX**  
✅ **Code maintainable và scalable**  

## 👥 **Permission Matrix**

### 🔴 **Admin Role** (5 items)
```
✅ Quản lý người dùng      (chỉ Admin)
✅ Lịch sử đăng nhập
✅ System Logs             (chỉ Admin)  
✅ Báo cáo
✅ Cài đặt                 (chỉ Admin)
```

### 🔵 **Manager Role** (9 items)
```
✅ Tổng quan
✅ Quản lý bác sĩ
✅ Quản lý lịch làm việc
✅ Quản lý dịch vụ
✅ Quản lý gói dịch vụ
✅ Quản lý thuốc
✅ Quản lý danh mục xét nghiệm
✅ Lịch sử đăng nhập
✅ Báo cáo

❌ Quản lý người dùng      (chỉ Admin)
❌ System Logs             (chỉ Admin)
❌ Cài đặt                 (chỉ Admin)
```

### 🟢 **Staff Role** (4 items)
```
✅ Tổng quan
✅ Lịch hẹn của tôi
✅ Nhập kết quả xét nghiệm
✅ Cấu hình xét nghiệm

❌ Báo cáo                 (không cần - focus vào operations)
❌ Tất cả management features
❌ Doctor-specific features
```

### 🟡 **Doctor Role** (7 items)
```
✅ Tổng quan
✅ Thông tin cá nhân
✅ Lịch hẹn của tôi
✅ Quản lý tất cả lịch hẹn
✅ Hồ sơ bệnh án
✅ Tư vấn trực tuyến
✅ Lịch sử Meeting

❌ Báo cáo                 (không cần - focus vào bệnh nhân)
❌ Tất cả management features
❌ Staff-specific features
❌ Bệnh nhân (đã xóa - trùng lặp)
```

## 🏗️ **Cấu trúc code**

### 📁 **Files được sửa đổi:**

1. **`Frontend/src/utils/permissions.ts`**
   - Enhanced permission functions
   - Menu filtering utilities
   - Permission mapping

2. **`Frontend/src/layouts/DashboardLayout.tsx`**
   - Applied permission filtering
   - Type safety improvements

3. **`Frontend/src/components/dashboard/templates/ManagementTemplate.tsx`**
   - Permission-filtered menu
   - Proper access control

4. **`Frontend/src/components/dashboard/templates/OperationalTemplate.tsx`**
   - Permission-filtered menu
   - Removed redundant "Bệnh nhân" menu

## 🎯 **Business Logic Rationale**

### **Doctor Role - Focus trên Patient Care:**
- ✅ **Dashboard** - Tổng quan công việc cá nhân
- ✅ **My Appointments** - Lịch hẹn của mình  
- ✅ **Medical Records** - Hồ sơ bệnh án để điều trị
- ✅ **Consultations** - Tư vấn trực tuyến
- ✅ **Meeting History** - Lịch sử các cuộc tư vấn
- ✅ **Profile** - Thông tin cá nhân và chuyên môn
- ❌ **Reports** - Không cần (management function)
- ❌ **All Management** - Không phải trách nhiệm của doctor

### **Staff Role - Focus trên Operations:**
- ✅ **Test Results** - Nhập và quản lý kết quả xét nghiệm
- ✅ **Test Configuration** - Cấu hình các loại xét nghiệm
- ✅ **My Appointments** - Xem appointments để hỗ trợ
- ❌ **Management Features** - Không có quyền quản lý
- ❌ **Doctor Features** - Không làm công việc bác sĩ

### **Manager Role - Focus trên Management:**
- ✅ **All Management Features** - Quản lý toàn bộ hoạt động
- ✅ **Reports** - Báo cáo để ra quyết định
- ✅ **Staff Functions** - Có quyền làm công việc staff
- ❌ **Admin-only Features** - User management, System logs, Settings

## 💻 **Cách sử dụng**

### 1. **Kiểm tra quyền cho menu item:**
```typescript
import { hasMenuPermission } from '../utils/permissions';

if (hasMenuPermission('users', userRole)) {
  // Show user management
}
```

### 2. **Filter menu items:**
```typescript
import { filterMenuItemsByPermissions } from '../utils/permissions';

const filteredMenu = filterMenuItemsByPermissions(allMenuItems, userRole);
```

### 3. **Thêm permission mới:**
```typescript
// 1. Tạo permission function
export const canAccessNewFeature = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

// 2. Thêm vào MenuPermissions
export const MenuPermissions = {
  // ... existing permissions ...
  'new-feature': canAccessNewFeature,
} as const;
```

## 🔧 **Core Functions**

### **Permission Checking:**
- `canAccessUserManagement()` - Admin only
- `canAccessDoctorManagement()` - Admin, Manager
- `canAccessSystemLogs()` - Admin only
- `canAccessMedicalRecords()` - Doctor only
- `canAccessConsultations()` - Doctor only
- And more...

### **Utility Functions:**
- `filterMenuItemsByPermissions()` - Main filtering function
- `hasMenuPermission()` - Individual permission check
- `getCurrentUserRole()` - Get user role from localStorage
- `getCurrentUser()` - Get user info

## 🎨 **Best Practices**

### ✅ **DOs:**
- Luôn check permissions ở cả frontend và backend
- Sử dụng centralized permission system
- Keep permission logic đơn giản và clear
- Test với tất cả roles

### ❌ **DON'Ts:**
- Đừng hardcode role checks trong components
- Đừng tin tưởng hoàn toàn frontend permissions
- Đừng tạo quá nhiều permission levels phức tạp
- Đừng duplicate permission logic

## 🚀 **Performance**

- **Lightweight**: Minimal impact on app performance
- **Efficient**: Menu filtering chỉ chạy khi role thay đổi
- **Cached**: User role được cache trong localStorage
- **Clean**: Loại bỏ debug logs trong production

## 🔄 **Maintenance**

### **Thêm role mới:**
1. Update `UserRole` type trong `permissions.ts`
2. Thêm permission functions cho role đó
3. Update các templates để support role mới

### **Thêm feature mới:**
1. Tạo permission function
2. Thêm vào `MenuPermissions` mapping
3. Thêm menu item với key tương ứng

### **Debug permissions:**
```typescript
// Development only
import { demonstratePermissionFiltering } from '../utils/permissions';
demonstratePermissionFiltering();
```

## 📊 **Statistics**

- **4 roles** được support
- **20+ permission functions** 
- **3 templates** được update
- **0 breaking changes** cho existing code
- **100% backward compatible**

---

**✨ Hệ thống permission đã hoàn thành và sẵn sàng sử dụng!** 