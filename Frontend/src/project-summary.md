# Gender Healthcare Frontend Architecture

## Giới thiệu
Đây là phần Frontend của hệ thống Quản lý dịch vụ chăm sóc sức khỏe giới tính. Ứng dụng được xây dựng với React, TypeScript, Redux Toolkit và Ant Design.

## Cấu trúc thư mục

```
src/
├── api/                   # API services và Axios configuration
│   ├── axiosConfig.ts     # Cấu hình Axios, interceptors
│   ├── endpoints/         # Định nghĩa các API endpoints
│   │   ├── auth.ts        # API xác thực
│   │   ├── blog.ts        # API blog, bài viết
│   │   ├── consultation.ts # API tư vấn
│   │   ├── menstrualCycle.ts # API chu kỳ kinh nguyệt
│   │   └── stiTesting.ts  # API xét nghiệm STI
│   └── index.ts           # Export các API services
│
├── assets/                # Tài nguyên tĩnh (hình ảnh, font, etc.)
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── components/            # React components có thể tái sử dụng
│   ├── common/            # Components dùng chung
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   └── ...
│   ├── layout/            # Components bố cục
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── Sidebar/
│   │   └── ...
│   └── specific/          # Components cho tính năng cụ thể
│       ├── auth/
│       ├── blog/
│       ├── consultation/
│       └── ...
│
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         # Hook xử lý xác thực
│   ├── usePagination.ts   # Hook xử lý phân trang
│   └── index.ts           # Export tất cả hooks
│
├── pages/                 # Các trang của ứng dụng
│   ├── auth/              # Trang xác thực
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ForgotPassword.tsx
│   ├── blog/              # Trang blog
│   │   ├── BlogList.tsx
│   │   ├── BlogDetail.tsx
│   │   └── ...
│   ├── dashboard/         # Trang dashboard
│   ├── consultation/      # Trang tư vấn
│   ├── menstrualCycle/    # Trang theo dõi chu kỳ kinh nguyệt
│   ├── stiTesting/        # Trang xét nghiệm STI
│   └── Home.tsx           # Trang chủ
│
├── redux/                 # State management với Redux Toolkit
│   ├── hooks.ts           # Custom hooks cho Redux
│   ├── store.ts           # Cấu hình Redux store
│   └── slices/            # Redux slices
│       ├── authSlice.ts   # Slice quản lý xác thực
│       ├── blogSlice.ts   # Slice quản lý blog
│       └── ...
│
├── routes/                # Định nghĩa routes
│   ├── PrivateRoute.tsx   # Route bảo vệ (yêu cầu đăng nhập)
│   ├── PublicRoute.tsx    # Route công khai
│   └── index.tsx          # Cấu hình routes
│
├── styles/                # Global styles
│   ├── global.css         # CSS toàn cục
│   ├── variables.css      # CSS variables
│   └── themes/            # Các theme
│
├── types/                 # TypeScript type definitions
│   ├── index.ts           # Export tất cả types
│   └── ...
│
├── utils/                 # Các hàm tiện ích
│   ├── dateUtils.ts       # Xử lý ngày tháng
│   ├── localStorage.ts    # Xử lý localStorage
│   ├── validation.ts      # Xử lý validation
│   └── index.ts           # Export tất cả utils
│
├── App.tsx                # Component gốc
├── main.tsx               # Entry point
└── vite-env.d.ts         # Vite environment types
```

## Công nghệ sử dụng

- **React**: Thư viện UI
- **TypeScript**: Ngôn ngữ lập trình
- **Redux Toolkit**: State management
- **Ant Design**: UI component library
- **Axios**: HTTP client
- **React Router**: Routing
- **Vite**: Build tool
- **TailwindCSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Moment.js**: Xử lý thời gian
- **React Icons**: Icon library

## Tính năng chính

1. **Xác thực người dùng**: Đăng nhập, đăng ký, quên mật khẩu, quản lý profile
2. **Blog & Chia sẻ kiến thức**: Xem và tìm kiếm bài viết, đăng bình luận
3. **Theo dõi chu kỳ kinh nguyệt**: Ghi lại chu kỳ, dự đoán ngày rụng trứng, nhắc nhở uống thuốc
4. **Tư vấn trực tuyến**: Đặt lịch tư vấn với chuyên gia, đặt câu hỏi
5. **Xét nghiệm STI**: Đặt lịch xét nghiệm, xem kết quả

## API Integration

Ứng dụng sử dụng Axios để gọi API từ backend. Các request API được tổ chức theo modules tương ứng với các tính năng của ứng dụng.

## Authentication Flow

1. **Đăng nhập**: Người dùng đăng nhập và nhận JWT token
2. **Lưu trữ token**: Token được lưu trong localStorage
3. **Gửi token**: Token được gửi trong header của mỗi request API
4. **Refresh token**: Sử dụng refresh token khi JWT token hết hạn
5. **Đăng xuất**: Xóa token và chuyển hướng đến trang đăng nhập

## Hướng dẫn phát triển

1. Clone repository
2. Cài đặt dependencies: `npm install`
3. Khởi chạy development server: `npm run dev` 