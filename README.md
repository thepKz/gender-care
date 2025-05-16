# Gender Healthcare - Hệ thống Quản lý Dịch vụ Chăm sóc Sức khỏe Giới tính

## Giới thiệu

Hệ thống Quản lý Dịch vụ Chăm sóc Sức khỏe Giới tính là một nền tảng y tế toàn diện cung cấp các dịch vụ chăm sóc sức khỏe giới tính và sức khỏe sinh sản. Hệ thống được thiết kế để hỗ trợ người dùng theo dõi chu kỳ sinh sản, đặt lịch tư vấn, xét nghiệm STIs, và tiếp cận các nội dung giáo dục về sức khỏe giới tính.

## Các vai trò người dùng

1. **Guest** - Người dùng chưa đăng nhập, có thể xem thông tin cơ bản và blog
2. **Customer** - Người dùng đã đăng ký, có thể sử dụng các dịch vụ của hệ thống
3. **Consultant** - Tư vấn viên, cung cấp dịch vụ tư vấn sức khỏe giới tính
4. **Staff** - Nhân viên của cơ sở y tế, quản lý đặt lịch và thực hiện xét nghiệm
5. **Manager** - Quản lý cơ sở y tế, theo dõi hoạt động và báo cáo
6. **Admin** - Quản trị viên hệ thống, quản lý người dùng và cấu hình hệ thống

## Chức năng chính

1. **Trang chủ và thông tin cơ sở y tế**
   - Giới thiệu cơ sở y tế
   - Các dịch vụ chính
   - Phản hồi từ khách hàng
   - Thông tin liên hệ

2. **Blog và giáo dục**
   - Bài viết về giáo dục giới tính
   - Chăm sóc sức khỏe sinh sản
   - Thông tin về các bệnh lây truyền qua đường tình dục (STIs)

3. **Theo dõi chu kỳ sinh sản**
   - Khai báo chu kỳ kinh nguyệt
   - Dự đoán thời gian rụng trứng và khả năng mang thai
   - Nhắc nhở thời gian uống thuốc tránh thai

4. **Đặt lịch tư vấn**
   - Đặt lịch tư vấn trực tuyến với tư vấn viên
   - Quản lý lịch hẹn và nhắc nhở
   - Đánh giá sau khi tư vấn

5. **Hỏi đáp với tư vấn viên**
   - Đặt câu hỏi cho tư vấn viên
   - Xem lịch sử câu hỏi và trả lời

6. **Xét nghiệm STIs**
   - Đặt lịch xét nghiệm
   - Theo dõi quá trình xét nghiệm
   - Nhận kết quả xét nghiệm

7. **Quản lý tư vấn viên**
   - Thông tin chung
   - Bằng cấp, kinh nghiệm
   - Lịch làm việc

8. **Quản lý đánh giá và phản hồi**
   - Đánh giá dịch vụ
   - Phản hồi từ khách hàng

9. **Quản lý hồ sơ người dùng**
   - Thông tin cá nhân
   - Lịch sử sử dụng dịch vụ

10. **Dashboard & Báo cáo**
    - Thống kê sử dụng dịch vụ
    - Báo cáo doanh thu
    - Phân tích xu hướng

## Cấu trúc thư mục

```
Gender_Healthcare/
├── Backend/                 # Mã nguồn phía máy chủ
│   ├── controllers/         # Xử lý logic nghiệp vụ
│   ├── models/              # Mô hình dữ liệu
│   ├── routes/              # Định tuyến API
│   ├── utils/               # Tiện ích
│   └── server.js            # Điểm khởi chạy ứng dụng
│
├── Frontend/                # Mã nguồn phía người dùng
│   ├── public/              # Tài nguyên tĩnh
│   └── src/
│       ├── assets/          # Hình ảnh, fonts, v.v.
│       ├── components/      # Các thành phần UI tái sử dụng
│       ├── contexts/        # React contexts
│       ├── hooks/           # Custom hooks
│       ├── layouts/         # Bố cục trang
│       ├── pages/           # Các trang chính
│       ├── services/        # Dịch vụ và API
│       ├── styles/          # Định nghĩa style
│       └── utils/           # Tiện ích
│
└── Docs/                    # Tài liệu
    ├── API.md               # Tài liệu API
    └── ERD.txt              # Mô hình quan hệ thực thể
```

## Công nghệ sử dụng

### Frontend
- **React**: Thư viện JavaScript để xây dựng giao diện người dùng
- **Ant Design**: Thư viện UI components
- **TailwindCSS**: Framework CSS tiện ích
- **GSAP**: Thư viện animation
- **React Router**: Định tuyến client-side
- **Axios**: Gọi API HTTP

### Backend
- **Node.js**: Môi trường chạy JavaScript server-side
- **Express**: Framework web cho Node.js
- **MongoDB**: Cơ sở dữ liệu NoSQL
- **Mongoose**: ODM (Object Data Modeling) cho MongoDB
- **JWT**: Xác thực và ủy quyền

### DevOps & Công cụ
- **Git**: Quản lý phiên bản
- **Docker**: Container hóa
- **Jest**: Unit testing
- **ESLint**: Kiểm tra chất lượng mã

## Bảo mật và Quyền riêng tư

Hệ thống đặc biệt chú trọng đến tính bảo mật và quyền riêng tư của người dùng, đảm bảo:
- Mã hóa dữ liệu nhạy cảm
- Bảo vệ thông tin y tế theo chuẩn ngành
- Kiểm soát quyền truy cập chặt chẽ
- Xác thực đa yếu tố
- Lưu vết hoạt động để kiểm toán

## Yêu cầu phi chức năng

1. **Hiệu suất**: Thời gian phản hồi nhanh, tối ưu hóa truy vấn CSDL
2. **Khả năng mở rộng**: Kiến trúc microservices để dễ dàng mở rộng
3. **Độ tin cậy**: Sao lưu dữ liệu thường xuyên, xử lý lỗi mạnh mẽ
4. **Khả năng sử dụng**: Giao diện thân thiện, trải nghiệm người dùng liền mạch
5. **Tính tương thích**: Hoạt động tốt trên nhiều thiết bị và trình duyệt 