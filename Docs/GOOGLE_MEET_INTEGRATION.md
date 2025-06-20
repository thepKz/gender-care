# GOOGLE MEET INTEGRATION - CONTEXT & IMPLEMENTATION GUIDE (UPDATED)

## 🎯 FLOW DIAGRAM & IMPLEMENTATION ROADMAP

### Luồng tổng quản:
```
Customer tạo DoctorQA → Staff assign Doctor → Doctor xác nhận → 
Hệ thống tự động tạo Meeting → Tạo Google Meet (hoặc Jitsi fallback) → 
Lưu vào DB → Gửi thông báo → Meeting sẵn sàng
```

### Meeting Model đã được đơn giản hóa:
- ✅ Bỏ `meetingId` (chỉ giữ `googleEventId` cho Google)
- ✅ Bỏ các thời gian phức tạp (chỉ giữ `scheduledTime` và `actualStartTime`)
- ✅ Thêm `provider: 'google' | 'jitsi'` để linh hoạt
- ✅ Thêm `participantCount` và `maxParticipants` để quản lý
- ✅ Đơn giản hóa interface cho dễ maintain

---

## 🚀 HƯỚNG ĐI IMPLEMENTATION - 3 PHASE

### PHASE 1: Backend Foundation (1.5 giờ) - ƯU TIÊN NGAY
**Mục tiêu:** Setup Google Calendar service và cấu trúc cơ bản

#### Bước 1.1: Google Service Setup (30 phút)
```bash
cd Backend
npm install googleapis google-auth-library
```

**Files cần tạo:**
1. `src/services/googleCalendarService.ts` - Core Google integration
2. `src/models/GoogleAuth.ts` - Lưu OAuth tokens của doctor
3. Cập nhật `.env` với Google credentials

#### Bước 1.2: Enhanced Meeting Controller (45 phút)
**Files cần sửa:**
1. `src/controllers/meetingController.ts` - Thêm logic tạo Google Meet
2. `src/services/meetingService.ts` - Business logic tạo meeting
3. `src/routes/meetingRoutes.ts` - API endpoints mới

#### Bước 1.3: Google Auth Flow (45 phút)
**Files cần tạo:**
1. `src/controllers/googleAuthController.ts` 
2. `src/routes/googleAuthRoutes.ts`
3. API endpoints cho OAuth flow

---

### PHASE 2: Core Integration (1 giờ) - CHỨC NĂNG CHÍNH
**Mục tiêu:** Tích hợp thực tế tạo Google Meet

#### Workflow Integration:
```typescript
// Khi Doctor xác nhận DoctorQA
1. Check doctor có GoogleAuth không?
2. Nếu có → Tạo Google Meet
3. Nếu không → Fallback Jitsi Meet
4. Lưu meeting với provider tương ứng
5. Gửi notification
```

#### API Flow:
```typescript
POST /api/meetings/create-from-qa/:qaId
{
  "preferredProvider": "google", // hoặc "jitsi"
  "scheduledTime": "2025-01-24T10:00:00Z",
  "duration": 60, // minutes
  "notes": "Tư vấn sức khỏe sinh sản"
}
```

---

### PHASE 3: Frontend Integration (45 phút) - UI/UX
**Mục tiêu:** UI cho doctor kết nối Google và join meeting

#### Components cần tạo:
1. `GoogleAuthButton` - Kết nối Google account
2. `MeetingJoinButton` - Join meeting link
3. `DoctorGoogleStatus` - Hiển thị trạng thái kết nối

---

## 📋 TECHNICAL SPECIFICATIONS - SIMPLIFIED

### 1. GoogleCalendarService (Core)
```typescript
// Backend/src/services/googleCalendarService.ts
class GoogleCalendarService {
  // Tạo Google Meet đơn giản
  async createSimpleMeet(
    title: string, 
    startTime: Date, 
    duration: number, // minutes
    attendeeEmails: string[]
  ): Promise<{ meetLink: string; eventId: string }> {
    // Implementation here
  }
  
  // Generate OAuth URL
  generateAuthUrl(doctorId: string): string {
    // Implementation here  
  }
  
  // Exchange code for tokens
  async exchangeCodeForTokens(code: string, doctorId: string): Promise<boolean> {
    // Implementation here
  }
}
```

### 2. GoogleAuth Model (Simplified)
```typescript
// Backend/src/models/GoogleAuth.ts
interface IGoogleAuth extends Document {
  doctorId: mongoose.Types.ObjectId;  // Chỉ doctor cần OAuth
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  isActive: boolean;
}
```

### 3. Meeting Service Integration
```typescript
// Backend/src/services/meetingService.ts
class MeetingService {
  async createMeetingFromQA(qaId: string, options: {
    preferredProvider?: 'google' | 'jitsi';
    scheduledTime: Date;
    duration?: number;
  }): Promise<IMeeting> {
    const qa = await DoctorQA.findById(qaId);
    const doctor = await Doctor.findById(qa.doctorId);
    
    // Check if doctor has Google Auth
    const googleAuth = await GoogleAuth.findOne({ doctorId: doctor._id, isActive: true });
    
    let meetingData;
    if (options.preferredProvider === 'google' && googleAuth) {
      // Tạo Google Meet
      meetingData = await this.createGoogleMeet(qa, options, googleAuth);
    } else {
      // Fallback to Jitsi
      meetingData = await this.createJitsiMeet(qa, options);
    }
    
    return await Meeting.create(meetingData);
  }
}
```

---

## 🔧 API ENDPOINTS - ESSENTIAL ONLY

### Google Authentication (Doctor only)
```typescript
GET    /api/google-auth/connect/:doctorId     // Generate OAuth URL  
GET    /api/google-auth/callback              // Handle OAuth callback
POST   /api/google-auth/disconnect/:doctorId  // Disconnect Google
GET    /api/google-auth/status/:doctorId      // Check connection status
```

### Meeting Management  
```typescript
POST   /api/meetings/create-from-qa/:qaId     // Tạo meeting từ QA
GET    /api/meetings/doctor/:doctorId         // Lấy meetings của doctor
PUT    /api/meetings/:meetingId/join          // Join meeting (update status)
PUT    /api/meetings/:meetingId/end           // End meeting
```

---

## 🎯 SUCCESS CRITERIA - PHASE BY PHASE

### Phase 1 Success ✅
- [ ] Google OAuth URL generation works
- [ ] Can save Google tokens to database  
- [ ] Meeting model works with new simplified structure
- [ ] API endpoints respond correctly

### Phase 2 Success ✅
- [ ] Can create Google Calendar event with Meet link
- [ ] Jitsi fallback works when Google unavailable
- [ ] Meeting created and saved to database correctly
- [ ] Integration with existing DoctorQA workflow

### Phase 3 Success ✅
- [ ] Doctor can connect Google account via UI
- [ ] Meeting join button works
- [ ] Status display shows connection state
- [ ] End-to-end flow works smoothly

---

## 📝 NEXT ACTIONS - START HERE

### 🔥 Immediate Tasks (Bắt đầu ngay):

1. **Install dependencies** (2 phút):
```bash
cd Backend
npm install googleapis google-auth-library
```

2. **Create GoogleCalendarService** (20 phút):
- File: `Backend/src/services/googleCalendarService.ts`
- Implement basic OAuth và create event methods

3. **Create GoogleAuth model** (10 phút):
- File: `Backend/src/models/GoogleAuth.ts`
- Simple schema để lưu tokens

4. **Test OAuth flow** (15 phút):
- Tạo test route để generate OAuth URL
- Test với Postman

### 🎯 Development Priority:
1. **Backend Foundation** → 2. **Core Integration** → 3. **Frontend UI**

---

## 🚨 IMPORTANT NOTES

### Đơn giản hóa thiết kế:
- **Meeting Model**: Đã simplified, bỏ các field phức tạp
- **Provider Strategy**: Google first, Jitsi fallback
- **Auth Scope**: Chỉ Doctor cần kết nối Google
- **Error Handling**: Graceful fallback to Jitsi

### Environment Variables cần thiết:
```env
GOOGLE_CALENDAR_CLIENT_ID=954705936127-d5d96m9ffpdq3daug5sap851gen8j6tl.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=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
GOOGLE_CALENDAR_REDIRECT_URL=http://localhost:5000/auth/google/calendar/callback
```

---

**📅 Updated:** 2025-01-24  
**🎯 Status:** Ready for Implementation with Simplified Flow  
**⏰ ETA:** 3 hours total, start with Phase 1