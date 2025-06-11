# Frontend Development Quickstart Guide

## 🚀 Quick Setup

```bash
cd Frontend
npm install
npm run dev
```

## 📁 Cấu trúc mới (Sau khi Restructure)

```
src/
├── api/                    # ✅ Unified API layer
│   ├── endpoints/          # API definitions
│   ├── services/           # API calls (merged từ apis/)
│   └── axiosConfig.ts
├── components/
│   ├── feature/           # ✅ Business logic components
│   │   ├── auth/          # Authentication
│   │   ├── dashboard/     # Dashboard features  
│   │   ├── medical/       # Medical services
│   │   ├── profile/       # User profiles
│   │   └── userProfile/   # Profile management
│   ├── ui/                # ✅ Pure UI components
│   │   ├── common/        # Shared UI
│   │   ├── cards/         # Card components
│   │   ├── forms/         # Form components
│   │   ├── modals/        # Modal components
│   │   └── doctor/        # Doctor UI
│   └── layouts/           # Layout components
├── pages/                 # ✅ Cleaned up pages
├── shared/                # ✅ Renamed từ share/
└── ...                   # Other standard folders
```

## 🎯 Quy tắc làm việc

### **1. Tạo Component mới**

#### UI Component (Reusable)
```bash
# Tạo trong components/ui/
src/components/ui/buttons/CustomButton.tsx
```

#### Feature Component (Business Logic)  
```bash
# Tạo trong components/feature/
src/components/feature/booking/BookingForm.tsx
```

### **2. API Integration**

```typescript
// ✅ Preferred - Import từ unified API
import { api, doctorAPI } from '@/api';

// ✅ Specific import
import { doctorAPI } from '@/api/services/doctorAPI';
```

### **3. Import Patterns**

```typescript
// UI Components
import { FloatingAppointmentButton } from '@/components/ui/common';
import { ServiceCard } from '@/components/ui/cards';

// Feature Components  
import { ProfileForm } from '@/components/feature/profile';
import { DashboardWrapper } from '@/components/feature/dashboard';

// Pages
import HomePage from '@/pages/home';
```

## 🔧 Development Workflow

### **Step 1: Hiểu requirement**
- Xác định component thuộc UI hay Feature
- Kiểm tra có reuse được không

### **Step 2: Chọn location**
```bash
UI Component    → components/ui/[category]/
Feature Component → components/feature/[domain]/  
Page Component    → pages/[route]/
```

### **Step 3: Follow conventions**
- File name: PascalCase (`UserProfile.tsx`)
- Folder name: camelCase hoặc kebab-case
- Export default + named exports

### **Step 4: Update index files**
```typescript
// components/ui/common/index.ts
export { default as NewComponent } from './NewComponent';
```

## 🚨 Common Issues & Solutions

### **Import Errors**
```typescript
// ❌ Old path (sẽ lỗi)
import { doctorAPI } from '@/apis/doctorAPI';

// ✅ New path  
import { doctorAPI } from '@/api/services/doctorAPI';
```

### **Component not found**
```typescript
// ❌ Old path
import { ProfileCard } from '@/components/profile';

// ✅ New path
import { ProfileCard } from '@/components/feature/profile';
```

## 🎨 Best Practices

### **1. Component Design**
```typescript
// ✅ Good - UI Component
const Button = ({ children, onClick, variant }) => {
  return <button className={variant} onClick={onClick}>{children}</button>;
};

// ✅ Good - Feature Component  
const BookingForm = () => {
  const { bookings } = useBookings(); // Business logic
  return <Form>...</Form>;
};
```

### **2. Folder Organization**
```bash
✅ DO: Group by feature/domain
components/feature/booking/
  ├── BookingForm.tsx
  ├── BookingList.tsx  
  └── index.ts

❌ DON'T: Group by type
components/forms/
  ├── BookingForm.tsx
  ├── LoginForm.tsx  # Different domains mixed
  └── ProfileForm.tsx
```

### **3. API Organization**
```typescript
// ✅ Consistent API calls
const fetchDoctors = () => api.get('/doctors');
const createBooking = (data) => api.post('/bookings', data);

// ✅ Reusable API services
export const doctorAPI = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
};
```

## 📝 Checklists

### **Before Creating Component**
- [ ] Xác định type: UI hay Feature?
- [ ] Check existing components có reuse được không?
- [ ] Chọn đúng folder location
- [ ] Follow naming conventions

### **Before Committing**
- [ ] Update relevant index.ts files
- [ ] Check imports không bị broken
- [ ] Test component render correctly
- [ ] Follow coding standards

### **Code Review Checklist**
- [ ] Component ở đúng folder?
- [ ] Imports clean và consistent?
- [ ] No business logic trong UI components?
- [ ] Props interface well-defined?

## 🔄 Migration Commands

Nếu cần migrate thêm code:

```bash
# Check for old import patterns
grep -r "from '@/apis/" src/

# Find components cần move
find src/components -name "*.tsx" | grep -v "ui\|feature"
```

---

*Updated: 2025-01-27*  
*Cấu trúc được tối ưu theo Feature-Based Organization principles* 