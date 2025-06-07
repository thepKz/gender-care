# Sequence Diagrams - Unified Booking Flow

## Tổng quan

Tài liệu này mô tả sequence diagram cho **luồng đặt lịch hẹn thống nhất** trong hệ thống Gender Healthcare.

**Tất cả các dịch vụ đều sử dụng một luồng booking duy nhất tại `/booking`:**

- Consultation (Tư vấn)
- STI Testing (Xét nghiệm STI)
- Health Checkup (Khám sức khỏe)
- Home Sampling (Lấy mẫu tại nhà)
- Cycle Tracking (Theo dõi chu kỳ)

## 1. Luồng Đặt lịch Thống nhất (Unified Booking Flow)

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant D as Doctor/Staff
    participant N as Notification

    Note over C,N: 1. Customer truy cập từ Services
    C->>F: Click "Đặt lịch" từ /services
    F->>F: Navigate to /booking?service={serviceId}
    F->>B: GET /api/services/{serviceId}
    B->>DB: Query Services collection
    DB-->>B: Return service details
    B-->>F: Return service info
    F-->>C: Display booking form with pre-selected service

    Note over C,N: 2. Customer chọn bác sĩ (optional)
    F->>B: GET /api/doctors?serviceId={serviceId}
    B->>DB: Query available doctors for service
    DB-->>B: Return doctors list
    B-->>F: Return doctors with workload info
    F-->>C: Display doctor selection (optional)

    alt Customer chọn bác sĩ cụ thể
        C->>F: Select specific doctor
    else Hệ thống auto-assign
        F->>F: Auto-select doctor with least workload
        Note over F: Nếu tie thì random selection
    end

    Note over C,N: 3. Customer chọn location type
    C->>F: Select typeLocation
    Note over F: Options: "online", "clinic", "home"
    F->>F: Show/hide address field based on location
    alt typeLocation = "home"
        F-->>C: Show address input field
    else typeLocation = "online" or "clinic"
        F-->>C: Hide address field
    end

    Note over C,N: 4. Customer chọn ngày và time slot
    F->>B: GET /api/doctors/{doctorId}/schedules?date={selectedDate}
    B->>DB: Query DoctorSchedules for available slots
    DB-->>B: Return available time slots
    B-->>F: Return time slots
    F-->>C: Display calendar with available times

    C->>F: Select date and time slot
    F-->>C: Show selected slot confirmation

    Note over C,N: 5. Customer chọn User Profile
    F->>B: GET /api/user-profiles?userId={userId}
    B->>DB: Query UserProfiles collection
    DB-->>B: Return user's profiles (self + family)
    B-->>F: Return profiles list
    F-->>C: Display profile selection

    alt Chọn profile có sẵn
        C->>F: Select existing profile
        F-->>C: Auto-fill form with profile data
    else Tạo profile mới
        C->>F: Select "Tạo hồ sơ mới"
        F-->>C: Show empty form fields
    end

    Note over C,N: 6. Customer điền thông tin và xác nhận
    C->>F: Fill form (name, phone, notes, description, address if needed)
    F->>F: Validate all required fields
    F->>B: POST /api/appointments

    Note over B: Create appointment record
    B->>DB: Create Appointments document
    Note over DB: Fields:<br/>- serviceId<br/>- packageId (if applicable)<br/>- doctorId (assigned)<br/>- profileId<br/>- appointmentDate/Time<br/>- typeLocation<br/>- address (if home)<br/>- description<br/>- notes<br/>- status: "pending"
    DB-->>B: Return appointment ID

    Note over B: Update doctor schedule
    B->>DB: Update TimeSlots.isBooked = true
    DB-->>B: Confirm slot booking

    Note over B: Create bill
    B->>DB: Create Bills document
    DB-->>B: Return bill ID

    B-->>F: Return booking confirmation
    F-->>C: Show success message + appointment details

    Note over C,N: 7. Notification và xác nhận
    B->>N: Send notification to assigned doctor/staff
    N->>D: Email/SMS: New appointment booking

    D->>F: Login to dashboard
    F->>B: GET /api/appointments?assignedTo={doctorId}&status=pending
    B->>DB: Query pending appointments
    DB-->>B: Return appointments list
    B-->>F: Return appointments
    F-->>D: Display pending appointments

    D->>F: Confirm/Reject appointment
    F->>B: PUT /api/appointments/{appointmentId}/status
    B->>DB: Update Appointments.status = "confirmed"/"cancelled"
    DB-->>B: Confirm status update

    B->>N: Send confirmation to customer
    N->>C: Email/SMS: Appointment confirmed/cancelled
    B-->>F: Return updated status
    F-->>D: Show confirmation message
```

## 2. Luồng Quản lý Lịch hẹn (Appointment Management)

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant S as Staff/Doctor
    participant N as Notification

    Note over C,N: 1. Customer xem lịch sử đặt lịch
    C->>F: Truy cập /booking-history
    F->>B: GET /api/appointments?userId={userId}
    B->>DB: Query user's appointments
    DB-->>B: Return appointments list
    B-->>F: Return appointments with status
    F-->>C: Display booking history with filters

    Note over C,N: 2. Customer hủy/đổi lịch
    C->>F: Click cancel/reschedule appointment
    F->>F: Check cancellation policy

    alt Hủy lịch
        F->>B: PUT /api/appointments/{appointmentId}/cancel
        B->>DB: Update status = "cancelled"
        DB-->>B: Confirm cancellation
        B->>DB: Update TimeSlots.isBooked = false
        DB-->>B: Release time slot
        B->>N: Notify staff/doctor about cancellation
        N->>S: Email: Appointment cancelled
    else Đổi lịch
        F->>B: GET /api/doctors/{doctorId}/schedules
        B->>DB: Query available slots
        DB-->>B: Return new available slots
        B-->>F: Return time options
        F-->>C: Display new time slots

        C->>F: Chọn slot mới
        F->>B: PUT /api/appointments/{appointmentId}/reschedule
        B->>DB: Update appointment date/time
        B->>DB: Update old slot: isBooked = false
        B->>DB: Update new slot: isBooked = true
        DB-->>B: Confirm reschedule
        B->>N: Notify about schedule change
        N->>S: Email: Appointment rescheduled
        N->>C: SMS: Reschedule confirmation
    end

    Note over C,N: 3. Staff/Doctor quản lý lịch hẹn
    S->>F: Login to dashboard
    F->>B: GET /api/appointments?assignedTo={staffId}&date={today}
    B->>DB: Query today's appointments
    DB-->>B: Return scheduled appointments
    B-->>F: Return appointment list
    F-->>S: Display daily schedule

    S->>F: Update appointment status
    F->>B: PUT /api/appointments/{appointmentId}/status
    B->>DB: Update appointment status
    DB-->>B: Confirm status update
    B->>N: Send status update to customer
    N->>C: Notification about appointment status change

    Note over C,N: 4. Feedback sau dịch vụ
    alt Appointment completed
        B->>N: Send feedback request
        N->>C: Email/SMS: Rate your experience

        C->>F: Click feedback link
        F->>B: GET /api/appointments/{appointmentId}/feedback-form
        B-->>F: Return feedback form
        F-->>C: Display rating form

        C->>F: Submit rating and feedback
        F->>B: POST /api/feedbacks
        B->>DB: Create Feedbacks document
        DB-->>B: Return feedback ID
        B->>DB: Update doctor/service ratings
        DB-->>B: Confirm rating update
        B-->>F: Return success
        F-->>C: Show thank you message
    end
```

## 3. Luồng Thanh toán (Payment Flow)

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant PG as Payment Gateway
    participant N as Notification

    Note over C,N: 1. Tạo hóa đơn khi đặt lịch
    C->>F: Confirm booking with payment
    F->>B: POST /api/appointments (with payment info)

    B->>DB: Create Appointments document
    DB-->>B: Return appointment ID

    B->>DB: Create Bills document
    Note over DB: Calculate total with promotions<br/>Status: "pending"
    DB-->>B: Return bill ID

    B-->>F: Return booking + bill details
    F-->>C: Display payment options

    Note over C,N: 2. Xử lý thanh toán
    C->>F: Chọn phương thức thanh toán
    F->>B: POST /api/payments/initiate
    B->>DB: Create Payments document (status: "pending")
    DB-->>B: Return payment ID

    B->>PG: Initiate payment transaction
    PG-->>B: Return payment URL/token
    B-->>F: Return payment details
    F-->>C: Redirect to payment gateway

    C->>PG: Complete payment
    PG->>B: Payment webhook/callback
    B->>DB: Update Payments.status = "completed"
    B->>DB: Update Bills.status = "paid"
    B->>DB: Update Appointments.status = "confirmed"
    DB-->>B: Confirm all updates

    B->>N: Send payment confirmation
    N->>C: Email/SMS: Payment successful + appointment confirmed

    Note over C,N: 3. Xử lý thanh toán thất bại
    alt Payment failed
        PG->>B: Payment failed webhook
        B->>DB: Update Payments.status = "failed"
        B->>DB: Update Bills.status = "pending"
        B->>DB: Update Appointments.status = "pending"
        DB-->>B: Confirm updates

        B->>N: Send payment failure notification
        N->>C: Email/SMS: Payment failed, please retry

        C->>F: Retry payment
        F->>B: POST /api/payments/retry
        Note over B,PG: Repeat payment process
    end
```

## 4. Entities và Relationships

### Các Entity chính trong Booking Flow:

- **Users**: Customer, Doctor, Staff thực hiện booking
- **UserProfiles**: Hồ sơ của customer (có thể đặt cho gia đình)
- **Services**: Các dịch vụ có thể đặt lịch
- **ServicePackages**: Gói dịch vụ combo
- **Doctors**: Bác sĩ thực hiện tư vấn/khám
- **DoctorSchedules**: Lịch làm việc của bác sĩ
- **Appointments**: Lịch hẹn chính
- **AppointmentTests**: Chi tiết xét nghiệm
- **Bills**: Hóa đơn thanh toán
- **Payments**: Giao dịch thanh toán
- **Feedbacks**: Đánh giá sau dịch vụ

### Luồng dữ liệu chính:

1. **Service Selection** → **Doctor/Schedule Selection** → **Profile Selection** → **Appointment Creation**
2. **Appointment** → **Bill Creation** → **Payment Processing**
3. **Appointment Execution** → **Result/Record Creation** → **Feedback Collection**

### Package Handling:

- **ServicePackages**: Gói dịch vụ combo (VD: Gói STI cơ bản, Gói khám tổng quát)
- Trong booking form, nếu service có packages thì hiển thị package selection
- Package được lưu trong `Appointments.packageId`
- Pricing được tính dựa trên package + location type
- Một appointment có thể có `serviceId` (single service) HOẶC `packageId` (service package)

## 5. Trạng thái Appointment

```
pending → confirmed → in_progress → completed
    ↓         ↓           ↓
cancelled  cancelled   cancelled
```

### Mô tả trạng thái:

- **pending**: Vừa tạo, chờ xác nhận từ staff/doctor
- **confirmed**: Đã xác nhận, chờ thực hiện
- **in_progress**: Đang thực hiện dịch vụ
- **completed**: Hoàn thành dịch vụ
- **cancelled**: Đã hủy (có thể hủy ở bất kỳ trạng thái nào trước completed)

## 6. Business Rules

### Booking Rules:

1. **Unified Flow**: Tất cả services đều qua `/booking` với query parameter `?service={serviceId}`
2. **Doctor Assignment**: Customer có thể chọn doctor hoặc để hệ thống auto-assign (doctor ít workload nhất)
3. **Location Logic**: Address field chỉ hiện khi `typeLocation = "home"`
4. **Profile Selection**: Customer chọn profile (bản thân hoặc người thân) trước khi điền form
5. **Time Slot**: Mỗi slot chỉ có thể book bởi 1 appointment
6. **Package vs Service**: Appointment có thể có `serviceId` HOẶC `packageId`, không được cả hai
7. **Cancellation**: Có thể hủy trước 24h (tùy policy)
8. **Payment**: Phải hoàn thành để confirm appointment

### Notification Rules:

1. Gửi confirmation email/SMS sau khi đặt lịch
2. Reminder 24h trước appointment
3. Notification khi có thay đổi status
4. Feedback request sau khi completed

### Access Control:

- **Customer**: Chỉ xem/quản lý appointment của mình
- **Doctor**: Xem appointment được assign + update status
- **Staff**: Quản lý tất cả appointment + upload results
- **Manager/Admin**: Full access + reports

## 7. API Endpoints Required

### Booking Flow APIs:

```
GET /api/services/{serviceId}                    # Get service details
GET /api/services/{serviceId}/packages           # Get service packages (if any)
GET /api/doctors?serviceId={serviceId}           # Get doctors for service
GET /api/doctors/{doctorId}/schedules            # Get doctor's available slots
GET /api/user-profiles?userId={userId}          # Get user's profiles
POST /api/user-profiles                          # Create new profile
POST /api/appointments                           # Create appointment
PUT /api/appointments/{id}/status                # Update appointment status
GET /api/appointments?userId={userId}           # Get user's appointments
PUT /api/appointments/{id}/cancel                # Cancel appointment
PUT /api/appointments/{id}/reschedule            # Reschedule appointment
```

### Supporting APIs:

```
POST /api/bills                                 # Create bill
POST /api/payments/initiate                     # Start payment
POST /api/payments/retry                        # Retry failed payment
POST /api/feedbacks                             # Submit feedback
GET /api/appointments/{id}/results               # Get test results
POST /api/medical-records                       # Create medical record
```
