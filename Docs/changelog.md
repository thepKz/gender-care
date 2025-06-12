## [Ngày: 2024-06-09] Chuẩn hóa endpoint API FE
- Đã sửa tất cả các nơi cấu hình baseURL (axiosConfig.ts, servicePackageApi.ts, handleAPI.ts, env.ts) để luôn thêm /api vào sau VITE_API_URL.
- Lý do: đồng bộ, dễ bảo trì, tránh thiếu prefix khi gọi API.
- Tác giả: AI 

## [Ngày: 2024-06-09] Sửa lỗi thiếu fallback cho VITE_API_URL
- Đã thêm fallback cho VITE_API_URL ở tất cả các nơi cấu hình baseURL (axiosConfig.ts, servicePackageApi.ts, handleAPI.ts, env.ts) để tránh lỗi undefined/api, đảm bảo luôn có endpoint hợp lệ.
- Tác giả: AI 