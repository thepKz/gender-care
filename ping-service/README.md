# Ping Service

Service đơn giản để ping backend mỗi 1 phút để giữ cho render.com không bị sleep.

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file .env (hoặc sử dụng giá trị mặc định):
```
BACKEND_URL=https://gender-healthcare-service-management.onrender.com/api/doctors
PING_INTERVAL=60000
```

## Chạy service

```bash
npm start
```

Service sẽ:
- Ping backend ngay khi khởi động
- Tiếp tục ping mỗi 1 phút
- Log kết quả ping vào console

## Lưu ý

- Service này nên được chạy trên một server riêng biệt
- Có thể điều chỉnh thời gian ping bằng cách thay đổi PING_INTERVAL trong file .env
- Đảm bảo server có kết nối internet ổn định 