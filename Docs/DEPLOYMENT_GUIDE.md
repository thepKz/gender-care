# Deployment Guide - Fix 404/500 Errors

## Vấn đề đã được fix:

### 1. Lỗi 404 cho assets
- **Nguyên nhân**: Vite build không tạo đúng path cho assets
- **Giải pháp**: Cập nhật `vite.config.ts` với base path và asset naming đúng

### 2. Lỗi 500 Internal Server Error  
- **Nguyên nhân**: Server không xử lý SPA routing đúng cách
- **Giải pháp**: Cập nhật `_redirects`, `_headers`, và `web.config`

## Build và Deploy Steps:

### 1. Build Production
```bash
cd Frontend
npm run build
```

### 2. Kiểm tra build output
```bash
# Kiểm tra file index.html trong dist/
cat dist/index.html

# Đảm bảo assets được tạo đúng
ls -la dist/assets/
```

### 3. Deploy lên server
```bash
# Upload toàn bộ thư mục dist/ lên server
# Đảm bảo các file sau được upload:
# - index.html
# - assets/ (tất cả JS/CSS files)
# - fonts/ (font files)
# - images/ (image files)
# - _redirects
# - _headers  
# - web.config
# - nginx.conf
```

### 4. Server Configuration

#### Cho Netlify:
- File `_redirects` đã được cấu hình đúng
- File `_headers` đã được cấu hình đúng

#### Cho IIS:
- File `web.config` đã được cấu hình đúng
- Đảm bảo URL Rewrite module được cài đặt

#### Cho Nginx:
- Copy `nginx.conf` vào server
- Restart nginx service

### 5. Kiểm tra sau deploy
```bash
# Test homepage
curl -I https://your-domain.com

# Test assets
curl -I https://your-domain.com/assets/main-*.js
curl -I https://your-domain.com/assets/main-*.css

# Test SPA routing
curl -I https://your-domain.com/any-route
```

## Troubleshooting:

### Nếu vẫn lỗi 404:
1. Kiểm tra file `index.html` có reference đúng assets không
2. Đảm bảo base path trong `vite.config.ts` đúng
3. Kiểm tra server configuration

### Nếu vẫn lỗi 500:
1. Kiểm tra server logs
2. Đảm bảo `_redirects` hoặc `web.config` được load
3. Test với curl để xác định lỗi cụ thể

## Files đã được cập nhật:
- ✅ `vite.config.ts` - Fix build configuration
- ✅ `index.html` - Fix base path
- ✅ `public/_redirects` - Fix SPA routing
- ✅ `public/_headers` - Fix CORS và security
- ✅ `public/web.config` - Fix IIS configuration
- ✅ `DEPLOYMENT_GUIDE.md` - Hướng dẫn deployment

## Lưu ý quan trọng:
- **Rebuild** project sau khi thay đổi cấu hình
- **Clear cache** browser sau khi deploy
- **Test** trên nhiều browser khác nhau
- **Monitor** server logs để phát hiện lỗi 