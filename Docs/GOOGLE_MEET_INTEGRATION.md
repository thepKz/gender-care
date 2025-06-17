# GOOGLE MEET INTEGRATION - CONTEXT & IMPLEMENTATION GUIDE

## Tổng quan dự án

**Mục tiêu:** Tích hợp Google Calendar và Google Meet vào hệ thống quản lý lịch làm việc của bác sĩ để tự động tạo và quản lý các cuộc tư vấn trực tuyến.

**Ngày bắt đầu:** 2025-01-24  
**Trạng thái:** Planning Phase ✅ → Ready for Coding  
**Người thực hiện:** Min Teppu (Sinh viên)  
**Estimated Time:** 3 giờ total

---

## 🎯 PROGRESS TRACKING

### Overall Progress: 0/15 (0%)
- [ ] Phase 1: Backend Integration (0/6)
- [ ] Phase 2: Frontend Integration (0/5) 
- [ ] Phase 3: Advanced Features (0/4)

### Current Task: **Phase 1 - Backend Setup**
**ETA:** 30 phút  
**Status:** Not Started

---

## I. PHÂN TÍCH HIỆN TRẠNG

### Hệ thống hiện tại:
- ✅ Model `DoctorSchedule` với slots (Free/Booked/Absent)
- ✅ Component `DoctorAdvancedCalendar` hiển thị lịch
- ✅ Model `Meeting` cơ bản với mock Google Meet links
- ✅ API endpoints quản lý lịch làm việc bác sĩ

### Vấn đề cần giải quyết:
- ❌ Không có tích hợp thực tế với Google Calendar
- ❌ Không thể tạo nhiều Google Meet links đồng thời
- ❌ Thiếu bảo mật cho meeting (waiting room, admission control)
- ❌ Không có OAuth flow cho bác sĩ kết nối Google account

---

## II. GOOGLE CREDENTIALS SETUP ✅

### Google Cloud Console Configuration:
```env
GOOGLE_CALENDAR_CLIENT_ID=954705936127-d5d96m9ffpdq3daug5sap851gen8j6tl.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=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
GOOGLE_CALENDAR_REDIRECT_URL=http://localhost:5000/auth/google/calendar/callback
GOOGLE_OAUTH_SCOPES=https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/drive.readonly

# Additional Configuration
GOOGLE_CALENDAR_ID=primary
MEETING_DEFAULT_DURATION=60
MEETING_TIMEZONE=Asia/Ho_Chi_Minh
```

### Permissions Required:
- **calendar**: Read/write access to calendar ✅
- **calendar.events**: Create/update/delete events ✅
- **drive.readonly**: Access to recorded meetings (future) ✅

---

## III. IMPLEMENTATION PHASES

### 🔧 Phase 1: Backend Google Integration (2-3 giờ)
**Mục tiêu:** Setup Google Calendar API và OAuth flow

**Tasks:**
1. [ ] Tạo GoogleCalendarService class → `Backend/src/services/googleCalendarService.ts`
2. [ ] Update Meeting model với Google fields → `Backend/src/models/Meeting.ts`
3. [ ] Tạo GoogleAuth model → `Backend/src/models/GoogleAuth.ts`
4. [ ] Implement Google auth routes → `Backend/src/routes/googleAuthRoutes.ts`
5. [ ] Test OAuth flow → Postman/Thunder Client
6. [ ] Test Google Meet creation → Integration test

### 🎨 Phase 2: Frontend Integration (1-2 giờ)
**Mục tiêu:** UI components cho Google integration

**Tasks:**
1. [ ] Tạo GoogleAuthButton component → `Frontend/src/components/ui/GoogleAuthButton.tsx`
2. [ ] Update DoctorAdvancedCalendar với Google Meet features
3. [ ] Add Google Meet join functionality
4. [ ] Handle OAuth callback redirect
5. [ ] Error handling và loading states

### ⚡ Phase 3: Advanced Features (1-2 giờ)
**Mục tiêu:** Meeting security và bulk operations

**Tasks:**
1. [ ] Meeting security settings
2. [ ] Bulk meeting creation
3. [ ] Waiting room management
4. [ ] Error handling & fallback

---

## IV. DETAILED TECHNICAL SPECIFICATIONS

### Backend Components:

#### 1. GoogleCalendarService (HIGH PRIORITY)
```typescript
// Backend/src/services/googleCalendarService.ts
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface GoogleMeetData {
  meetLink: string;
  meetId: string;
  eventId: string;
  startTime: Date;
  endTime: Date;
}

class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URL
    );
  }
  
  // Methods to implement:
  generateAuthUrl(): string
  getTokens(code: string): Promise<Credentials>
  createGoogleMeet(title, startTime, endTime, attendees, credentials): Promise<GoogleMeetData>
  refreshTokens(refreshToken: string): Promise<Credentials>
  deleteEvent(eventId: string, credentials): Promise<void>
}
```

#### 2. Enhanced Meeting Model (HIGH PRIORITY)
```typescript
// Backend/src/models/Meeting.ts - Additions
interface IMeeting extends Document {
  // ... existing fields ...
  
  // NEW Google-specific fields
  googleEventId?: string;           // Google Calendar event ID
  googleMeetId?: string;            // Google Meet conference ID
  provider: 'google' | 'jitsi';     // Meeting provider
  
  // NEW Security settings
  securitySettings: {
    waitingRoom: boolean;
    admissionControl: 'anyone' | 'invited_only';
    recordingEnabled: boolean;
    maxParticipants: number;
  };
}
```

#### 3. GoogleAuth Model (HIGH PRIORITY - NEW FILE)
```typescript
// Backend/src/models/GoogleAuth.ts
interface IGoogleAuth extends Document {
  userId: mongoose.Types.ObjectId;
  userType: 'doctor' | 'staff';
  credentials: {
    access_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expiry_date: number;
  };
  isConnected: boolean;
  lastSyncAt: Date;
}
```

### Frontend Components:

#### 1. GoogleAuthButton (HIGH PRIORITY - NEW COMPONENT)
```typescript
// Frontend/src/components/ui/GoogleAuthButton.tsx
interface GoogleAuthButtonProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  loading?: boolean;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  isConnected,
  onConnectionChange,
  loading = false
}) => {
  // Implementation here
}
```

---

## V. API ENDPOINTS DESIGN

### Google Authentication Routes (HIGH PRIORITY):
```typescript
// Backend/src/routes/googleAuthRoutes.ts
GET    /api/google-auth/connect          // Generate OAuth URL
GET    /api/google-auth/callback         // Handle OAuth callback  
POST   /api/google-auth/disconnect       // Disconnect Google account
GET    /api/google-auth/status           // Check connection status
```

### Enhanced Meeting Routes:
```typescript
POST   /api/meetings/create-google       // Create Google Meet meeting
POST   /api/meetings/create-multiple     // Bulk create meetings
PUT    /api/meetings/:id/security        // Update meeting security
GET    /api/meetings/doctor/:doctorId    // Get doctor's meetings
DELETE /api/meetings/:id/google-event    // Delete Google Calendar event
```

---

## VI. 🚀 CODING IMPLEMENTATION ORDER - START HERE

### ⭐ Bước 1: Backend Setup (30 phút) - NEXT TO DO
**Files to create/modify:**
1. `Backend/src/services/googleCalendarService.ts` (NEW)
2. `Backend/package.json` (UPDATE - add googleapis)
3. `Backend/.env` (UPDATE - add Google credentials)

**Commands to run:**
```bash
cd Backend
npm install googleapis google-auth-library
```

### Bước 2: Models Update (20 phút)
**Files to create/modify:**
1. `Backend/src/models/GoogleAuth.ts` (NEW)
2. `Backend/src/models/Meeting.ts` (UPDATE)
3. `Backend/src/models/index.ts` (UPDATE - export GoogleAuth)

### Bước 3: API Routes (30 phút)
**Files to create/modify:**
1. `Backend/src/routes/googleAuthRoutes.ts` (NEW)
2. `Backend/src/routes/index.ts` (UPDATE - import googleAuth routes)
3. `Backend/src/controllers/googleAuthController.ts` (NEW)

### Bước 4: Frontend Integration (40 phút)
**Files to create/modify:**
1. `Frontend/src/components/ui/GoogleAuthButton.tsx` (NEW)
2. `Frontend/src/pages/dashboard/doctors/DoctorSchedule.tsx` (UPDATE)
3. `Frontend/src/api/endpoints/googleAuth.ts` (NEW)

### Bước 5: Testing & Polish (60 phút)
**Testing tasks:**
1. OAuth flow testing
2. Google Meet creation testing
3. Error handling implementation

---

## VII. TESTING CHECKLIST

### Phase 1 Testing:
- [ ] OAuth URL generation works
- [ ] Token exchange successful
- [ ] Google Meet creation works
- [ ] Token refresh mechanism
- [ ] Error handling for expired tokens

### Phase 2 Testing:
- [ ] Google Auth Button renders correctly
- [ ] OAuth redirect flow works
- [ ] Meeting creation from calendar
- [ ] Google Meet join functionality
- [ ] Connection status display

### Integration Testing:
- [ ] Full OAuth flow end-to-end
- [ ] Meeting creation and database save
- [ ] Calendar sync with Google
- [ ] Error states and fallbacks

---

## VIII. ENVIRONMENT SETUP

### Backend Dependencies:
```bash
npm install googleapis google-auth-library
```

### Environment Variables:
```env
# Add to Backend/.env
GOOGLE_CALENDAR_CLIENT_ID=954705936127-d5d96m9ffpdq3daug5sap851gen8j6tl.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=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
GOOGLE_CALENDAR_REDIRECT_URL=http://localhost:5000/auth/google/calendar/callback
GOOGLE_OAUTH_SCOPES=https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events
GOOGLE_CALENDAR_ID=primary
MEETING_DEFAULT_DURATION=60
MEETING_TIMEZONE=Asia/Ho_Chi_Minh
```

---

## IX. QUICK START GUIDE

### Để bắt đầu coding ngay:
1. **Setup dependencies:** `cd Backend && npm install googleapis google-auth-library`
2. **Add environment variables** to `Backend/.env`
3. **Create GoogleCalendarService:** Start with `Backend/src/services/googleCalendarService.ts`
4. **Test OAuth URL generation** first
5. **Move to models update** after service works

### Debug Commands:
```bash
# Test Google Calendar API
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://www.googleapis.com/calendar/v3/calendars/primary/events

# Check OAuth flow  
npm run dev
# Navigate to: http://localhost:5000/api/google-auth/connect
```

---

## X. SUCCESS CRITERIA

### Phase 1 Success:
- [ ] OAuth URL generates successfully
- [ ] Can exchange authorization code for tokens
- [ ] Can create Google Calendar event with Meet link
- [ ] Tokens saved to database

### Phase 2 Success:
- [ ] Google Auth button works in UI
- [ ] OAuth flow completes and redirects properly
- [ ] Calendar shows Google Meet links
- [ ] Can join Google Meet from calendar

### Final Success:
- [ ] Doctor can connect Google account
- [ ] Can create multiple Google Meet meetings
- [ ] Calendar displays all meetings correctly
- [ ] Error handling works properly

---

**📝 Current Status:** ✅ Documentation Complete - Ready to Start Coding  
**🎯 Next Action:** Phase 1 - Create GoogleCalendarService  
**⏰ ETA to MVP:** 3 hours from start  
**🔥 Priority:** HIGH - Start immediately

---

**Last Updated:** 2025-01-24  
**Updated By:** Min Teppu  
**Status:** Ready for Implementation 🚀