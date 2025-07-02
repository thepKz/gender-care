# DOCTOR QA SYSTEM - COMPLETE SPECIFICATION
**Tài liệu tổng hợp hoàn chỉnh cho hệ thống tư vấn trực tuyến**

---

## 📋 1. TỔNG QUAN HỆ THỐNG

### 🎯 Mục tiêu chính
Nâng cấp hệ thống DoctorQA từ auto-assignment sang manual slot selection để cải thiện UX và tăng tính chính xác.

### 🔄 So sánh luồng cũ vs mới

#### ❌ Luồng cũ (hiện tại)
```
User nhập form → Auto assign doctor → Thanh toán → Tư vấn
```

#### ✅ Luồng mới (mục tiêu)
```
User nhập form (+ age/gender) → 
Chọn ngày từ calendar → 
Chọn slot khả dụng → 
Auto assign doctor theo priority → 
Review booking → 
Thanh toán → 
Tư vấn
```

### 🎯 Key Features mới
1. **Real-time slot availability checking**
2. **Priority-based doctor assignment** (workload → rating → experience)
3. **VN timezone consistency** 
4. **Smart time filtering** (current day + 1h buffer)
5. **Age/Gender fields** trong form

---

## 📝 2. YÊU CẦU THAY ĐỔI

### 2.1 Database Changes

#### DoctorQA Model Updates
```typescript
interface IDoctorQA {
  // ... existing fields
  age: number;                    // ➕ NEW: 1-120, required
  gender: 'male' | 'female';      // ➕ NEW: required
  // ... existing fields
}

const DoctorQASchema = new mongoose.Schema<IDoctorQA>({
  // ... existing fields
  age: { 
    type: Number, 
    required: true,
    min: 1,
    max: 120
  },
  gender: { 
    type: String, 
    enum: ['male', 'female'],
    required: true 
  },
  // ... existing fields
});
```

#### Migration Script cần thiết
```typescript
// Thêm default values cho records hiện tại
const result = await DoctorQA.updateMany(
  { 
    $or: [
      { age: { $exists: false } },
      { gender: { $exists: false } }
    ]
  },
  { 
    $set: { 
      age: 25,        // Default age
      gender: 'male'  // Default gender
    }
  }
);
```

### 2.2 API Changes

#### ➕ New Endpoints
```
GET  /api/doctor-qa/available-slots-for-date/:date
POST /api/doctor-qa/create-with-selected-slot
GET  /api/doctor-qa/slot-details/:date/:slotTime     // For debugging
```

#### ❌ Deprecated (nhưng giữ backward compatibility)
```
POST /api/doctor-qa/create   // Old auto-assign method
```

---

## 🔌 3. API SPECIFICATION CHI TIẾT

### 3.1 Real-time Slot Availability

#### `GET /api/doctor-qa/available-slots-for-date/:date`

**Request Example:**
```bash
GET /api/doctor-qa/available-slots-for-date/2024-12-15
# Optional: ?currentTime=14:30 (for testing)
```

**Response Success:**
```typescript
{
  success: true,
  data: {
    date: "2024-12-15",
    currentTime: "14:30",        // VN timezone
    nextAvailableFrom: "15:00",  // currentHour + 1h buffer
    isToday: true,
    totalSlotsInDay: 8,
    availableSlots: [
      {
        slotTime: "15:00-16:00",
        slotId: "675a1b2c3d4e5f6789abcdef",
        availableDoctorCount: 2,   // Số doctors available
        totalDoctors: 3,           // Tổng doctors có schedule
        isBookable: true,
        doctorIds: ["675a1b2c3d4e5f6789abcde1", "675a1b2c3d4e5f6789abcde2"]
      },
      // ... more slots
    ]
  },
  message: "Found 2 available slots for 2024-12-15"
}
```

**Error Cases:**
```typescript
// 400 - Invalid date format
{
  success: false,
  message: "Invalid date format. Use YYYY-MM-DD",
  code: "INVALID_DATE_FORMAT"
}

// 400 - Past date
{
  success: false,
  message: "Cannot check availability for past dates", 
  code: "PAST_DATE_NOT_ALLOWED"
}

// 404 - No slots
{
  success: false,
  message: "No available slots found for this date",
  code: "NO_SLOTS_AVAILABLE"
}
```

### 3.2 Priority-based Assignment

#### `POST /api/doctor-qa/create-with-selected-slot`

**Request Body:**
```typescript
{
  userData: {
    fullName: "Nguyễn Văn A",      // required
    phone: "0901234567",           // required, VN format
    age: 25,                       // required, 1-120
    gender: "male",                // required, "male" | "female"
    question: "Câu hỏi tư vấn...", // required, min 10 chars
    notes: "Ghi chú thêm"          // optional
  },
  selectedDate: "2024-12-15",     // required, YYYY-MM-DD
  selectedSlot: "15:00-16:00",    // required, HH:mm-HH:mm
  userId: "675a1b2c3d4e5f6789abcde9" // required
}
```

**Response Success:**
```typescript
{
  success: true,
  data: {
    qaId: "675a1b2c3d4e5f6789abcdef",
    assignedDoctor: {
      doctorId: "675a1b2c3d4e5f6789abcde1",
      doctorName: "BS. Nguyễn Thị B",
      specialization: "Sản phụ khoa",
      rating: 4.8
    },
    appointmentDetails: {
      date: "2024-12-15",
      slot: "15:00-16:00",
      slotId: "675a1b2c3d4e5f6789abcdef",
      status: "pending_payment"
    },
    serviceInfo: {
      serviceName: "Tư vấn online",
      price: 200000
    },
    consultationInfo: { /* Full DoctorQA object */ }
  },
  message: "Consultation scheduled successfully"
}
```

**Error Cases:**
```typescript
// 409 - Slot race condition
{
  success: false,
  message: "Selected slot is no longer available",
  code: "SLOT_NO_LONGER_AVAILABLE"
}

// 500 - Assignment failed
{
  success: false,
  message: "Failed to assign doctor to selected slot",
  code: "ASSIGNMENT_FAILED",
  data: {
    reason: "All doctors in slot became unavailable"
  }
}
```

---

## 🛠️ 4. BACKEND IMPLEMENTATION

### 4.1 Service Layer - Core Functions

#### Function 1: getAvailableSlotsForDate()
```typescript
export const getAvailableSlotsForDate = async (
  date: string, 
  currentTimeOverride?: string
): Promise<SlotAvailability[]> => {
  try {
    // 🕐 TIMEZONE: Parse date với VN timezone
    const targetDate = createVietnamDate(date);
    const now = new Date();
    const vnNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    
    const isToday = targetDate.toDateString() === vnNow.toDateString();
    let nextAvailableHour = 0;
    
    if (isToday) {
      const currentHour = currentTimeOverride 
        ? parseInt(currentTimeOverride.split(':')[0]) 
        : vnNow.getHours();
      nextAvailableHour = currentHour + 1; // +1h buffer
    }
    
    // 📅 Sử dụng existing doctorScheduleService
    const availableDoctors = await getAvailableDoctors(date, undefined, false);
    
    // 🎯 Group theo slot time với filtering
    const slotMap = new Map<string, SlotAvailability>();
    
    for (const doctor of availableDoctors) {
      for (const slot of doctor.availableSlots) {
        const slotHour = parseInt(slot.slotTime.split(':')[0]);
        
        // Skip slots quá khứ nếu là hôm nay
        if (isToday && slotHour < nextAvailableHour) {
          continue;
        }
        
        if (!slotMap.has(slot.slotTime)) {
          slotMap.set(slot.slotTime, {
            slotTime: slot.slotTime,
            slotId: slot.slotId,
            availableDoctorCount: 0,
            totalDoctors: 0,
            isBookable: false,
            doctorIds: []
          });
        }
        
        const slotData = slotMap.get(slot.slotTime)!;
        slotData.availableDoctorCount++;
        slotData.totalDoctors++;
        slotData.doctorIds.push(doctor.doctorId);
        slotData.isBookable = slotData.availableDoctorCount > 0;
      }
    }
    
    // Return chỉ bookable slots, sorted by time
    return Array.from(slotMap.values())
      .filter(slot => slot.isBookable)
      .sort((a, b) => a.slotTime.localeCompare(b.slotTime));
      
  } catch (error: any) {
    console.error('❌ [getAvailableSlotsForDate] Error:', error);
    throw error;
  }
};

interface SlotAvailability {
  slotTime: string;             // "15:00-16:00"
  slotId: string;               // MongoDB ObjectId
  availableDoctorCount: number; // Số doctors available
  totalDoctors: number;         // Tổng số doctors có schedule
  isBookable: boolean;          // availableDoctorCount > 0
  doctorIds: string[];          // Array of available doctor IDs
}
```

#### Function 2: getPriorityDoctorsForSlot()
```typescript
export const getPriorityDoctorsForSlot = async (
  date: string, 
  slotTime: string
): Promise<Doctor[]> => {
  try {
    // Lấy available doctors cho slot cụ thể
    const availableDoctors = await getAvailableDoctors(date, slotTime, false);
    
    if (availableDoctors.length === 0) {
      throw new Error('No doctors available for this slot');
    }
    
    // 📊 Get workload statistics for each doctor
    const doctorsWithStats = await Promise.all(
      availableDoctors.map(async (doctor) => {
        const stats = await getDoctorStatistics(doctor.doctorId);
        
        return {
          ...doctor,
          workload: stats.totalBookedSlots || 0,
        };
      })
    );
    
    // 🏆 PRIORITY SORTING: workload ASC → rating DESC → experience DESC
    const sortedDoctors = doctorsWithStats.sort((a, b) => {
      // 1. Ít workload nhất (workload ASC)
      if (a.workload !== b.workload) {
        return a.workload - b.workload;
      }
      
      // 2. Rating cao nhất (rating DESC)
      const aRating = a.doctorInfo.rating || 0;
      const bRating = b.doctorInfo.rating || 0;
      if (aRating !== bRating) {
        return bRating - aRating;
      }
      
      // 3. Experience nhiều nhất (experience DESC)
      const aExp = a.doctorInfo.experience || 0;
      const bExp = b.doctorInfo.experience || 0;
      return bExp - aExp;
    });
    
    console.log(`🏆 [Priority Doctors] Sorted ${sortedDoctors.length} doctors for ${slotTime}`);
    
    return sortedDoctors;
    
  } catch (error: any) {
    console.error('❌ [getPriorityDoctorsForSlot] Error:', error);
    throw error;
  }
};
```

#### Function 3: assignDoctorToSelectedSlot()
```typescript
export const assignDoctorToSelectedSlot = async (
  userData: any,
  selectedDate: string,
  selectedSlot: string
): Promise<any> => {
  try {
    console.log(`🎯 [Assign to Slot] Starting assignment for ${selectedDate} ${selectedSlot}`);
    
    // 1. 🔄 REAL-TIME DOUBLE-CHECK: Slot vẫn available?
    const availableSlots = await getAvailableSlotsForDate(selectedDate);
    const targetSlot = availableSlots.find(slot => slot.slotTime === selectedSlot);
    
    if (!targetSlot || !targetSlot.isBookable) {
      throw new Error('Selected slot is no longer available');
    }
    
    // 2. 🏆 GET PRIORITY DOCTORS cho slot này
    const priorityDoctors = await getPriorityDoctorsForSlot(selectedDate, selectedSlot);
    
    if (priorityDoctors.length === 0) {
      throw new Error('No doctors available for selected slot');
    }
    
    // 3. 🔄 ATTEMPT ASSIGNMENT theo thứ tự priority
    let assignedDoctor = null;
    let assignedSlotId = null;
    
    for (const doctor of priorityDoctors) {
      try {
        console.log(`🔄 [Assignment] Trying doctor: ${doctor.doctorInfo.fullName}`);
        
        // Tìm slotId của doctor này trong slot time đó
        const doctorSlot = doctor.availableSlots.find(slot => 
          slot.slotTime === selectedSlot
        );
        
        if (!doctorSlot) {
          console.log(`⚠️ [Assignment] Doctor ${doctor.doctorInfo.fullName} no longer has slot ${selectedSlot}`);
          continue;
        }
        
        // 🔒 TRY LOCK SLOT (từ doctorScheduleService)
        const lockSuccess = await lockSlot(doctorSlot.slotId);
        
        if (lockSuccess) {
          assignedDoctor = doctor;
          assignedSlotId = doctorSlot.slotId;
          console.log(`✅ [Assignment] Successfully assigned to ${doctor.doctorInfo.fullName}`);
          break;
        }
        
      } catch (error: any) {
        console.log(`❌ [Assignment] Failed for ${doctor.doctorInfo.fullName}: ${error.message}`);
        continue; // Try next doctor
      }
    }
    
    if (!assignedDoctor) {
      throw new Error(`Assignment failed: All doctors became unavailable`);
    }
    
    // 4. 💰 GET SERVICE INFO
    const Service = require('../models/Service').default;
    const consultationService = await Service.findOne({
      serviceName: { $regex: /tư vấn.*online/i },
      serviceType: 'consultation',
      isDeleted: { $ne: true }
    });
    
    if (!consultationService) {
      // Rollback slot lock nếu không tìm thấy service
      await releaseSlot(assignedSlotId);
      throw new Error('Consultation service not found in system');
    }
    
    // 5. 📝 CREATE DOCTOR QA
    const newQA = await DoctorQA.create({
      userId: userData.userId,
      fullName: userData.fullName,
      phone: userData.phone,
      age: userData.age,           // ➕ NEW FIELD
      gender: userData.gender,     // ➕ NEW FIELD
      question: userData.question,
      notes: userData.notes,
      status: 'pending_payment',
      consultationFee: consultationService.price,
      serviceId: consultationService._id,
      serviceName: consultationService.serviceName,
      doctorId: new mongoose.Types.ObjectId(assignedDoctor.doctorId),
      appointmentDate: createVietnamDate(selectedDate),
      appointmentSlot: selectedSlot,
      slotId: assignedSlotId
    });
    
    // 6. ⏰ SET AUTO-RELEASE TIMEOUT (15 phút)
    setTimeout(async () => {
      try {
        const qa = await DoctorQA.findById(newQA._id);
        if (qa && qa.status === 'pending_payment') {
          await releaseSlot(assignedSlotId);
          await DoctorQA.findByIdAndUpdate(newQA._id, { status: 'cancelled' });
          console.log(`⏰ [TIMEOUT] Auto-cancelled QA ${newQA._id} after 15 minutes`);
        }
      } catch (timeoutError) {
        console.error('❌ [TIMEOUT] Error in auto-release:', timeoutError);
      }
    }, 15 * 60 * 1000); // 15 phút
    
    // 7. 📋 POPULATE & RETURN
    const populatedQA = await DoctorQA.findById(newQA._id)
      .populate({
        path: 'doctorId',
        select: 'userId bio specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .populate('userId', 'fullName email')
      .populate('serviceId', 'serviceName price description serviceType');
    
    console.log(`✅ [Assignment Complete] QA ${newQA._id} assigned to ${assignedDoctor.doctorInfo.fullName}`);
    
    return {
      qa: populatedQA,
      assignedDoctor: {
        doctorId: assignedDoctor.doctorId,
        doctorName: assignedDoctor.doctorInfo.fullName,
        specialization: assignedDoctor.doctorInfo.specialization,
        rating: assignedDoctor.doctorInfo.rating
      },
      service: consultationService
    };
    
  } catch (error: any) {
    console.error('❌ [assignDoctorToSelectedSlot] Error:', error);
    throw error;
  }
};
```

### 4.2 Controller Implementation

```typescript
// ➕ NEW: Get available slots for date
export const getAvailableSlotsForDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { currentTime } = req.query;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT'
      });
    }
    
    // Validate không phải quá khứ
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (targetDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check availability for past dates',
        code: 'PAST_DATE_NOT_ALLOWED'
      });
    }
    
    const availableSlots = await getAvailableSlotsForDate(
      date, 
      currentTime as string
    );
    
    if (availableSlots.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No available slots found for this date',
        code: 'NO_SLOTS_AVAILABLE'
      });
    }
    
    // Prepare response data
    const now = new Date();
    const vnNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const isToday = targetDate.toDateString() === vnNow.toDateString();
    
    const responseData = {
      date,
      currentTime: vnNow.toTimeString().slice(0, 5), // "HH:mm"
      currentTimeISO: vnNow.toISOString(),
      nextAvailableFrom: isToday 
        ? `${String(vnNow.getHours() + 1).padStart(2, '0')}:00`
        : "07:00",
      isToday,
      totalSlotsInDay: 8, // Standard slots
      availableSlots
    };
    
    res.status(200).json({
      success: true,
      data: responseData,
      message: `Found ${availableSlots.length} available slots for ${date}`
    });
    
  } catch (error: any) {
    console.error('❌ [getAvailableSlotsForDate] Controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// ➕ NEW: Create QA with selected slot
export const createQAWithSelectedSlot = async (req: Request, res: Response) => {
  try {
    const { userData, selectedDate, selectedSlot, userId } = req.body;
    
    // Validation
    if (!userData || !selectedDate || !selectedSlot || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userData, selectedDate, selectedSlot, userId',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    // Validate userData fields
    const requiredFields = ['fullName', 'phone', 'age', 'gender', 'question'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: userData.${field}`,
          code: 'MISSING_USER_DATA_FIELD'
        });
      }
    }
    
    // Validate age
    if (userData.age < 1 || userData.age > 120) {
      return res.status(400).json({
        success: false,
        message: 'Age must be between 1 and 120',
        code: 'INVALID_AGE'
      });
    }
    
    // Validate gender
    if (!['male', 'female'].includes(userData.gender)) {
      return res.status(400).json({
        success: false,
        message: 'Gender must be either "male" or "female"',
        code: 'INVALID_GENDER'
      });
    }
    
    // Add userId to userData
    const completeUserData = { ...userData, userId };
    
    // 🎯 ASSIGN TO SELECTED SLOT
    const assignmentResult = await assignDoctorToSelectedSlot(
      completeUserData,
      selectedDate,
      selectedSlot
    );
    
    res.status(201).json({
      success: true,
      data: {
        qaId: assignmentResult.qa._id,
        assignedDoctor: assignmentResult.assignedDoctor,
        appointmentDetails: {
          date: selectedDate,
          slot: selectedSlot,
          slotId: assignmentResult.qa.slotId,
          status: assignmentResult.qa.status
        },
        serviceInfo: {
          serviceName: assignmentResult.service.serviceName,
          price: assignmentResult.service.price
        },
        consultationInfo: assignmentResult.qa
      },
      message: 'Consultation scheduled successfully'
    });
    
  } catch (error: any) {
    console.error('❌ [createQAWithSelectedSlot] Controller error:', error);
    
    // Handle specific error cases
    if (error.message.includes('no longer available')) {
      return res.status(409).json({
        success: false,
        message: 'Selected slot is no longer available',
        code: 'SLOT_NO_LONGER_AVAILABLE'
      });
    }
    
    if (error.message.includes('Assignment failed')) {
      return res.status(500).json({
        success: false,
        message: 'Failed to assign doctor to selected slot',
        code: 'ASSIGNMENT_FAILED',
        data: {
          reason: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};
```

### 4.3 Routes Configuration

```typescript
// Backend/src/routes/doctorQARoutes.ts

// ➕ NEW ROUTES
router.get('/available-slots-for-date/:date', getAvailableSlotsForDate);
router.post('/create-with-selected-slot', createQAWithSelectedSlot);

// ❌ DEPRECATED (keep for backward compatibility)
router.post('/create', createDoctorQA); // Old auto-assign method
```

---

## 🎨 5. FRONTEND IMPLEMENTATION

### 5.1 API Client Updates

```typescript
// Frontend/src/api/endpoints/consultation.ts

export const consultationApi = {
  // ... existing APIs
  
  // ➕ NEW: Get slots cho ngày
  getAvailableSlotsForDate: (date: string) => 
    axiosConfig.get(`/doctor-qa/available-slots-for-date/${date}`),
  
  // ➕ NEW: Create với slot đã chọn
  createQAWithSelectedSlot: (data: any) => 
    axiosConfig.post('/doctor-qa/create-with-selected-slot', data),
};
```

### 5.2 Frontend Components

#### Simple Calendar Component
```typescript
// Frontend/src/components/ui/SimpleCalendar.tsx
const SimpleCalendar = ({ onDateSelect }: { onDateSelect: (date: string) => void }) => {
  const isDateDisabled = (date: Date) => {
    return date < new Date(); // Chỉ disable quá khứ
  };
  
  // NO API call ở calendar level, chỉ date picker đơn giản
  // Khi chọn date → onDateSelect(dateString) → parent component fetch slots
};
```

#### Real-time Slot Selector
```typescript
// Frontend/src/components/ui/SlotSelector.tsx
const SlotSelector = ({ 
  selectedDate, 
  onSlotSelect 
}: { 
  selectedDate: string; 
  onSlotSelect: (slot: SlotInfo) => void 
}) => {
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      consultationApi.getAvailableSlotsForDate(selectedDate)
        .then(res => {
          setSlots(res.data.data.availableSlots);
        })
        .catch(err => {
          console.error('Error loading slots:', err);
          setSlots([]);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedDate]);
  
  // Render slots grid: 2x4 hoặc 1x8 layout
  // Chỉ hiện slots available (isBookable: true)
  // Click slot → onSlotSelect(slot)
};

interface SlotInfo {
  slotTime: string;             // "15:00-16:00"
  slotId: string;               
  availableDoctorCount: number; // Show "X bác sĩ có thể"
  isBookable: boolean;
}
```

#### Updated Main Form
```typescript
// Frontend/src/pages/online-consultation/index.tsx
const ConsultationForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '', 
    phone: '', 
    age: '',                    // ➕ NEW FIELD
    gender: '',                 // ➕ NEW FIELD
    question: '', 
    notes: '',
    selectedDate: '',           // ➕ NEW FIELD
    selectedSlot: ''            // ➕ NEW FIELD
  });
  
  // Step 1: Basic info (với age, gender validation)
  // Step 2: Calendar selection (SimpleCalendar)
  // Step 3: Slot selection (SlotSelector)
  // Step 4: Review & confirm
  
  const handleSubmit = async () => {
    const result = await consultationApi.createQAWithSelectedSlot({
      userData: {
        fullName: formData.fullName,
        phone: formData.phone,
        age: parseInt(formData.age),
        gender: formData.gender,
        question: formData.question,
        notes: formData.notes
      },
      selectedDate: formData.selectedDate,
      selectedSlot: formData.selectedSlot,
      userId: currentUser.id
    });
    
    // Navigate to payment
    navigate(`/consultation/payment/${result.data.qaId}`);
  };
};
```

---

## 🧪 6. TESTING STRATEGY

### 6.1 Backend Testing

#### Unit Tests
- [ ] `getAvailableSlotsForDate()` with different dates
- [ ] Current day filtering logic (14h → only show from 15h)
- [ ] Priority sorting algorithm
- [ ] Race condition handling trong `assignDoctorToSelectedSlot()`
- [ ] Timeout mechanism (15 phút auto-release)

#### Integration Tests
- [ ] API endpoints với correct/incorrect data
- [ ] Database operations (create, update, migrate)
- [ ] doctorScheduleService integration
- [ ] VN timezone consistency

### 6.2 Frontend Testing

#### Component Tests
- [ ] SimpleCalendar disable past dates
- [ ] SlotSelector loading states
- [ ] Form validation (age 1-120, gender required)
- [ ] Multi-step navigation

#### Integration Tests
- [ ] Complete booking flow: form → calendar → slots → payment
- [ ] Error handling khi slot full/unavailable
- [ ] Mobile responsive
- [ ] Cross-browser compatibility

### 6.3 E2E Testing Scenarios

```typescript
// Test Case 1: Happy Path
1. User fills form with valid data
2. Selects future date from calendar
3. Sees available slots for that date
4. Selects an available slot
5. Reviews booking info
6. Confirms and goes to payment
7. Payment successful → consultation scheduled

// Test Case 2: Current Day Filtering
1. Current time: 14:30
2. Select today's date
3. Should only see slots from 15:00 onwards
4. Should not see 08:00-14:00 slots

// Test Case 3: Race Condition
1. Multiple users select same slot simultaneously
2. Only one should succeed
3. Others should get "slot no longer available" error
4. Should suggest alternative slots

// Test Case 4: Timeout Mechanism
1. User books slot but doesn't pay within 15 minutes
2. Slot should auto-release
3. QA status should change to 'cancelled'
4. Slot becomes available for other users
```

---

## 🚀 7. IMPLEMENTATION ROADMAP

### Phase 1: Backend Foundation (2-3 days)
```
Day 1:
- [ ] Update DoctorQA model (age, gender fields)
- [ ] Create migration script và test
- [ ] Implement getAvailableSlotsForDate() service

Day 2:
- [ ] Implement getPriorityDoctorsForSlot() service
- [ ] Implement assignDoctorToSelectedSlot() service
- [ ] Create controller actions

Day 3:
- [ ] Add routes và validation
- [ ] Test APIs với Postman
- [ ] Integration testing với doctorScheduleService
```

### Phase 2: Frontend Development (2-3 days)
```
Day 1:
- [ ] Update API endpoints trong frontend
- [ ] Create SimpleCalendar component
- [ ] Create SlotSelector component

Day 2:
- [ ] Update main consultation form
- [ ] Add age/gender validation
- [ ] Implement multi-step flow

Day 3:
- [ ] Integration testing FE-BE
- [ ] Error handling implementation
- [ ] Mobile responsive testing
```

### Phase 3: Testing & Deployment (1-2 days)
```
Day 1:
- [ ] E2E testing complete flow
- [ ] Performance testing
- [ ] Bug fixes

Day 2:
- [ ] Staging deployment
- [ ] UAT testing
- [ ] Production deployment
```

**🕐 Total Estimate: 5-8 days**

---

## ⚠️ 8. CRITICAL CONSIDERATIONS

### 🔒 Technical Risks
1. **Race Conditions**: Multiple users chọn cùng slot cùng lúc
   - **Mitigation**: Dùng `lockSlot()` từ doctorScheduleService
   - **Fallback**: Suggest alternative slots khi conflict

2. **Timezone Inconsistency**: VN timezone vs server timezone
   - **Mitigation**: Luôn dùng VN timezone cho date operations
   - **Validation**: Test với different server timezones

3. **Performance**: Real-time API calls có thể slow
   - **Mitigation**: Optimize queries, add caching nếu cần
   - **Monitoring**: Track API response times

4. **Backward Compatibility**: Existing flow vẫn phải hoạt động
   - **Mitigation**: Giữ old endpoints, add new endpoints
   - **Testing**: Verify old flow không bị break

### 💡 Optimization Opportunities
1. **Caching**: Cache available slots trong 1-2 phút
2. **Real-time Updates**: WebSocket cho slot availability updates
3. **Load Balancing**: Queue system cho priority assignment
4. **Analytics**: Track user behavior trong booking flow

### 🎯 Success Metrics
- **Accuracy**: 0% slot conflicts (no double bookings)
- **Performance**: API response time < 500ms
- **UX**: Reduced booking abandonment rate
- **Reliability**: 99.9% successful assignments
- **User Satisfaction**: Higher completion rate than old flow

---

## 🎯 9. FINAL CHECKLIST

### ✅ Backend Ready
- [ ] DoctorQA model updated with age/gender
- [ ] Migration script created and tested
- [ ] All service functions implemented và tested
- [ ] API endpoints working correctly
- [ ] Error handling comprehensive
- [ ] Timezone logic verified

### ✅ Frontend Ready
- [ ] SimpleCalendar component working
- [ ] SlotSelector real-time updates
- [ ] Multi-step form flow smooth
- [ ] Age/gender validation working
- [ ] Error states handled gracefully
- [ ] Mobile responsive verified

### ✅ Integration Ready
- [ ] FE-BE integration complete
- [ ] Payment flow unchanged
- [ ] E2E scenarios pass
- [ ] Performance acceptable
- [ ] No breaking changes to existing features

### ✅ Production Ready
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Staging testing successful
- [ ] UAT signed off
- [ ] Deployment plan ready
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured

---

**📝 Summary:**
Đây là specification tổng hợp hoàn chỉnh cho việc nâng cấp hệ thống DoctorQA. Logic được sắp xếp từ overview → requirements → implementation → testing → deployment. 

**🔍 Key Points để Review:**
1. Logic flow có hợp lý không?
2. API design có đầy đủ error cases không?
3. Priority assignment algorithm có fair không?
4. Frontend UX flow có smooth không?
5. Testing coverage có đủ comprehensive không?

**👥 Next Steps:**
1. Review specification này với team
2. Identify any missing requirements hoặc edge cases
3. Estimate effort chính xác hơn
4. Start implementation theo roadmap
</rewritten_file> 