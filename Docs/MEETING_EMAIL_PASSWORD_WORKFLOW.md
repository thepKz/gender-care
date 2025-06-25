# MEETING EMAIL WORKFLOW VỚI PASSWORD BẢO MẬT - IMPLEMENTATION GUIDE

## 📋 **TỔNG QUAN DỰ ÁN**

**Mục tiêu:** Tạo luồng gửi email meeting với password bảo mật cho tính năng tư vấn trực tuyến

**Timeline:** Ước tính 2-3 ngày implementation  
**Complexity:** Medium-High  
**Dependencies:** Meeting model, Email service, Frontend consultation management

---

## 🎯 **LUỒNG NGHIỆP VỤ CHI TIẾT - FOLLOW GUIDE**

### **✅ Bước 1: Doctor tạo hồ sơ meeting**
```
Action: Doctor nhấn "Tạo hồ sơ meeting" 
Result: 
→ Backend auto-generate password 8 ký tự random (A-Z, 0-9)
→ Lưu password vào Meeting.meetingPassword (required field)
→ Meeting status = 'scheduled'
→ Hiển thị thông báo "Meeting đã được tạo với password bảo mật"
```

### **❌ Bước 2: Xóa button "Tham gia lại" ở UI ngoài**
```
Action: Tìm và xóa tất cả button "Tham gia lại" cũ
Result: 
→ Loại bỏ hoàn toàn button cũ
→ Thay thế bằng logic mới với password display
```

### **🎨 Bước 3: UI hiển thị password TO, RÕ, BÔI ĐẬM**
```
Location: Trang xem chi tiết consultation (management view)
Display: 
→ Section "Thông tin Meeting" hiển thị:
  • Meeting Link (clickable)
  • Password: [A7K9M2X5] (24px, bold, red background)
  • Button show/hide password
  • Note: "Doctor phải join meeting và setting password này trước"
```

### **👨‍⚕️ Bước 4: Doctor join meeting đầu tiên**
```
Action: Doctor nhấn "Tham gia Meeting"
Process:
→ Doctor vào Jitsi meeting room trước customer
→ Doctor setting password này trong Jitsi room security
→ participantCount update = 1 (via API hoặc manual)
→ Meeting status auto-change: 'scheduled' → 'waiting_customer'
```

### **📧 Bước 5: Hiện button gửi email cho customer**
```
Trigger: Meeting status = 'waiting_customer'
Display:
→ UI hiển thị button "📧 Gửi thư mời Meeting cho Customer"
→ Button màu primary, nổi bật
→ Hiển thị email sẽ gửi đến: customer.email
```

### **✉️ Bước 6: Gửi email với password cho customer**
```
Action: Doctor nhấn button gửi email
Process:
→ Gửi email template đẹp với:
  • Password rõ ràng (same password doctor đã setting)
  • Meeting link ĐÚNG (same room với doctor)
  • Hướng dẫn tham gia chi tiết
  • Warning về bảo mật và ghi hình
→ Thông báo "Email đã gửi thành công"
```

### **👤 Bước 7: Customer join meeting**
```
Action: Customer nhận email → Click link → Nhập password → Join meeting
Result:
→ participantCount = 2
→ Meeting status: 'waiting_customer' → 'in_progress'
→ Bắt đầu consultation
```

---

## 🔧 **CÁC THAY ĐỔI CODE CẦN THIẾT - STEP BY STEP**

### **A. BACKEND CHANGES**

#### **A1. Meeting Model Updates ⭐ PRIORITY 1**
**File:** `Backend/src/models/Meeting.ts`

**THAY ĐỔI:**
```typescript
// THÊM/SỬA các field sau:
export interface IMeeting extends Document {
  // ... existing fields ...
  meetingPassword: string;                     // ✏️ CHANGE: Make required
  status: 'scheduled' | 'waiting_customer' | 'in_progress' | 'completed' | 'cancelled'; // ➕ ADD waiting_customer
}

// Schema updates:
meetingPassword: {
  type: String,
  required: true,        // ✏️ CHANGE: từ optional thành required  
  trim: true,
  minlength: 8,         // ➕ ADD validation
  maxlength: 8
},
status: {
  type: String,
  enum: ['scheduled', 'waiting_customer', 'in_progress', 'completed', 'cancelled'], // ➕ ADD waiting_customer
  default: 'scheduled'
}
```

#### **A2. Password Generator Utility ⭐ PRIORITY 1**
**File:** `Backend/src/utils/passwordGenerator.ts` *(TẠO MỚI)*

**TẠO FILE MỚI:**
```typescript
/**
 * Generate secure meeting password
 * @returns 8-character random password (A-Z, 0-9)
 */
export const generateMeetingPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Validate meeting password format
 * @param password - Password to validate
 * @returns boolean
 */
export const isValidMeetingPassword = (password: string): boolean => {
  const regex = /^[A-Z0-9]{8}$/;
  return regex.test(password);
};
```

#### **A3. Meeting Service Updates ⭐ PRIORITY 2**
**File:** `Backend/src/services/doctorQAService.ts`

**THÊM VÀO ĐẦU FILE:**
```typescript
// ➕ IMPORT password generator
import { generateMeetingPassword } from '../utils/passwordGenerator';
```

**CẬP NHẬT FUNCTION `createMeetingRecord`:**
```typescript
// Tìm function createMeetingRecord và thêm:
// ADD: Generate secure password
const meetingPassword = generateMeetingPassword();
console.log(`🔐 [CREATE-MEETING] Generated password: ${meetingPassword} for QA: ${qaId}`);

// UPDATE: Tạo Meeting record với password
const newMeeting = await Meeting.create({
  qaId: qa._id,
  doctorId: qa.doctorId,
  userId: qa.userId,
  meetingLink,
  meetingPassword,           // ➕ ADD password field
  provider: 'jitsi',
  scheduledTime,
  status: 'scheduled',
  participantCount: 0,
  maxParticipants: 2,
  notes: `Meeting created for consultation: ${qa.question.substring(0, 100)}...`
});
```

**THÊM FUNCTION MỚI:**
```typescript
// ➕ ADD: Function cập nhật participant count và status
export const updateMeetingParticipants = async (
  meetingId: string, 
  participantCount: number
): Promise<any> => {
  try {
    console.log(`🔄 [UPDATE-PARTICIPANTS] Meeting ${meetingId}: ${participantCount} participants`);
    
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting không tồn tại');
    }

    let newStatus = meeting.status;
    
    // Logic tự động chuyển status
    if (participantCount === 1 && meeting.status === 'scheduled') {
      newStatus = 'waiting_customer';
      console.log(`🔄 [STATUS-CHANGE] Doctor joined first → waiting_customer`);
    } else if (participantCount >= 2 && meeting.status === 'waiting_customer') {
      newStatus = 'in_progress';
      console.log(`🔄 [STATUS-CHANGE] Customer joined → in_progress`);
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { 
        participantCount,
        status: newStatus,
        ...(participantCount === 1 && { actualStartTime: new Date() })
      },
      { new: true }
    );

    return updatedMeeting;
  } catch (error) {
    console.error('❌ [ERROR] Update participants failed:', error);
    throw error;
  }
};
```

#### **A4. Email Service - Customer Invite Template ⭐ PRIORITY 3**
**File:** `Backend/src/services/emails.ts`

**THÊM VÀO CUỐI FILE:**
```typescript
// ➕ ADD: Email template cho customer meeting invite
export const sendCustomerMeetingInviteEmail = async (
  customerEmail: string,
  customerName: string,
  customerPhone: string,
  doctorName: string,
  meetingLink: string,
  meetingPassword: string,
  scheduledTime: Date,
  consultationQuestion: string
): Promise<void> => {
  const subject = "🔐 Thư mời tham gia cuộc tư vấn trực tuyến - Gender Healthcare";
  
  // Format thời gian tiếng Việt
  const formattedTime = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  }).format(scheduledTime);
  
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header với gradient đẹp -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Gender Healthcare</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0;">Thư mời tham gia cuộc tư vấn</p>
      </div>

      <!-- Content chính -->
      <div style="background: white; padding: 30px; border: 1px solid #e9e9e9; border-top: none;">
        
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="width: 80px; height: 80px; background: #4CAF50; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 36px; color: white;">👨‍⚕️</span>
          </div>
          <h2 style="color: #2c3e50; margin: 0;">Bác sĩ đã sẵn sàng tư vấn!</h2>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Xin chào \${customerName},</h3>
          <p style="line-height: 1.6; color: #555;">
            Bác sĩ <strong>\${doctorName}</strong> đã tham gia phòng tư vấn và đang chờ bạn. 
            Cuộc tư vấn đã sẵn sàng để bắt đầu!
          </p>
        </div>

        <!-- Thông tin quan trọng về ghi hình -->
        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #856404;">⚠️ Thông báo quan trọng về ghi hình buổi tư vấn</h4>
          <div style="background: #ffffff; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #333; font-weight: bold;">
              Để đảm bảo chất lượng dịch vụ và bảo vệ quyền lợi của cả hai bên, bác sĩ vui lòng:
            </p>
            <ul style="margin: 10px 0 0 20px; color: #555;">
              <li><strong>Tự ghi hình</strong> toàn bộ buổi tư vấn bằng phần mềm ghi màn hình trên máy tính của mình</li>
              <li><strong>Lưu trữ file ghi hình</strong> tại máy tính cá nhân với tên file theo format: <code>YYYYMMDD_HH-mm_TenBenhNhan.mp4</code></li>
              <li><strong>Ghi chú ngày giờ</strong> vào sổ tay hoặc lịch cá nhân để tra cứu khi cần</li>
              <li><strong>Bảo mật thông tin</strong> bệnh nhân và chỉ cung cấp khi có yêu cầu chính thức từ trung tâm</li>
            </ul>
            <div style="background: #ffeaa7; padding: 10px; border-radius: 5px; margin-top: 15px;">
              <p style="margin: 0; color: #856404; font-weight: bold;">
                ⚠️ Lưu ý: Nếu không thực hiện ghi hình và xảy ra tranh chấp, công ty sẽ không chịu trách nhiệm về các vấn đề pháp lý phát sinh.
              </p>
            </div>
          </div>
        </div>

        <!-- Thông tin buổi tư vấn -->
        <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">📅 Thông tin buổi tư vấn:</h4>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Bệnh nhân:</td>
              <td style="padding: 8px 0;">${customerName}</td>
            </tr>
            <tr>  
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Số điện thoại:</td>
              <td style="padding: 8px 0;">${customerPhone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Thời gian:</td>
              <td style="padding: 8px 0;"><strong>${formattedTime}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Meeting Link:</td>
              <td style="padding: 8px 0;"><a href="${meetingLink}" target="_blank">Có sẵn</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Vấn đề:</td>
              <td style="padding: 8px 0; font-style: italic;">${consultationQuestion}</td>
            </tr>
          </table>
        </div>

        <!-- PASSWORD section - Hiển thị to và rõ -->
        <div style="background: #f44336; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: white;">🔐 Mật khẩu Meeting</h3>
          <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0; font-size: 14px;">Mật khẩu để tham gia:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; font-family: monospace;">
              ${meetingPassword}
            </div>
          </div>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">
            Vui lòng sao chép password này để nhập khi được yêu cầu
          </p>
        </div>

        <!-- Hướng dẫn chi tiết -->
        <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #2e7d32;">💡 Hướng dẫn tham gia:</h4>
          <ol style="margin: 10px 0 0 20px; color: #555; line-height: 1.6;">
            <li>Click "<strong>Xác nhận và Tham gia Meeting</strong>" phía dưới</li>
            <li>Khi được yêu cầu, nhập password: <code style="background: #f5f5f5; padding: 2px 5px; border-radius: 3px;">${meetingPassword}</code></li>
            <li>Cho phép trình duyệt truy cập camera và microphone</li>
            <li>Đợi vài giây để kết nối ổn định</li>
            <li>Bắt đầu cuộc tư vấn với bác sĩ</li>
          </ol>
        </div>

        <!-- Call to action button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${meetingLink}" 
             target="_blank" 
             style="display: inline-block; background: #4CAF50; color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);">
            ✅ Xác nhận và Tham gia Meeting
          </a>
        </div>

        <!-- Gợi ý phần mềm ghi màn hình -->
        <div style="background: #e1f5fe; border: 1px solid #03a9f4; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0277bd;">💡 Gợi ý phần mềm ghi màn hình:</h4>
          <p style="margin: 5px 0; color: #555; font-size: 14px;">
            <strong>OBS Studio (miễn phí)</strong>, <strong>Bandicam</strong>, <strong>Camtasia</strong>, 
            hoặc sử dụng tính năng ghi màn hình có sẵn trên hệ điều hành.
          </p>
        </div>

      </div>

      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Gender Healthcare. Tất cả các quyền được bảo lưu.</p>
      </div>
    </div>
  `;
  
  await sendEmail(customerEmail, subject, htmlContent);
  console.log(`📧 [EMAIL-SENT] Customer meeting invite sent to: ${customerEmail}`);
};
```

#### **A5. API Route mới ⭐ PRIORITY 4**
**File:** `Backend/src/routes/doctorQARoutes.ts`

**THÊM VÀO CUỐI FILE (TRƯỚC export):**
```typescript
// ➕ ADD: Route gửi customer invite
router.post('/:id/send-customer-invite', 
  authenticateToken, 
  authorizeManager, 
  async (req: Request, res: Response) => {
    try {
      const qaId = req.params.id;
      
      console.log(`📧 [SEND-INVITE] Processing customer invite for QA: ${qaId}`);
      
      // Get QA and Meeting info với full populate
      const qa = await DoctorQA.findById(qaId)
        .populate({
          path: 'doctorId',
          select: 'userId bio specialization',
          populate: {
            path: 'userId',
            select: 'fullName email'
          }
        })
        .populate('userId', 'fullName email');
        
      const meeting = await Meeting.findOne({ qaId: new mongoose.Types.ObjectId(qaId) });
      
      if (!qa) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy yêu cầu tư vấn' 
        });
      }
      
      if (!meeting) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy meeting record' 
        });
      }
      
      // Validate meeting status
      if (meeting.status !== 'waiting_customer') {
        return res.status(400).json({ 
          success: false, 
          message: `Meeting chưa sẵn sàng để gửi invite. Status hiện tại: ${meeting.status}` 
        });
      }
      
      // Extract info
      const customerEmail = qa.userId.email;
      const customerName = qa.fullName;
      const customerPhone = qa.phone || 'Không có';
      const doctorName = qa.doctorId.userId.fullName;
      
      // Gửi email
      await sendCustomerMeetingInviteEmail(
        customerEmail,
        customerName,
        customerPhone, 
        doctorName,
        meeting.meetingLink,
        meeting.meetingPassword,
        meeting.scheduledTime,
        qa.question
      );
      
      res.json({ 
        success: true, 
        message: 'Đã gửi thư mời cho customer thành công',
        data: {
          emailSent: customerEmail,
          customerName,
          doctorName,
          meetingPassword: meeting.meetingPassword
        }
      });
      
    } catch (error) {
      console.error('❌ [ERROR] Send customer invite failed:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi gửi thư mời', 
        error: error.message 
      });
    }
  }
);
```

---

### **B. FRONTEND CHANGES**

#### **B1. API Service Updates ⭐ PRIORITY 5**
**File:** `Frontend/src/api/endpoints/doctorQA.ts`

**THÊM VÀO CUỐI FILE:**
```typescript
// ➕ ADD: API cho customer invite
export const sendCustomerInvite = async (qaId: string) => {
  try {
    const response = await axiosConfig.post(`/doctor-qa/${qaId}/send-customer-invite`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ➕ ADD: API cập nhật participants
export const updateMeetingParticipants = async (qaId: string, participantCount: number) => {
  try {
    const response = await axiosConfig.put(`/doctor-qa/${qaId}/update-participants`, {
      participantCount
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

#### **B2. ConsultationManagement Component Updates ⭐ PRIORITY 6**
**File:** `Frontend/src/pages/dashboard/operational/ConsultationManagement.tsx`

**THÊM IMPORTS:**
```typescript
// ➕ ADD imports
import { EyeOutlined, EyeInvisibleOutlined, MailOutlined } from '@ant-design/icons';
import { sendCustomerInvite } from '../../../api/endpoints/doctorQA';
```

**THÊM STATE:**
```typescript
// ➕ ADD state cho password visibility
const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
const [sendingInvite, setSendingInvite] = useState<{ [key: string]: boolean }>({});
```

**THÊM FUNCTIONS:**
```typescript
// ➕ ADD function gửi customer invite
const handleSendCustomerInvite = async (qaId: string, customerEmail: string) => {
  try {
    setSendingInvite(prev => ({ ...prev, [qaId]: true }));
    
    const response = await sendCustomerInvite(qaId);
    
    notification.success({
      message: 'Gửi thành công!',
      description: `Đã gửi thư mời meeting cho: ${response.data.emailSent}`,
      duration: 4
    });
    
    // Refresh data để cập nhật UI
    await fetchTodayConsultations();
    
  } catch (error) {
    console.error('Error sending customer invite:', error);
    notification.error({
      message: 'Lỗi gửi thư mời',
      description: error.response?.data?.message || 'Có lỗi xảy ra khi gửi email',
      duration: 5
    });
  } finally {
    setSendingInvite(prev => ({ ...prev, [qaId]: false }));
  }
};

// ➕ ADD helper function cho password display
const renderPasswordDisplay = (meetingData: any, consultationId: string) => {
  if (!meetingData?.meetingPassword) return null;
  
  const isVisible = showPassword[consultationId];
  
  return (
    <div style={{ 
      background: '#f44336', 
      color: 'white', 
      padding: '12px', 
      borderRadius: '8px', 
      textAlign: 'center',
      marginBottom: '8px'
    }}>
      <div style={{ fontSize: '12px', marginBottom: '5px' }}>
        🔐 Meeting Password:
      </div>
      <div style={{ 
        fontSize: '20px', 
        fontWeight: 'bold', 
        letterSpacing: '3px',
        fontFamily: 'monospace',
        marginBottom: '5px'
      }}>
        {isVisible ? meetingData.meetingPassword : '••••••••'}
      </div>
      <Button 
        type="link" 
        size="small" 
        icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        style={{ color: 'white', padding: 0, fontSize: '12px' }}
        onClick={() => setShowPassword(prev => ({
          ...prev,
          [consultationId]: !prev[consultationId]
        }))}
      >
        {isVisible ? 'Ẩn' : 'Hiện'} Password
      </Button>
    </div>
  );
};
```

**CẬP NHẬT `renderActionButton` FUNCTION:**
```typescript
// ✏️ UPDATE renderActionButton function với logic mới
const renderActionButton = (consultation: any, meetingData: any) => {
  const { _id: consultationId, status, userId } = consultation;
  
  // ❌ CANCELLED/COMPLETED → Show tags only
  if (status === 'cancelled') {
    return (
      <Tag color="red" style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
        ❌ Đã hủy
      </Tag>
    );
  }
  
  if (status === 'completed') {
    return (
      <Tag color="green" style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
        ✅ Đã hoàn thành
      </Tag>
    );
  }
  
  // 📅 SCHEDULED without meeting → Create meeting
  if (status === 'scheduled' && !meetingData) {
    return (
      <Button 
        type="primary"
        block
        onClick={() => handleCreateMeeting(consultationId)}
        loading={creatingMeeting[consultationId]}
      >
        📝 Tạo hồ sơ meeting
      </Button>
    );
  }
  
  // 🔄 SCHEDULED with meeting → Show password + join button
  if (status === 'scheduled' && meetingData) {
    return (
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Password Display */}
        {renderPasswordDisplay(meetingData, consultationId)}
        
        {/* Join Meeting Button */}
        <Button 
          type="primary"
          block
          onClick={() => window.open(meetingData.meetingLink, '_blank')}
          style={{ background: '#4CAF50', borderColor: '#4CAF50' }}
        >
          🎥 Tham gia Meeting
        </Button>
        
        {/* Instruction Note */}
        <div style={{ 
          fontSize: '11px', 
          color: '#666', 
          textAlign: 'center',
          background: '#f8f9fa',
          padding: '8px',
          borderRadius: '4px'
        }}>
          <div><strong>💡 Hướng dẫn:</strong></div>
          <div>1. Tham gia Meeting trước</div>
          <div>2. Setting password của trung tâm</div>
          <div>3. Copy password để setting qua Meet</div>
        </div>
      </Space>
    );
  }
  
  // ⏳ WAITING_CUSTOMER → Show invite button
  if (status === 'consulting' && meetingData?.status === 'waiting_customer') {
    return (
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Tag color="orange" style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
          🔄 Đang chờ khách hàng tham gia
        </Tag>
        
        <Button 
          type="primary"
          block
          danger
          icon={<MailOutlined />}
          onClick={() => handleSendCustomerInvite(consultationId, userId?.email)}
          loading={sendingInvite[consultationId]}
        >
          📧 Gửi thư mời Meeting cho Customer
        </Button>
        
        <div style={{ 
          fontSize: '11px', 
          color: '#666', 
          textAlign: 'center',
          background: '#fff3cd',
          padding: '6px',
          borderRadius: '4px'
        }}>
          Email sẽ gửi đến: <strong>{userId?.email}</strong>
        </div>
      </Space>
    );
  }
  
  // Default fallback
  return (
    <Tag color="default" style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
      ⚠️ Trạng thái không xác định
    </Tag>
  );
};
```

#### **B3. Xóa button "Tham gia lại" cũ ⭐ PRIORITY 7**
**CÁCH THỰC HIỆN:**
```bash
# 1. Tìm tất cả các reference đến "Tham gia lại"
grep -r "Tham gia lại" Frontend/src/

# 2. Kiểm tra từng file và xóa/comment out các button này
# 3. Thay thế bằng logic mới trong renderActionButton
```

---

## 🧪 **TESTING CHECKLIST - FOLLOW STEP BY STEP**

### **✅ Test Case 1: Password Generation và Display**
```
□ Tạo meeting mới
□ Kiểm tra password đúng 8 ký tự A-Z0-9
□ Password hiển thị TO, RÕ, BÔI ĐẬM trong UI
□ Button show/hide password hoạt động đúng
□ Password được lưu đúng trong database
```

### **✅ Test Case 2: Email Flow**
```
□ Doctor join meeting → status = waiting_customer
□ Button "Gửi thư mời" xuất hiện đúng
□ Nhấn button → email gửi thành công  
□ Email chứa password chính xác
□ Meeting link trong email đúng với doctor
□ Customer nhận email và có thể join được
```

### **✅ Test Case 3: UI/UX**
```
□ Password display responsive trên mobile
□ Xóa hoàn toàn button "Tham gia lại" cũ
□ Loading states hoạt động đúng
□ Error handling hiển thị thông báo hợp lý
□ Button states thay đổi đúng theo status
```

### **✅ Test Case 4: Security và Validation**
```
□ Chỉ doctor/manager có thể gửi invite
□ Không thể gửi invite khi meeting chưa sẵn sàng
□ Password không bị expose trong logs
□ API authentication đúng
□ Input validation cho participant count
```

---

## 📋 **IMPLEMENTATION ROADMAP - FOLLOW ORDER**

### **📅 Day 1: Core Backend**
**⏰ Morning (4 hours):**
- [ ] **A1**: Update Meeting model (required password, thêm waiting_customer status)
- [ ] **A2**: Tạo password generator utility
- [ ] **A3**: Update createMeetingRecord với password generation
- [ ] Test password generation và meeting creation

**⏰ Afternoon (4 hours):**
- [ ] **A4**: Tạo email template cho customer invite
- [ ] **A5**: Thêm API route send-customer-invite
- [ ] Test API endpoints với Postman
- [ ] Validate authentication và authorization

### **📅 Day 2: Frontend Core**  
**⏰ Morning (4 hours):**
- [ ] **B1**: Update API service với new endpoints
- [ ] **B2**: Implement password display component
- [ ] **B3**: Xóa button "Tham gia lại" cũ
- [ ] Update renderActionButton logic

**⏰ Afternoon (4 hours):**
- [ ] Integrate send customer invite
- [ ] Test complete UI flow
- [ ] Fix responsive issues nếu có
- [ ] Polish UI/UX

### **📅 Day 3: Testing & Deployment**
**⏰ Morning (4 hours):**
- [ ] Complete manual testing scenarios
- [ ] Fix bugs phát hiện được
- [ ] Update API documentation
- [ ] Deploy và test trên staging

**⏰ Afternoon (4 hours):**
- [ ] Production deployment
- [ ] Smoke test trên production
- [ ] Monitor error logs
- [ ] User acceptance testing

---

## 🚀 **DEPLOYMENT CHECKLIST - FOLLOW ORDER**

### **🔧 Pre-Deployment**
- [ ] **Database migration script** cho Meeting schema changes
- [ ] **Environment variables check** cho email service
- [ ] **Backup database** trước khi deploy
- [ ] **Test email credentials** trên production

### **📦 Deployment Steps**
1. [ ] **Deploy backend changes** với database migration
2. [ ] **Test API endpoints** trên production
3. [ ] **Deploy frontend changes**  
4. [ ] **Smoke test complete workflow**
5. [ ] **Monitor error logs** for 24h

### **✅ Post-Deployment**
- [ ] **Validate email delivery** thành công
- [ ] **Check meeting creation** performance
- [ ] **Monitor user feedback**
- [ ] **Document any issues** phát sinh

---

## 🔧 **QUICK REFERENCE - COMMANDS & ENDPOINTS**

### **Testing Commands**
```bash
# Test password generation
node -e "console.log(require('./src/utils/passwordGenerator').generateMeetingPassword())"

# Check Meeting với password
db.meetings.find({ qaId: ObjectId("...") })

# Check email logs  
grep "EMAIL-SENT" backend.log

# Find "Tham gia lại" buttons
grep -r "Tham gia lại" Frontend/src/
```

### **API Endpoints**
```
POST /api/doctor-qa/:id/send-customer-invite
PUT /api/doctor-qa/:id/update-participants
GET /api/doctor-qa/today
GET /api/doctor-qa/:id/check-meeting
```

### **Key Files Modified**
```
Backend/src/models/Meeting.ts
Backend/src/utils/passwordGenerator.ts (NEW)
Backend/src/services/doctorQAService.ts  
Backend/src/services/emails.ts
Backend/src/routes/doctorQARoutes.ts

Frontend/src/api/endpoints/doctorQA.ts
Frontend/src/pages/dashboard/operational/ConsultationManagement.tsx
```

---

**📅 Created:** 2025-01-25  
**👥 Team:** Backend + Frontend + DevOps  
**⏱️ Estimated:** 3 ngày development + testing  
**🎯 Priority:** High - Core feature cho consultation workflow

---

✅ **Follow guide này step-by-step để implementation thành công!**

*Tài liệu sẽ được cập nhật khi có changes trong implementation* 