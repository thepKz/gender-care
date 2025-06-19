# APPOINTMENT WORKFLOW REDESIGN

## Ngữ cảnh
Document này ghi lại việc redesign workflow cho hệ thống quản lý lịch hẹn để tối ưu hóa user experience và giảm manual intervention.

**Ngày tạo:** 2025-01-25  
**Trạng thái:** 🔄 Updating Logic  
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
4. CANCEL LOGIC THEO LOẠI DỊCH VỤ:
   📱 CONSULTATION: Doctor có thể "thuyên chuyển" → tìm doctor khác trong slot
   🏥 APPOINTMENT: Doctor chỉ có thể cancel trước 72h → slot: `Booked` → `Absent`
   ↓
5. Nếu không cancel → thực hiện appointment → status: `completed`
```

---

## ⚡ **CẬP NHẬT LOGIC NÚT HỦY THEO YÊU CẦU MỚI**

### 🎯 **CONSULTATION CANCEL LOGIC (Tư vấn trực tuyến)**

#### **A. Behavior Mong Muốn:**
- ✅ **Luôn có nút hủy** (không phụ thuộc thời gian)
- ✅ **Nút hủy = Nút "Thuyên chuyển công việc"**
- ✅ **Logic:** Khi doctor nhấn hủy → Call API kiểm tra slot hiện tại
  - **Có doctor khác free trong cùng slot** → Chuyển công việc cho họ
  - **Không có ai free** → Disable nút hủy (không cho phép hủy nữa)

#### **B. Implementation Details:**
```typescript
// Function kiểm tra có thể "thuyên chuyển" không
const canTransferConsultation = async (consultationId: string): Promise<boolean> => {
  try {
    // Call API kiểm tra slot hiện tại có doctor khác free không
    const availableDoctors = await consultationAPI.checkAvailableDoctorsInSlot(consultationId);
    return availableDoctors.length > 0;
  } catch (error) {
    console.error('Error checking transfer availability:', error);
    return false; // Không cho phép nếu có lỗi
  }
};

// Logic render nút cho consultation
const renderConsultationCancelButton = (record: Consultation) => {
  const [canTransfer, setCanTransfer] = useState<boolean>(false);
  
  useEffect(() => {
    if (record.type === 'consultation' && ['scheduled', 'consulting'].includes(record.status)) {
      canTransferConsultation(record._id).then(setCanTransfer);
    }
  }, [record]);

  if (record.type !== 'consultation') return null;
  if (!['scheduled', 'consulting'].includes(record.status)) return null;

  return (
    <Tooltip title={canTransfer ? "Thuyên chuyển cho bác sĩ khác" : "Không có bác sĩ khác trong slot này"}>
      <Button 
        type="text" 
        icon={<SwapOutlined />} 
        size="small"
        danger={canTransfer}
        disabled={!canTransfer}
        onClick={() => showTransferModal(record)}
      >
        {canTransfer ? 'Thuyên chuyển' : 'Không thể chuyển'}
      </Button>
    </Tooltip>
  );
};
```

### 🏥 **APPOINTMENT CANCEL LOGIC (Lịch hẹn khám bệnh)**

#### **A. Behavior Mong Muốn:**
- ✅ **72h Rule:** Chỉ hiển thị nút hủy nếu `thời điểm hiện tại + 72h < thời gian hẹn`
- ✅ **Dưới 72h:** Mất luôn nút cancel
- ✅ **Status Validation:** Chỉ cancel được `scheduled`, `consulting`

#### **B. Implementation Details (✅ ĐÃ IMPLEMENTED):**
```typescript
// ✅ HIỆN TẠI ĐÃ CÓ - Logic 72h rule
const canCancelAppointment = (appointmentDate: string, appointmentTime: string, status: string): boolean => {
  try {
    // ✅ Only allow cancel for scheduled/consulting appointments
    if (!['scheduled', 'consulting'].includes(status)) {
      return false;
    }
    
  const now = new Date();
  const appointmentDateTime = new Date(`${appointmentDate} ${appointmentTime}`);
  const deadline = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // +72h
    
    // Allow cancel only if deadline <= appointment time
  return deadline <= appointmentDateTime;
  } catch (error) {
    console.error('Error checking cancel deadline:', error);
    return false;
  }
};

// ✅ HIỆN TẠI ĐÃ CÓ - Render logic
{canCancelAppointment(record.appointmentDate, record.appointmentTime, record.status) && (
  <Tooltip title="Hủy lịch hẹn (chỉ có thể hủy trước 72h)">
    <Button 
      type="text" 
      icon={<DeleteOutlined />} 
      size="small"
      danger
      onClick={() => showCancelModal(record)}
    >
      Hủy lịch hẹn
    </Button>
  </Tooltip>
)}


## 📋 **TRẠNG THÁI IMPLEMENTATION**

### ✅ **ĐÃ HOÀN THÀNH:**
- [x] ✅ **Appointment 72h Rule Logic** - Function `canCancelAppointment()` 
- [x] ✅ **Appointment Cancel Button Rendering** - Conditional với 72h check
- [x] ✅ **Status Validation** - Chỉ cho phép cancel `scheduled`, `consulting`
- [x] ✅ **Cancel Modal & API Integration** - `handleCancelByDoctor()`
- [x] ✅ **Status Enum Updates** - 4 states workflow
- [x] ✅ **Auto-confirm After Payment** - Bỏ qua doctor manual confirm

### 🚧 **CẦN THỰC HIỆN:**
- [ ] ❌ **Consultation Transfer Logic** - `canTransferConsultation()` function
- [ ] ❌ **Check Available Doctors API** - Backend endpoint `/api/consultations/:id/check-available-doctors`
- [ ] ❌ **Transfer Modal Component** - UI cho thuyên chuyển consultation
- [ ] ❌ **Different Button Rendering** - Phân biệt consultation vs appointment
- [ ] ❌ **Transfer API Integration** - `handleTransferConsultation()`

### 🔧 **CẦN SỬA ĐỔI:**
- [ ] ❌ **Phân biệt Logic theo Type** - Hiện tại đang dùng chung `canCancelAppointment()`
- [ ] ❌ **Button Text & Icon** - Consultation: "Thuyên chuyển", Appointment: "Hủy lịch hẹn"
- [ ] ❌ **Dynamic Button State** - Consultation button cần check real-time availability

---

## 🔄 **ENHANCED WORKFLOW DESIGN**

### 📱 **CONSULTATION WORKFLOW:**
```
Customer booking consultation
    ↓
Auto assign doctor + slot → status: `pending_payment`
    ↓
Payment success → status: `scheduled`
    ↓
Doctor có việc gấp → Nhấn "Thuyên chuyển"
    ↓
API Check: Có doctor khác free trong slot?
    ├─ YES → Transfer successful → Consultation continues with new doctor
    └─ NO  → Button disabled → Doctor bắt buộc phải làm
```

### 🏥 **APPOINTMENT WORKFLOW:**
```
Customer booking appointment
    ↓
Auto assign doctor + slot → status: `pending_payment`
    ↓
Payment success → status: `scheduled`
    ↓
Time check: Current time + 72h < appointment time?
    ├─ YES → Show "Hủy lịch hẹn" button
    └─ NO  → No cancel button → Doctor bắt buộc phải làm
```

---

## 🛠 **TECHNICAL REQUIREMENTS - UPDATED**

### **Backend APIs Needed:**
```typescript
// 1. Check available doctors trong cùng slot/ca
GET /api/consultations/:id/check-available-doctors
Response: {
  available: boolean,
  doctors: Doctor[],
  slotInfo: SlotInfo
}

// 2. Transfer consultation sang doctor khác
POST /api/consultations/:id/transfer
Body: {
  newDoctorId: string,
  reason: string
}

// 3. Enhanced cancel với different logic
POST /api/appointments/:id/cancel-by-doctor    // 72h rule
POST /api/consultations/:id/transfer           // No time limit
```

### **Frontend Components Needed:**
```typescript
// 1. TransferConsultationModal.tsx
// 2. Enhanced AppointmentManagement với dual logic
// 3. DynamicCancelButton component
// 4. AvailabilityChecker hook
```

---

## ✅ **IMPLEMENTATION SUMMARY - UPDATED**

### **Current Status:**
- ✅ **Appointment Cancel Logic:** FULLY IMPLEMENTED với 72h rule
- ❌ **Consultation Transfer Logic:** CHƯA IMPLEMENTED
- ✅ **Auto-confirm Workflow:** COMPLETED
- ✅ **Status Management:** COMPLETED (4 states)

### **Next Steps:**
1. 🎯 **Priority 1:** Implement consultation transfer logic
2. 🎯 **Priority 2:** Create TransferConsultationModal
3. 🎯 **Priority 3:** Integrate availability checking API
4. 🎯 **Priority 4:** Testing both workflows

**Last Updated:** 2025-01-25 (Logic Analysis Updated)  
**Next Review:** After consultation transfer implementation  
**Responsible:** Development Team 