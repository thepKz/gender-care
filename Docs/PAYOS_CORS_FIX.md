# PayOS CORS Configuration Fix

## Vấn đề
PayOS redirect từ `https://pay.payos.vn` về frontend `http://localhost:5173/payment/success` bị CORS policy chặn:

```
Access to fetch at 'http://localhost:5173/payment/success?...' from origin 'https://pay.payos.vn' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
1. PayOS domain `https://pay.payos.vn` không có trong Backend CORS allowedOrigins
2. Vite dev server không có CORS configuration cho PayOS requests
3. PayOS có thể đang fetch data từ frontend URL trước khi redirect

## Giải pháp đã áp dụng

### 1. Backend CORS Update (Backend/src/index.ts)

#### Thêm PayOS domains vào allowedOrigins:
```typescript
const allowedOrigins = [
  // ... existing origins
  // ✅ ADD: PayOS domains for payment processing
  'https://pay.payos.vn',
  'https://payos.vn', 
  'https://api.payos.vn'
];
```

#### Cập nhật CORS headers:
```typescript
allowedHeaders: [
  'Content-Type', 
  'Authorization', 
  'X-Requested-With',
  // ✅ ADD: PayOS specific headers
  'X-PayOS-Signature',
  'X-PayOS-Webhook-Id'
],
```

#### Thêm PayOS request handling middleware:
```typescript
// ✅ ADD: PayOS specific headers and debugging
if (req.headers.origin?.includes('payos.vn')) {
  console.log('🔍 PayOS Request detected:', {
    origin: req.headers.origin,
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent']
  });
  
  // Allow PayOS to access response
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

### 2. Frontend Vite Config Update (Frontend/vite.config.ts)

#### Thêm CORS configuration:
```typescript
server: {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://pay.payos.vn',
      'https://payos.vn',
      'https://api.payos.vn'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Embedder-Policy': 'unsafe-none',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  },
  // ... existing proxy config
}
```

## Testing

### 1. Khởi động lại Backend và Frontend:
```bash
# Backend
cd Backend
npm run dev

# Frontend  
cd Frontend
npm run dev
```

### 2. Test Payment Flow:
1. Tạo appointment booking và thanh toán
2. Verify PayOS redirect về `/payment/success` works
3. Check console logs cho PayOS request debugging
4. Confirm webhook processing thành công

### 3. Monitor Logs:
- Backend: Tìm "🔍 PayOS Request detected" logs
- Frontend: Check không còn CORS errors
- PayOS: Verify return URL accessible

## Production Considerations

### Environment Variables cần setup:
```bash
# Backend
FRONTEND_URL=https://your-production-domain.com

# Frontend  
VITE_API_URL=https://your-backend-domain.com
```

### Production CORS Config:
- Remove `*` trong Access-Control-Allow-Origin 
- Chỉ allow specific production domains
- Keep PayOS domains trong allowedOrigins

## Troubleshooting

### Nếu vẫn có CORS errors:
1. Check network tab cho exact origin đang bị reject
2. Verify environment variables setup đúng
3. Restart cả Backend và Frontend
4. Check PayOS webhook configuration

### Common Issues:
- Return URL format không đúng
- Environment variables missing  
- Firewall blocking PayOS domains
- Dev tools caching old CORS headers

## Related Files Modified:
- `Backend/src/index.ts` - CORS configuration
- `Frontend/vite.config.ts` - Dev server setup
- `Backend/src/services/payosService.ts` - PayOS integration
- Payment controllers - Return URL setup

---
*Updated: 2024-01-XX*
*Author: AI Assistant* 