# 🏦 PAYMENT SYSTEM REFACTORING - SINGLE SOURCE SOLUTION

## 📊 Current State Analysis

### **Current Models Structure (Problems)**

```typescript
// 🔴 CURRENT: Hai models với data duplication
Appointments {
  billId?: ObjectId                               // 🔴 UNUSED - Bills model will be removed
  paymentStatus?: "unpaid" | "paid" | "partial"  // 🔴 REDUNDANT - Duplicate with PaymentTracking.status
  totalAmount?: number                            // 🔴 REDUNDANT - Duplicate with PaymentTracking.amount
  status: "pending_payment" | "confirmed"...      // 🟡 Mix business + payment concerns
}

DoctorQA {
  // ❌ MISSING: Không có payment reference
  consultationFee: number                         // 🔴 REDUNDANT - Should be in PaymentTracking.amount
  status: "pending_payment" | "scheduled"...      // 🟡 Mix business + payment concerns
}

PaymentTracking {
  serviceType: 'appointment' | 'consultation'     // ✅ Universal service type
  recordId: ObjectId                              // ✅ Universal reference  
  billId?: ObjectId                               // 🔴 UNUSED - Bills will be removed
  amount: number                                  // ✅ Payment amount
  status: "pending" | "success" | "failed"       // ✅ Payment status (updated via webhook)
  orderCode: number                               // ✅ PayOS integration
  paymentGateway: string                          // ✅ Gateway specific
  transactionInfo: {}                             // ✅ Gateway response data
  expiresAt: Date                                 // ✅ TTL cleanup for pending payments
}
```

### **🔍 Data Redundancy Analysis**

| Field | Appointments | DoctorQA | PaymentTracking | Status |
|-------|-------------|----------|-----------------|--------|
| **Payment Amount** | totalAmount | consultationFee | amount | 🔴 3 places for same data |
| **Payment Status** | paymentStatus | N/A | status | 🔴 2 places for same data |
| **Service Reference** | N/A | N/A | recordId | ✅ Only in PaymentTracking |
| **User Reference** | createdByUserId | userId | customerName | 🔴 3 different ways |
| **Business Identifier** | N/A | N/A | ❌ Missing | 🔴 No billNumber equivalent |
| **PayOS Integration** | N/A | N/A | orderCode + gateway | ✅ Only in PaymentTracking |

**Kết luận:** PaymentTracking đã có most payment logic, chỉ thiếu business fields (userId, billNumber)

---

## 🚨 Current Problems Identified

### **1. Data Redundancy**
```typescript
// ❌ VẤN ĐỀ: Payment amount ở 3 nơi khác nhau
appointment.totalAmount = 150000       // Appointment model
consultation.consultationFee = 150000  // DoctorQA model  
paymentTracking.amount = 150000        // PaymentTracking model
```

### **2. Payment Status Duplication**
```typescript
// ❌ VẤN ĐỀ: Payment status ở 2 nơi
appointment.paymentStatus = "paid"     // Updated qua webhook
paymentTracking.status = "success"     // Updated qua webhook  
// Cần sync 2 places mỗi khi có payment update!
```

### **3. Incomplete Payment References**
```typescript
// ❌ VẤN ĐỀ: DoctorQA không có payment reference
const consultation = await DoctorQA.findById(id);
// Làm sao tìm được payment data của consultation này?

// ✅ APPOINTMENT: Có billId reference (nhưng Bills sẽ bị remove)
const appointment = await Appointments.findById(id).populate('billId');
```

### **4. Missing Business Fields in PaymentTracking**
```typescript
// ❌ VẤN ĐỀ: PaymentTracking thiếu business identifier
const payment = await PaymentTracking.findOne({ recordId });
// Không có billNumber để generate invoice hoặc receipt!
// Không có userId reference, chỉ có customerName string!
```

---

## 💡 SOLUTION: Enhanced PaymentTracking (Single Source)

### **🎯 Enhanced PaymentTracking Model**

```typescript
// ✅ ENHANCED PaymentTracking - Single Source of Truth
interface IPaymentTracking {
  // Service references
  serviceType: 'appointment' | 'consultation' | 'package';
  recordId: ObjectId;           // Universal reference (appointmentId OR doctorQAId)
  appointmentId?: ObjectId;     // 🆕 EXPLICIT: Appointment reference
  doctorQAId?: ObjectId;        // 🆕 ADD: Consultation reference
  packageId?: ObjectId;         // Existing package reference
  
  // Business fields (from Bills)
  userId: ObjectId;             // 🆕 ADD: User reference
  billNumber: string;           // 🆕 ADD: Business identifier for invoices
  totalAmount: number;          // 🆕 RENAME: from amount (primary payment amount)
  description: string;          // Service description
  
  // PayOS integration (existing)
  orderCode: number;            // PayOS order identifier
  paymentLinkId?: string;       // PayOS payment link ID
  paymentGateway: 'payos';      // Payment gateway type
  paymentUrl?: string;          // Payment checkout URL
  
  // Customer info (existing)
  customerName: string;         // Customer name
  customerEmail?: string;       // Customer email
  customerPhone?: string;       // Customer phone
  
  // Status & tracking (existing)
  status: "pending" | "paid" | "cancelled" | "failed" | "expired";
  transactionInfo?: {           // PayOS transaction response
    reference?: string;
    transactionDateTime?: string;
    counterAccountInfo?: any;
    virtualAccount?: any;
  };
  webhookReceived?: boolean;    // Webhook processing flag
  webhookProcessedAt?: Date;    // Webhook timestamp
  
  // TTL cleanup (existing)
  expiresAt?: Date;             // Auto-delete pending payments after 15 mins
  
  createdAt: Date;
  updatedAt: Date;
}

// ✅ SIMPLIFIED Appointments (remove payment fields)
interface IAppointments {
  // Core business fields only
  createdByUserId: ObjectId;
  profileId: ObjectId;
  serviceId?: ObjectId;
  packageId?: ObjectId;
  doctorId?: ObjectId;
  appointmentDate: Date;
  appointmentTime: string;
  appointmentType: "consultation" | "test" | "other";
  typeLocation: "clinic" | "home" | "Online";
  address?: string;
  description?: string;
  notes?: string;
  
  // Business status only (no payment mix)
  status: "pending" | "scheduled" | "confirmed" | "consulting" | "completed" | "cancelled";
  
  // Payment reference
  paymentTrackingId?: ObjectId; // 🆕 REPLACE: billId → paymentTrackingId
  
  // ❌ REMOVE: paymentStatus, totalAmount, billId, paymentLinkId, expiresAt
}

// ✅ SIMPLIFIED DoctorQA (remove payment fields, add payment reference)
interface IDoctorQA {
  // Core business fields only
  doctorId?: ObjectId;
  userId: ObjectId;
  fullName: string;
  phone: string;
  notes?: string;
  question: string;
  age: number;
  gender: string;
  serviceId?: ObjectId;
  serviceName?: string;
  appointmentDate?: Date;
  appointmentSlot?: string;
  slotId?: ObjectId;
  doctorNotes?: string;
  
  // Business status only (no payment mix)
  status: "pending" | "scheduled" | "consulting" | "completed" | "cancelled";
  
  // Payment reference
  paymentTrackingId?: ObjectId; // 🆕 ADD: Payment reference
  
  // ❌ REMOVE: consultationFee (move to PaymentTracking.totalAmount)
}
```

### **🔄 Payment Flow (Single Source)**

```typescript
// ✅ SIMPLIFIED FLOW: PaymentTracking as Single Source of Truth
async createPayment(serviceType: 'appointment' | 'consultation', recordId: string, amount: number) {
  // Single payment record creation
  const payment = await PaymentTracking.create({
    serviceType,
    recordId,
    [serviceType === 'appointment' ? 'appointmentId' : 'doctorQAId']: recordId,
    userId: getServiceUserId(serviceType, recordId),
    billNumber: generateBillNumber(),
    totalAmount: amount,
    description: getServiceDescription(serviceType, recordId),
    orderCode: generateOrderCode(),
    paymentGateway: 'payos',
    status: 'pending'
  });
  
  // Update service record with payment reference
  await updateServiceRecord(serviceType, recordId, { 
    paymentTrackingId: payment._id 
  });
  
  // Generate PayOS payment link
  const paymentUrl = await createPayOSLink(payment);
  payment.paymentUrl = paymentUrl;
  await payment.save();
  
  return payment;
}

// ✅ SIMPLIFIED WEBHOOK: Single source update
async processWebhook(orderCode: number, paymentResult: any) {
  const payment = await PaymentTracking.findOne({ orderCode });
  
  if (paymentResult.success) {
    // Single update - PaymentTracking only
    await PaymentTracking.findByIdAndUpdate(payment._id, {
      status: 'paid',
      transactionInfo: paymentResult.data,
      webhookReceived: true,
      webhookProcessedAt: new Date(),
      expiresAt: null  // Remove TTL expiry
    });
    
    // Update service business status
    if (payment.appointmentId) {
      await Appointments.findByIdAndUpdate(payment.appointmentId, {
        status: 'confirmed'
      });
    } else if (payment.doctorQAId) {
      await DoctorQA.findByIdAndUpdate(payment.doctorQAId, {
        status: 'scheduled'
      });
    }
  } else {
    // Payment failed
    await PaymentTracking.findByIdAndUpdate(payment._id, {
      status: 'failed',
      webhookReceived: true,
      webhookProcessedAt: new Date()
    });
  }
}

// ✅ SIMPLIFIED CHECK: Single source query
async checkPaymentStatus(serviceType: string, recordId: string) {
  const payment = await PaymentTracking.findOne({
    [serviceType === 'appointment' ? 'appointmentId' : 'doctorQAId']: recordId
  });
  
  return {
    paymentStatus: payment.status,    // Single source of truth
    amount: payment.totalAmount,      // Single source amount
    billNumber: payment.billNumber,   // Business identifier
    orderCode: payment.orderCode      // PayOS identifier
  };
}
```

---

## 🗑️ Models to Remove

### **Bills Model - Complete Removal**

```typescript
// ❌ REMOVE COMPLETELY: Bills model không cần thiết
interface IBills {
  userId: ObjectId;           // → Move to PaymentTracking.userId
  billNumber: string;         // → Move to PaymentTracking.billNumber  
  appointmentId?: ObjectId;   // → Already in PaymentTracking.appointmentId
  totalAmount: number;        // → Already in PaymentTracking.amount (rename to totalAmount)
  status: string;             // → Already in PaymentTracking.status
  createdAt: Date;            // → Already in PaymentTracking.createdAt
  updatedAt: Date;            // → Already in PaymentTracking.updatedAt
}

// File to delete: Backend/src/models/Bills.ts
```

### **References to Clean Up**

```typescript
// ✅ UPDATE: Remove all billId references
// Files to update:
// - Backend/src/models/Appointments.ts (remove billId field)
// - Backend/src/models/DoctorQA.ts (no billId currently, good)
// - Backend/src/models/PaymentTracking.ts (remove billId field)
// - Backend/src/controllers/*Controller.ts (remove Bills imports and usage)
// - Backend/src/services/*.ts (remove Bills imports and usage)
```

---

## 🔥 MIGRATION STRATEGY

### **Phase 1: Add Missing References**
```sql
-- Add doctorQAId to Bills
ALTER TABLE bills ADD COLUMN doctorQAId ObjectId;

-- Add billId to DoctorQA
ALTER TABLE doctorqa ADD COLUMN billId ObjectId;
```

### **Phase 2: Update Controllers**
```typescript
// Update consultation creation to create Bills
async createConsultation(data) {
  const consultation = await DoctorQA.create(data);
  
  const bill = await Bills.create({
    userId: data.userId,
    doctorQAId: consultation._id,
    totalAmount: data.consultationFee
  });
  
  consultation.billId = bill._id;
  await consultation.save();
}
```

### **Phase 3: Update Webhook Logic**
```typescript
// Update webhook to sync Bills status
async processWebhook(orderCode) {
  const paymentTracking = await PaymentTracking.findOne({ orderCode });
  
  // ✅ ADD: Update Bills status
  if (paymentTracking.billId) {
    await Bills.findByIdAndUpdate(paymentTracking.billId, {
      status: paymentResult.success ? 'paid' : 'failed'
    });
  }
}
```

### **Phase 4: Remove Redundant Fields**
```typescript
// Remove paymentStatus from Appointments
// Remove consultationFee from DoctorQA
// Update all payment status checks to use Bills
```

---

## 🎯 Migration Plan

### **Step 1: Enhance PaymentTracking Model**
```typescript
// Add missing business fields to PaymentTracking
PaymentTrackingSchema.add({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  billNumber: { 
    type: String, 
    required: true,
    unique: true 
  },
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointments' 
  },
  doctorQAId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DoctorQA' 
  }
});

// Rename amount → totalAmount
PaymentTrackingSchema.add({
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0 
  }
});

// Auto-generate billNumber
PaymentTrackingSchema.pre('save', function() {
  if (!this.billNumber) {
    this.billNumber = `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
});
```

### **Step 2: Update Service Models**
```typescript
// Remove payment fields from Appointments
interface IAppointments {
  // ❌ REMOVE these payment-related fields:
  // paymentStatus?: "unpaid" | "paid" | "partial" | "refunded";
  // totalAmount?: number;
  // billId?: ObjectId;
  // paymentLinkId?: string;
  // expiresAt?: Date;
  
  // ✅ ADD payment reference
  paymentTrackingId?: ObjectId;
  
  // ✅ KEEP business-only status
  status: "pending" | "scheduled" | "confirmed" | "consulting" | "completed" | "cancelled";
}

// Add payment reference to DoctorQA
interface IDoctorQA {
  // ❌ REMOVE payment field:
  // consultationFee: number;
  
  // ✅ ADD payment reference
  paymentTrackingId?: ObjectId;
  
  // ✅ KEEP business-only status
  status: "pending" | "scheduled" | "consulting" | "completed" | "cancelled";
}
```

### **Step 3: Remove Bills Model & References**
```bash
# Files to delete
rm Backend/src/models/Bills.ts

# Files to update (remove Bills imports and usage)
# - Backend/src/controllers/appointmentController.ts
# - Backend/src/controllers/packagePurchaseController.ts  
# - Backend/src/controllers/paymentController.ts
# - Backend/src/services/paymentService.ts
# - Any other files importing Bills
```

### **Step 4: Update Controllers & Services**
```typescript
// Update appointment creation
async createAppointment(data) {
  const appointment = await Appointments.create({
    ...data,
    status: 'pending'  // Remove 'pending_payment', use business status only
  });
  
  // Create payment separately
  const payment = await PaymentTracking.create({
    serviceType: 'appointment',
    recordId: appointment._id,
    appointmentId: appointment._id,
    userId: data.createdByUserId,
    totalAmount: calculateAppointmentAmount(data),
    billNumber: generateBillNumber(),
    orderCode: generateOrderCode(),
    status: 'pending'
  });
  
  // Link payment to appointment
  appointment.paymentTrackingId = payment._id;
  await appointment.save();
  
  return { appointment, payment };
}

// Update consultation creation
async createConsultation(data) {
  const consultation = await DoctorQA.create({
    ...data,
    status: 'pending'  // Remove 'pending_payment', use business status only
  });
  
  // Create payment separately  
  const payment = await PaymentTracking.create({
    serviceType: 'consultation',
    recordId: consultation._id,
    doctorQAId: consultation._id,
    userId: data.userId,
    totalAmount: data.consultationFee,  // Get fee from input, not model
    billNumber: generateBillNumber(),
    orderCode: generateOrderCode(),
    status: 'pending'
  });
  
  // Link payment to consultation
  consultation.paymentTrackingId = payment._id;
  await consultation.save();
  
  return { consultation, payment };
}
```

---

## ✅ Final Architecture

### **Single PaymentTracking Model**
```typescript
interface IPaymentTracking {
  // Service identification
  serviceType: 'appointment' | 'consultation' | 'package';
  recordId: ObjectId;           // Universal reference
  appointmentId?: ObjectId;     // Explicit appointment reference
  doctorQAId?: ObjectId;        // Explicit consultation reference
  packageId?: ObjectId;         // Package reference
  
  // Business data
  userId: ObjectId;             // User who made payment
  billNumber: string;           // Business identifier (auto-generated)
  totalAmount: number;          // Payment amount
  description: string;          // Service description
  
  // PayOS integration
  orderCode: number;            // PayOS order ID
  paymentLinkId?: string;       // PayOS payment link
  paymentGateway: 'payos';      // Gateway type
  paymentUrl?: string;          // Checkout URL
  
  // Customer info
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Payment status & tracking
  status: "pending" | "paid" | "cancelled" | "failed" | "expired";
  transactionInfo?: object;     // PayOS response data
  webhookReceived?: boolean;
  webhookProcessedAt?: Date;
  
  // TTL cleanup
  expiresAt?: Date;             // Auto-delete pending payments
  
  createdAt: Date;
  updatedAt: Date;
}
```

### **Benefits of This Architecture**
1. **🎯 True Single Source**: All payment data in one place
2. **⚡ Zero Duplication**: No redundant payment fields across models  
3. **🚀 Performance**: Direct queries, no joins needed
4. **📋 Complete**: Business identifier + gateway integration + TTL
5. **🔧 Maintainable**: Single model to manage and update
6. **🎛️ Extensible**: Easy to add new payment gateways

### **Implementation Checklist**
- [ ] **Step 1**: Enhance PaymentTracking model (add userId, billNumber, appointmentId, doctorQAId, rename amount)
- [ ] **Step 2**: Update Appointments model (remove paymentStatus, totalAmount, billId; add paymentTrackingId)  
- [ ] **Step 3**: Update DoctorQA model (remove consultationFee; add paymentTrackingId)
- [ ] **Step 4**: Delete Bills model completely
- [ ] **Step 5**: Update appointment controllers (create payment separately)
- [ ] **Step 6**: Update consultation controllers (create payment separately)
- [ ] **Step 7**: Update webhook logic (single PaymentTracking update)
- [ ] **Step 8**: Update frontend queries (use PaymentTracking directly)

**Result**: Clean, efficient, single source of truth payment system! 🎉 