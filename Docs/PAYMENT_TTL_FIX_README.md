# 🛠️ PaymentTracking TTL Fix - CRITICAL UPDATE

## 🚨 Vấn đề đã được Fix

**Nguyên nhân dữ liệu payment bị mất:**
- TTL (Time To Live) Index trong MongoDB đang tự động XÓA TẤT CẢ payment records sau 15 phút
- Điều này xóa cả payment thành công và thất bại, làm mất audit trail quan trọng

## ✅ Giải pháp đã implement

### 1. **Sửa PaymentTracking Model**
- ❌ Removed: `index: { expireAfterSeconds: 0 }` trên field `expiresAt`
- ✅ Added: Conditional TTL chỉ áp dụng cho `status: "pending"`
- ✅ Added: Logic set `expiresAt = null` khi payment hoàn thành

### 2. **Cơ chế mới:**
- **Pending payments**: Tự động xóa sau 15 phút (cleanup spam)
- **Successful payments**: Giữ vĩnh viễn cho audit trail
- **Failed payments**: Giữ vĩnh viễn cho troubleshooting
- **Cancelled payments**: Giữ vĩnh viễn cho reporting

## 🚀 Cách chạy Migration

### Bước 1: Backup Database (Quan trọng!)
```bash
mongodump --uri="your-mongodb-uri" --out=backup-before-payment-fix
```

### Bước 2: Chạy Migration Script
```bash
cd Backend
npm run fix-payment-ttl
```

### Bước 3: Restart Application
```bash
npm run dev
```

## 📊 Kết quả mong đợi

After migration:
- ✅ Existing successful payments được preserved
- ✅ Failed payments được preserved for analysis  
- ✅ Cancelled payments được preserved for audit
- ✅ Chỉ pending payments > 15 phút bị cleanup
- ✅ Future payments sẽ automatically preserve khi completed

## 🔍 Verify Fix hoạt động

### Check MongoDB TTL Indexes:
```javascript
db.paymenttrackings.getIndexes()
```

Should see:
```javascript
{
  "expiresAt_1": {
    "key": { "expiresAt": 1 },
    "expireAfterSeconds": 0,
    "partialFilterExpression": { 
      "status": "pending",
      "expiresAt": { "$ne": null }
    }
  }
}
```

### Check Payment Data:
```javascript
// Count by status
db.paymenttrackings.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Check which ones have expiry
db.paymenttrackings.aggregate([
  { 
    $group: { 
      _id: "$status", 
      total: { $sum: 1 },
      withExpiry: { $sum: { $cond: [{ $ne: ["$expiresAt", null] }, 1, 0] } }
    } 
  }
])
```

## ⚠️ Important Notes

1. **Existing Data**: Migration script sẽ fix tất cả existing completed payments
2. **Index Change**: MongoDB sẽ rebuild TTL index with partial filter
3. **No Downtime**: Changes are backward compatible
4. **Future Proof**: All new payments tự động follow new logic

## 🛡️ Data Protection Strategy

### Before (Problematic):
```
Payment Created → 15 minutes → AUTO DELETE (❌ Lost forever)
```

### After (Fixed):
```
Pending Payment → 15 minutes → AUTO DELETE (✅ Cleanup spam)
Successful Payment → NEVER DELETE (✅ Preserve for audit)
Failed Payment → NEVER DELETE (✅ Keep for analysis)
```

## 🚨 Emergency Rollback (if needed)

If something goes wrong:

1. **Restore from backup:**
```bash
mongorestore --uri="your-mongodb-uri" backup-before-payment-fix
```

2. **Revert model changes in git:**
```bash
git checkout HEAD~1 -- src/models/PaymentTracking.ts
```

## 📝 Files Changed

- `src/models/PaymentTracking.ts` - Fixed TTL logic
- `src/scripts/fixPaymentTrackingTTL.ts` - Migration script
- `src/controllers/paymentController.ts` - Added preservation logs
- `package.json` - Added migration command

## ✅ Verification Checklist

- [ ] Backup completed
- [ ] Migration script ran successfully 
- [ ] Application restarted
- [ ] Test new payment flow
- [ ] Verify old payments still exist
- [ ] Check MongoDB indexes
- [ ] Confirm no payment data loss

## 📞 Support

If có vấn đề gì với migration, báo ngay để troubleshoot!

**Expected result**: Dữ liệu payment giờ sẽ được bảo toàn vĩnh viễn cho audit trail và reporting! 🎉 