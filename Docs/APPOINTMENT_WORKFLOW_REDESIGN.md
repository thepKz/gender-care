# APPOINTMENT WORKFLOW REDESIGN

## Ngữ cảnh
Document này ghi lại việc redesign workflow cho hệ thống quản lý lịch hẹn để tối ưu hóa user experience và giảm manual intervention.

**Ngày tạo:** 2025-01-25  
**Trạng thái:** ✅ Completed  
**Vai trò xử lý:** Doctor Role  

---

## PHÂN TÍCH WORKFLOW

### 🔄 **Workflow Hiện Tại (Cũ)**
```
1. Customer tạo appointment/consultation
   ↓
2. Auto assign doctor + book slot → status: `pending_payment`
   ↓
3. Customer thanh toán thành công → status: `paid`
   ↓
4. ❌ Doctor cần MANUAL CONFIRM → status: `confirmed`
   ↓
5. Staff schedule → status: `scheduled`
   ↓
6. Doctor có thể cancel bất kỳ lúc nào → status: `cancelled`
```

### 🎯 **Workflow Mới (Mong muốn)**
```
1. Customer tạo appointment/consultation
   ↓
2. Auto assign doctor + book slot → status: `pending_payment`
   ↓
3. Customer thanh toán thành công → ✅ TỰ ĐỘNG CONFIRM → status: `scheduled`
   ↓
4. Doctor chỉ có thể cancel trước 72h → slot: `Booked` → `Absent` + Auto re-assign
   ↓
5. Nếu không cancel → thực hiện appointment → status: `completed`
```

---

## CÁC THAY ĐỔI CHÍNH

### 📋 **1. Frontend Changes (Ưu tiên cao)**

#### **A. AppointmentManagement.tsx**
- [x] **Bỏ nút "Xác nhận" (Confirm)**
- [x] **Chỉ hiển thị nút "Hủy lịch hẹn"**
- [x] **Thêm điều kiện 72h cho nút hủy**
- [x] **Xóa status "confirmed" khỏi workflow**

#### **B. Logic Implementation**
```typescript
// Kiểm tra điều kiện 72h
const canCancelAppointment = (appointmentDate: string, appointmentTime: string): boolean => {
  const now = new Date();
  const appointmentDateTime = new Date(`${appointmentDate} ${appointmentTime}`);
  const deadline = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // +72h
  return deadline <= appointmentDateTime;
};
```

### 📋 **2. Backend Changes (Sẽ thực hiện sau)**
- [ ] Auto-confirm logic trong `updatePaymentStatus`
- [ ] Tạo `setSlotAbsent` function
- [ ] Implement auto re-assignment
- [ ] Update cancel logic

---

## CHI TIẾT THỰC HIỆN

### 🎯 **Phase 1: Frontend Updates (Hiện tại)**

#### **1.1. Remove Confirm Logic**
- [x] ✅ Xóa confirm button khỏi actions column
- [x] ✅ Xóa handleStatusChange function  
- [x] ✅ Update conditional rendering

#### **1.2. Implement 72h Rule**
- [x] ✅ Thêm canCancelAppointment function
- [x] ✅ Apply điều kiện cho cancel button
- [x] ✅ Update tooltips và messages

#### **1.3. Status Management**
- [x] ✅ Remove "confirmed" từ status enum
- [x] ✅ Update getStatusText function
- [x] ✅ Update filter options

---

## TIMELINE

### ✅ **Hoàn thành:**
- [x] ✅ Phân tích workflow
- [x] ✅ Tạo task breakdown
- [x] ✅ Backend auto-assignment implementation
- [x] ✅ Backend cancel logic with auto re-assign
- [x] ✅ Frontend updates (management/AppointmentManagement.tsx)
- [x] ✅ Status enum updates (4 states)
- [x] ✅ 72h cancel rule implementation

### 🚧 **Đang thực hiện:**
- [x] ✅ Frontend updates (COMPLETED)
- [ ] Integration testing
- [ ] User acceptance testing

### ⏳ **Sẽ thực hiện:**
- [x] ✅ Backend integration (COMPLETED)
- [x] ✅ Auto re-assignment (COMPLETED)

---

**Last Updated:** 2025-01-25 (Completed)  
**Next Review:** Production deployment & monitoring  
**Responsible:** Development Team

---

## ✅ **IMPLEMENTATION SUMMARY**

### **Backend Changes Completed:**
- ✅ **Intelligent Auto Assignment** với doctor priority algorithm
- ✅ **Enhanced Cancel Logic** với auto re-assignment cho consultations  
- ✅ **Slot Management** với Absent status và audit trail
- ✅ **Status Simplification** từ 5 states xuống 4 states
- ✅ **72h Cancel Rule** implementation

### **Frontend Changes Completed:**
- ✅ **Removed Manual Confirm Buttons** theo workflow mới
- ✅ **72h Cancel Rule UI** với conditional rendering
- ✅ **Different Cancel Rules** cho appointments vs consultations
- ✅ **Status Enum Updates** cho 4 states mới
- ✅ **Filter Options Updates** match với backend
- ✅ **Enhanced Cancel UI** với tooltips và validation

### **Key Improvements:**
- 🚀 **Faster Workflow:** Auto-confirm sau payment
- 🧠 **Smart Assignment:** Priority-based doctor selection  
- 🔄 **Auto Re-assignment:** Seamless doctor substitution cho consultations
- ⏰ **Different Cancel Rules:** 72h rule cho appointments, flexible cho consultations
- 🎯 **Simplified Status:** Clear 4-state workflow

### **ADDITIONAL REQUIREMENT - CONSULTATION CANCELLATION:**
- ✅ **Doctor Cancel for Consultations:** Doctor có thể hủy consultation trong MỌI trường hợp (từ `pending_payment` trở đi), trừ `cancelled` và `completed`
- ✅ **No 72h Rule for Consultations:** Khác với appointments, consultations không có giới hạn 72h
- ✅ **Auto Re-assignment:** Khi doctor hủy consultation, hệ thống TỰ ĐỘNG tìm và assign bác sĩ khác
- ✅ **Frontend Implementation:** UI phân biệt cancel button cho appointments vs consultations 