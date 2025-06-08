# 🔧 Sửa lỗi Medicines APIs

## ❌ **Vấn đề đã phát hiện:**

### 1. **Phân quyền quá hạn chế**
- **Trước:** GET `/medicines` chỉ cho `doctor, staff`
- **Lỗi:** Customer và Manager không thể access
- **Sửa:** Mở rộng cho `customer, doctor, staff, manager`

### 2. **Query cứng isActive = true**
- **Trước:** Tất cả roles chỉ xem thuốc active
- **Lỗi:** Manager không thể quản lý thuốc inactive  
- **Sửa:** Manager xem tất cả, roles khác chỉ xem active

### 3. **Thiếu validation ObjectId**
- **Trước:** Không validate ID format
- **Lỗi:** Gây lỗi cast khi ID không đúng format
- **Sửa:** Thêm regex check ObjectId format

## ✅ **Các thay đổi đã thực hiện:**

### 1. **Routes (medicinesRoutes.ts):**
```typescript
// OLD: roleMiddleware(['doctor', 'staff'])
// NEW: roleMiddleware(['customer', 'doctor', 'staff', 'manager'])
```

### 2. **Controller (medicinesController.ts):**
```typescript
// OLD: const query: any = { isActive: true };
// NEW: 
const userRole = (req as any).user?.role;
const query: any = {};
if (userRole !== 'manager') {
  query.isActive = true; // Manager xem tất cả
}
```

### 3. **Validation ObjectId:**
```typescript
// NEW: Thêm validation
if (!id.match(/^[0-9a-fA-F]{24}$/)) {
  return res.status(400).json({
    message: 'ID thuốc không hợp lệ'
  });
}
```

### 4. **Response thêm field isActive:**
```typescript
.select('name type description defaultDosage defaultTimingInstructions isActive');
```

## 🧪 **Test Cases mới:**

### ✅ Test 1: Customer có thể lấy danh sách thuốc
```bash
# Với Customer token (should work now)
curl -X GET "http://localhost:5000/api/medicines" \
  -H "Authorization: Bearer <customer_token>"
```

### ✅ Test 2: Manager xem được cả thuốc inactive
```bash
# Với Manager token (should see all medicines)
curl -X GET "http://localhost:5000/api/medicines" \
  -H "Authorization: Bearer <manager_token>"
```

### ✅ Test 3: Doctor/Staff chỉ xem thuốc active
```bash
# Với Doctor token (should see only active medicines)
curl -X GET "http://localhost:5000/api/medicines" \
  -H "Authorization: Bearer <doctor_token>"
```

### ✅ Test 4: Validation ObjectId
```bash
# Invalid ID format (should return 400)
curl -X GET "http://localhost:5000/api/medicines/invalid-id" \
  -H "Authorization: Bearer <token>"

# Valid ID format (should work or 404)
curl -X GET "http://localhost:5000/api/medicines/6842626f3f463d51a158639" \
  -H "Authorization: Bearer <token>"
```

## 📋 **Summary logic mới:**

| Role | GET /medicines | Xem thuốc inactive? | Ghi chú |
|------|---------------|-------------------|---------|
| Customer | ✅ Allowed | ❌ Chỉ active | Để chọn khi đặt lịch |
| Doctor | ✅ Allowed | ❌ Chỉ active | Để kê đơn |
| Staff | ✅ Allowed | ❌ Chỉ active | Để hỗ trợ |
| Manager | ✅ Allowed | ✅ Tất cả | Để quản lý |
| Guest | ❌ Forbidden | - | Không login |

## 🎯 **Kết quả mong đợi:**
- ✅ Customer và Manager có thể lấy danh sách thuốc
- ✅ Manager thấy cả thuốc inactive (isActive: false)
- ✅ ID validation tránh lỗi cast
- ✅ Response trả về field isActive để frontend biết trạng thái

**Test lại qua Swagger UI hoặc curl để xác nhận!** 