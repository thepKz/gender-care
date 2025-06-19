# BACKEND AUTO ASSIGNMENT & CANCEL LOGIC

## Ngữ cảnh
Document này chi tiết hoá logic Backend cho việc auto assignment doctor và workflow hủy lịch hẹn phức tạp.

**Ngày tạo:** 2025-01-25  
**Trạng thái:** 📋 Planning Phase  
**Scope:** Backend Services & Controllers  

---

## ✨ **STATUS LOGIC ĐỀ XUẤT**

### 🎯 **Status Design Philosophy:**
- ❌ **Loại bỏ:** `pending`, `paid`, `confirmed` (redundant steps)
- ✅ **Đơn giản hoá:** 4 core states cho Appointments, 5 cho Consultations
- ✅ **Auto-confirm:** Payment success → immediately `scheduled`

### 📊 **Status Enum Đề Xuất:**

```typescript
// ✅ APPOINTMENTS STATUS (4 states)
type AppointmentStatus = 
  | 'pending_payment'  // Chờ thanh toán
  | 'scheduled'        // Đã thanh toán, sẵn sàng thực hiện
  | 'completed'        // Đã hoàn thành  
  | 'cancelled'        // Hủy bỏ

// ✅ CONSULTATIONS STATUS (5 states - includes 'consulting')  
type ConsultationStatus =
  | 'pending_payment'  // Chờ thanh toán
  | 'scheduled'        // Đã thanh toán, sẵn sàng tư vấn
  | 'consulting'       // Đang trong session tư vấn trực tuyến
  | 'completed'        // Đã hoàn thành tư vấn
  | 'cancelled'        // Hủy bỏ
```

### 🔄 **Workflow Logic:**

```
📅 CUSTOMER BOOKS APPOINTMENT
    ↓
⏳ Status: 'pending_payment' 
    ↓
💳 PAYMENT SUCCESS → Status: 'scheduled' (bỏ qua doctor confirm)
    ↓
🏥 APPOINTMENT EXECUTION → Status: 'completed'
```

---

## AUTO ASSIGNMENT LOGIC - CHI TIẾT

### 🎯 **Thuật toán Auto Assignment Mới**

#### **Bước 1: Tìm Slot Gần Nhất**
```typescript
// Function: findNearestAvailableTimeSlots()
// Input: currentDate
// Output: Array of time slots sorted by proximity
[
  {
    date: "2025-01-26",
    slotTime: "08:00-09:00",
    availableDoctors: [...]
  },
  {
    date: "2025-01-26", 
    slotTime: "09:00-10:00",
    availableDoctors: [...]
  },
  ...
]
```

#### **Bước 2: Tạo Doctor Priority Filter**
```typescript
// Function: createDoctorPriorityFilter()
// Input: doctors[]
// Output: Array of {doctorId, bookedSlotCount} sorted ascending

interface DoctorPriority {
  doctorId: string;
  doctorName: string;
  bookedSlotCount: number;
  availableInSlot: boolean;
}

// Example output:
[
  { doctorId: "dr001", doctorName: "BS A", bookedSlotCount: 2 },
  { doctorId: "dr002", doctorName: "BS B", bookedSlotCount: 3 },
  { doctorId: "dr003", doctorName: "BS C", bookedSlotCount: 5 },
]
```

#### **Bước 3: Smart Assignment với Priority**
```typescript
// Function: smartAssignWithPriority()
// Logic:
1. Lấy slot gần nhất
2. Tìm doctors available trong slot đó
3. Sắp xếp doctors theo bookedSlotCount (ascending)
4. Assign cho doctor có priority cao nhất (ít slot nhất)
5. Nếu slot đầy → chuyển sang slot tiếp theo
6. Repeat cho đến khi tìm được assignment hoặc hết slot
```

### 🔧 **Implementation Details**

#### **Core Function: intelligentAutoAssignment()**
```typescript
export const intelligentAutoAssignment = async (): Promise<AssignmentResult> => {
  try {
    // Step 1: Get nearest time slots (sorted by date+time)
    const nearestSlots = await findNearestAvailableTimeSlots();
    
    // Step 2: Create doctor priority map (sorted by booked count)
    const doctorPriorities = await createDoctorPriorityMap();
    
    // Step 3: Iterate through slots to find optimal assignment
    for (const slot of nearestSlots) {
      const assignment = await tryAssignInSlot(slot, doctorPriorities);
      if (assignment.success) {
        return assignment;
      }
    }
    
    throw new Error('Không tìm thấy slot khả dụng');
  } catch (error) {
    console.error('❌ Intelligent auto assignment failed:', error);
    throw error;
  }
};

// Helper function: tryAssignInSlot()
const tryAssignInSlot = async (
  slot: TimeSlot, 
  doctorPriorities: DoctorPriority[]
): Promise<AssignmentResult> => {
  
  // Filter doctors available in this specific slot
  const availableDoctors = doctorPriorities.filter(doctor => 
    slot.availableDoctors.some(d => d.doctorId === doctor.doctorId)
  );
  
  if (availableDoctors.length === 0) {
    return { success: false, reason: 'No doctors available in slot' };
  }
  
  // Sort by bookedSlotCount (ascending) - priority cho doctor ít việc nhất
  const sortedDoctors = availableDoctors.sort((a, b) => 
    a.bookedSlotCount - b.bookedSlotCount
  );
  
  // Assign to highest priority doctor (lowest booked count)
  const selectedDoctor = sortedDoctors[0];
  
  return {
    success: true,
    doctorId: selectedDoctor.doctorId,
    doctorName: selectedDoctor.doctorName,
    appointmentDate: slot.date,
    appointmentSlot: slot.slotTime,
    slotId: slot.slotId,
    priority: selectedDoctor.bookedSlotCount
  };
};
```

---

## STATUS MANAGEMENT - SỬA LẠI

### 🔄 **Status Update Logic:**

#### **Payment Success Flow:**
```typescript
// ✅ SỬA updatePaymentStatus() 
export const updatePaymentStatus = async (id: string, paymentSuccess: boolean) => {
  try {
    if (paymentSuccess) {
      // Chuyển từ 'pending_payment' → 'scheduled' (bỏ qua doctor confirm)
      const updatedRecord = await updateBothTables(id, {
        status: 'scheduled'
      });
      
      console.log(`✅ Payment confirmed for ${id} - Status: scheduled`);
      return updatedRecord;
    } else {
      // Payment failed
      return { status: 'cancelled' };
    }
  } catch (error) {
    console.error('❌ Payment status update failed:', error);
    throw error;
  }
};
```

---

## CANCEL LOGIC - KHÁC NHAU THEO LOẠI DỊCH VỤ

### 📋 **CANCELLATION RULES SUMMARY:**

#### **🏥 APPOINTMENTS (Lịch hẹn khám bệnh):**
- ✅ **Doctor cancel rule:** 72h rule - chỉ cancel được TRƯỚC 72 giờ
- ✅ **Status requirement:** Chỉ cancel được khi status = `scheduled` hoặc `consulting`
- ✅ **Outcome:** Cancel hoàn toàn, không auto re-assign

#### **💬 CONSULTATIONS (Tư vấn trực tuyến):**
- ✅ **Doctor cancel rule:** KHÔNG có 72h rule - doctor có thể cancel bất kỳ lúc nào
- ✅ **Status requirement:** Cancel được từ `pending_payment`, `scheduled`, `consulting`
- ✅ **KHÔNG cancel được:** `completed`, `cancelled`
- ✅ **Outcome:** TỰ ĐỘNG re-assign bác sĩ khác cho bệnh nhân

---

### 🚫 **UPDATED: Appointment Cancel Logic (72h Rule)**

#### **Function: cancelAppointmentByDoctor() - ✅ LOGIC CONFIRMED**
```typescript
export const cancelAppointmentByDoctor = async (
  appointmentId: string, 
  doctorId: string,
  reason: string
): Promise<CancelResult> => {
  try {
    // Step 1: Validate 72h rule
    const appointment = await Appointments.findById(appointmentId);
    const canCancel = validateCancelDeadline(appointment.appointmentDate, appointment.appointmentTime);
    
    if (!canCancel) {
      throw new Error('Không thể hủy lịch hẹn dưới 72 tiếng trước giờ hẹn');
    }
    
    // Step 2: Set current slot to ABSENT
    await setSlotStatus(doctorId, appointment.slotId, 'Absent');
    
    // Step 3: Cancel appointment completely (no customer choice for simplicity)
    await Appointments.findByIdAndUpdate(appointmentId, {
      status: 'cancelled',
      doctorCancelReason: reason,
      cancelledAt: new Date(),
      cancelledByDoctor: true
    });
    
    return {
      success: true,
      message: 'Lịch hẹn đã được hủy thành công.',
      cancelled: true
    };
    
  } catch (error) {
    console.error('❌ Appointment cancellation failed:', error);
    throw error;
  }
};

// Helper: Validate 72h rule
const validateCancelDeadline = (appointmentDate: string, appointmentTime: string): boolean => {
  const now = new Date();
  const appointmentDateTime = new Date(`${appointmentDate} ${appointmentTime}`);
  const deadline = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // +72h
  
  return deadline <= appointmentDateTime;
};
```

### 🩺 **UPDATED: Consultation Transfer Logic (New Requirement)**

#### **Function: transferConsultationByDoctor() - ❌ NEEDS NEW IMPLEMENTATION**
```typescript
export const cancelConsultationByDoctor = async (
  consultationId: string,
  doctorId: string, 
  reason: string
): Promise<CancelResult> => {
  try {
    const consultation = await DoctorQA.findById(consultationId);
    
    // Step 1: Set current slot to ABSENT
    await setSlotStatus(doctorId, consultation.slotId, 'Absent');
    
    // Step 2: Auto re-assign immediately (no customer choice)
    const newAssignment = await intelligentAutoAssignment();
    
    // Step 3: Update consultation with new assignment
    await DoctorQA.findByIdAndUpdate(consultationId, {
      doctorId: newAssignment.doctorId,
      appointmentDate: newAssignment.appointmentDate,
      appointmentSlot: newAssignment.appointmentSlot,
      slotId: newAssignment.slotId,
      status: 'scheduled', // Keep scheduled
      reassignedAt: new Date(),
      reassignReason: reason
    });
    
    // Step 4: Book new slot
    await setSlotStatus(newAssignment.doctorId, newAssignment.slotId, 'Booked');
    
    // Step 5: Notify customer about the change
    await sendReassignmentNotification(consultation.userId, newAssignment);
    
    return {
      success: true,
      message: 'Tư vấn đã được chuyển cho bác sĩ khác',
      newAssignment
    };
    
  } catch (error) {
    console.error('❌ Consultation cancellation failed:', error);
    throw error;
  }
};
```

---

## SLOT MANAGEMENT - ABSENT STATUS

### 🎰 **Slot Status Management**

#### **Slot Status Types:**
```typescript
type SlotStatus = 'Free' | 'Booked' | 'Absent';

// 'Free' - Available for booking
// 'Booked' - Booked by customer  
// 'Absent' - Doctor cancelled/unavailable (audit trail)
```

#### **Function: setSlotStatus()**
```typescript
export const setSlotStatus = async (
  doctorId: string, 
  slotId: string, 
  newStatus: SlotStatus,
  metadata?: any
) => {
  try {
    const updateData: any = {
      'weekSchedule.$.slots.$[slot].status': newStatus,
      'weekSchedule.$.slots.$[slot].lastUpdated': new Date()
    };
    
    // Add metadata for audit trail
    if (metadata) {
      updateData['weekSchedule.$.slots.$[slot].metadata'] = metadata;
    }
    
    // Special handling for different statuses
    if (newStatus === 'Booked') {
      updateData['weekSchedule.$.slots.$[slot].bookedAt'] = new Date();
    } else if (newStatus === 'Absent') {
      updateData['weekSchedule.$.slots.$[slot].absentAt'] = new Date();
      updateData['weekSchedule.$.slots.$[slot].absentReason'] = metadata?.reason || 'Doctor cancelled';
    } else if (newStatus === 'Free') {
      // Clear booking/absent metadata
      updateData['$unset'] = {
        'weekSchedule.$.slots.$[slot].bookedAt': 1,
        'weekSchedule.$.slots.$[slot].absentAt': 1,
        'weekSchedule.$.slots.$[slot].absentReason': 1,
        'weekSchedule.$.slots.$[slot].metadata': 1
      };
    }
    
    const result = await DoctorSchedules.updateOne(
      { 
        doctorId: new mongoose.Types.ObjectId(doctorId),
        'weekSchedule.slots._id': new mongoose.Types.ObjectId(slotId)
      },
      updateData,
      {
        arrayFilters: [
          { 'slot._id': new mongoose.Types.ObjectId(slotId) }
        ]
      }
    );
    
    console.log(`✅ Slot ${slotId} status updated to ${newStatus}`);
    return result;
    
  } catch (error) {
    console.error('❌ Slot status update failed:', error);
    throw error;
  }
};
```

---

## API ENDPOINTS REQUIRED

### 🛠 **New Controller Functions**

#### **Auto Assignment Endpoints:**
```typescript
// POST /api/appointments/auto-assign
export const triggerAutoAssignment = async (req: Request, res: Response) => {
  const assignment = await intelligentAutoAssignment();
  res.json({ success: true, assignment });
};

// GET /api/doctors/priority-list
export const getDoctorPriorityList = async (req: Request, res: Response) => {
  const priorities = await createDoctorPriorityMap();
  res.json({ success: true, data: priorities });
};
```

#### **Cancel Management Endpoints:**
```typescript
// POST /api/appointments/:id/cancel-by-doctor  
export const cancelAppointmentByDoctorEndpoint = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const doctorId = req.user.doctorId; // from auth middleware
  
  const result = await cancelAppointmentByDoctor(id, doctorId, reason);
  res.json(result);
};

// POST /api/consultations/:id/cancel-by-doctor
export const cancelConsultationByDoctorEndpoint = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const doctorId = req.user.doctorId;
  
  const result = await cancelConsultationByDoctor(id, doctorId, reason);
  res.json(result);
};

// POST /api/customer-choice/:id/respond
export const respondToCustomerChoice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { choice } = req.body; // 'choose_new_doctor' | 'cancel_appointment'
  
  const result = await handleCustomerChoice(id, choice);
  res.json(result);
};
```

---

## DATABASE SCHEMA UPDATES

### 🗄️ **Required Schema Changes**

#### **CustomerChoice Model (New):**
```typescript
const CustomerChoiceSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointments', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  doctorCancelReason: { type: String, required: true },
  customerChoice: { 
    type: String, 
    enum: ['choose_new_doctor', 'cancel_appointment'],
    default: null 
  },
  chosenAt: { type: Date, default: null },
  status: { 
    type: String, 
    enum: ['pending', 'completed'], 
    default: 'pending' 
  }
}, { timestamps: true });
```

#### **Appointments Schema Updates:**
```typescript
// Add new fields to existing Appointments model:
{
  autoConfirmed: { type: Boolean, default: false },
  confirmedAt: { type: Date },
  reassignedAt: { type: Date },
  doctorCancelReason: { type: String },
  customerChoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerChoice' }
}
```

#### **DoctorSchedules Slot Updates:**
```typescript
// Update TimeSlots schema:
{
  slotTime: String,
  status: { 
    type: String, 
    enum: ['Free', 'Booked', 'Absent'], 
    default: 'Free' 
  },
  bookedAt: Date,
  absentAt: Date,
  absentReason: String,
  lastUpdated: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed // For audit trail
}
```

---

## TESTING STRATEGY

### 🧪 **Test Cases Required**

#### **Auto Assignment Tests:**
```typescript
describe('Intelligent Auto Assignment', () => {
  test('Should assign to doctor with least booked slots', async () => {
    // Setup: 3 doctors with different booked counts
    // Expected: Choose doctor with lowest count
  });
  
  test('Should move to next slot if current slot is full', async () => {
    // Setup: First slot full, second slot available
    // Expected: Assign in second slot
  });
});
```

#### **Cancel Logic Tests:**
```typescript
describe('Appointment Cancellation', () => {
  test('Should allow cancel >72h before appointment', async () => {
    // Expected: Success with customer choice creation
  });
  
  test('Should reject cancel <72h before appointment', async () => {
    // Expected: Throw validation error
  });
});
```

---

## TIMELINE & MILESTONES

### 📅 **Implementation Schedule**

#### **Week 1: Core Auto Assignment**
- [x] Frontend workflow updates (COMPLETED)
- [ ] intelligentAutoAssignment() function
- [ ] createDoctorPriorityMap() function  
- [ ] updatePaymentStatus() enhancement

#### **Week 2: Cancel Logic**
- [ ] cancelAppointmentByDoctor() with customer choice
- [ ] cancelConsultationByDoctor() with auto reassign
- [ ] setSlotStatus() with Absent support
- [ ] CustomerChoice model & endpoints

#### **Week 3: Integration & Testing**
- [ ] API endpoints setup
- [ ] Notification system
- [ ] Database migration
- [ ] Unit & integration tests

---

**Created by:** Backend Development Team  
**Last Updated:** 2025-01-25  
**Status:** 📋 Ready for Implementation  
**Dependencies:** Frontend workflow completed ✅ 