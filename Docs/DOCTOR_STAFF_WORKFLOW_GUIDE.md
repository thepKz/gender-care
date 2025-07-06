# Hướng Dẫn Workflow Cho Bác Sĩ Và Staff

## Tổng Quan

Hệ thống đã được cập nhật để hỗ trợ workflow hoàn chỉnh cho bác sĩ và staff trong việc quản lý lịch hẹn và xét nghiệm.

## Tính Năng Mới

### 1. Lịch Hẹn Của Tôi (`DoctorAppointmentSchedule`)

**Đường dẫn:** `/dashboard/operational` → "Lịch hẹn của tôi"

**Chức năng:**
- Hiển thị chỉ các lịch hẹn được phân công cho bác sĩ/staff hiện tại
- Bộ lọc theo tab: Hôm nay / Sắp tới / Đã hoàn thành / Theo ngày
- Tìm kiếm theo tên bệnh nhân, SĐT, dịch vụ
- Workflow: Confirmed → Completed → Nhập kết quả xét nghiệm

**Workflow Chuẩn:**
1. **Lịch hẹn Confirmed** → Bác sĩ/Staff click "Hoàn thành cuộc hẹn"
2. **Lịch hẹn Completed** + Dịch vụ xét nghiệm → Click "Nhập kết quả xét nghiệm"
3. **Nhập kết quả** → Sử dụng TestResultsForm với auto-evaluation

**Phân quyền:**
- ✅ Doctor: Có thể xem tất cả lịch hẹn của mình
- ✅ Staff: Có thể xem tất cả lịch hẹn được phân công

### 2. Nhập Kết Quả Xét Nghiệm (`TestResultsEntry`)

**Đường dẫn:** `/dashboard/operational` → "Nhập kết quả xét nghiệm"

**Chức năng:**
- Chọn lịch hẹn đã completed trong ngày
- Tự động load template xét nghiệm theo dịch vụ
- Auto-evaluation dựa trên khoảng chuẩn
- Bulk input với validation

**Workflow:**
1. Chọn ngày
2. Chọn lịch hẹn đã hoàn thành
3. Click "Bắt đầu nhập kết quả"
4. Nhập các chỉ số xét nghiệm
5. Hệ thống tự động đánh giá (Cao/Thấp/Bình thường)
6. Lưu kết quả

**Phân quyền:**
- ✅ Doctor: Có thể nhập kết quả xét nghiệm
- ✅ Staff: Có thể nhập kết quả xét nghiệm

### 3. Cấu Hình Xét Nghiệm Cho Dịch Vụ (`ServiceTestConfiguration`)

**Đường dẫn:** `/dashboard/operational` → "Cấu hình xét nghiệm"

**Chức năng:**
- Quản lý chỉ số xét nghiệm cho từng dịch vụ
- Tùy chỉnh khoảng chuẩn cho từng dịch vụ
- Đặt đơn vị riêng biệt
- Ghi chú và giá trị mục tiêu

**Workflow:**
1. **Tab "Danh sách dịch vụ xét nghiệm":**
   - Hiển thị tất cả dịch vụ có `serviceType: 'test'`
   - Click "Cấu hình xét nghiệm" để chuyển tab

2. **Tab "Cấu hình xét nghiệm":**
   - Thêm test category vào dịch vụ
   - Đặt làm bắt buộc/tùy chọn
   - Tùy chỉnh khoảng chuẩn (ghi đè khoảng mặc định)
   - Tùy chỉnh đơn vị đo
   - Đặt giá trị mục tiêu
   - Thêm ghi chú

**Phân quyền:**
- ✅ Doctor: Có thể cấu hình xét nghiệm cho dịch vụ
- ✅ Staff: Có thể cấu hình xét nghiệm cho dịch vụ

## Menu Dashboard Cập Nhật

### Doctor Menu:
1. **Tổng quan** - Dashboard
2. **Lịch hẹn của tôi** - Lịch hẹn được phân công
3. **Quản lý tất cả lịch hẹn** - Quản lý tổng thể (chỉ doctor)
4. **Bệnh nhân** - Quản lý bệnh nhân
5. **Hồ sơ y tế** - Quản lý hồ sơ y tế
6. **Nhập kết quả xét nghiệm** - TestResultsEntry
7. **Cấu hình xét nghiệm** - ServiceTestConfiguration
8. **Báo cáo** - Thống kê

### Staff Menu:
1. **Tổng quan** - Dashboard
2. **Lịch hẹn của tôi** - Lịch hẹn được phân công
3. **Nhập kết quả xét nghiệm** - TestResultsEntry
4. **Cấu hình xét nghiệm** - ServiceTestConfiguration
5. **Báo cáo** - Thống kê

## API Endpoints Sử Dụng

### Appointment API:
- `GET /appointments` - Lấy danh sách lịch hẹn (filter theo doctorId)
- `PUT /appointments/:id/status` - Cập nhật trạng thái lịch hẹn

### Test Management API:
- `GET /service-test-categories/service/:serviceId` - Lấy cấu hình xét nghiệm
- `POST /service-test-categories` - Thêm xét nghiệm cho dịch vụ
- `PUT /service-test-categories/:id` - Cập nhật cấu hình
- `DELETE /service-test-categories/:id` - Xóa cấu hình
- `GET /test-result-items/template/:serviceId` - Lấy template nhập kết quả
- `POST /test-result-items/bulk-auto-evaluate` - Nhập nhiều kết quả với auto-evaluation
- `POST /test-result-items/evaluate-value` - Auto-evaluate một giá trị

## Lưu Ý Kỹ Thuật

### Authentication & Authorization:
- Tất cả API calls đều cần token authentication
- Backend check role trong middleware
- Frontend filter dữ liệu theo user role

### Data Flow:
1. **User login** → Role check → Redirect to appropriate dashboard
2. **Load appointments** → Filter by `doctorId === user._id`
3. **Complete appointment** → Update status → Reload data
4. **Test entry** → Load template → Auto-evaluate → Save results
5. **Service config** → CRUD operations on ServiceTestCategories

### Error Handling:
- API errors hiển thị thông báo rõ ràng
- Validation ở cả frontend và backend
- Graceful fallback khi không có quyền

## Testing Checklist

### Bác Sĩ (Doctor):
- [ ] Login và thấy menu đầy đủ
- [ ] "Lịch hẹn của tôi" chỉ hiển thị lịch hẹn của mình
- [ ] Có thể complete appointment
- [ ] Có thể nhập kết quả xét nghiệm
- [ ] Có thể cấu hình xét nghiệm cho dịch vụ
- [ ] Có thể truy cập "Quản lý tất cả lịch hẹn"

### Staff:
- [ ] Login và thấy menu phù hợp (không có Bệnh nhân, Hồ sơ y tế)
- [ ] "Lịch hẹn của tôi" chỉ hiển thị lịch hẹn được phân công
- [ ] Có thể complete appointment
- [ ] Có thể nhập kết quả xét nghiệm
- [ ] Có thể cấu hình xét nghiệm cho dịch vụ
- [ ] Không thể truy cập "Quản lý tất cả lịch hẹn"

### Workflow:
- [ ] Confirmed → Completed workflow hoạt động
- [ ] Test results entry tự động load template
- [ ] Auto-evaluation hiển thị kết quả chính xác
- [ ] Service test configuration CRUD hoạt động
- [ ] Custom ranges ghi đè giá trị mặc định

## Cải Tiến Tương Lai

1. **Real-time notifications** khi có lịch hẹn mới
2. **Print test results** - In kết quả xét nghiệm
3. **Test result history** - Lịch sử xét nghiệm bệnh nhân
4. **Bulk appointment operations** - Thao tác hàng loạt
5. **Advanced analytics** - Thống kê chi tiết
6. **Mobile responsive** - Tối ưu cho mobile
7. **Voice input** - Nhập kết quả bằng giọng nói
8. **AI recommendations** - Gợi ý dựa trên kết quả xét nghiệm 