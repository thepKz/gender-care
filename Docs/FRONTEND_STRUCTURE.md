# Frontend Structure Documentation

## Tổng quan cấu trúc mới

Cấu trúc Frontend đã được tối ưu hóa theo nguyên tắc **Feature-Based Organization** và **Separation of Concerns**.

## Cấu trúc thư mục

```
src/
├── api/                    # API configuration và services
│   ├── endpoints/          # API endpoint definitions
│   ├── services/           # API service calls (merged từ apis/)
│   ├── axiosConfig.ts      # Axios configuration
│   └── index.ts           # API exports
├── components/            # React components
│   ├── feature/           # Feature-specific components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── medical/       # Medical-related components
│   │   ├── profile/       # Profile components
│   │   └── userProfile/   # User profile components
│   ├── ui/                # Reusable UI components
│   │   ├── common/        # Common UI components
│   │   ├── cards/         # Card components
│   │   ├── forms/         # Form components
│   │   ├── modals/        # Modal components
│   │   └── doctor/        # Doctor-specific UI
│   └── layouts/           # Layout components
├── pages/                 # Page components (cleaned up)
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── doctors/           # Doctor pages
│   ├── home/              # Home page
│   └── ...               # Other pages
├── context/               # React context
├── hooks/                 # Custom hooks
├── layouts/               # Layout definitions
├── redux/                 # Redux store và slices
├── routes/                # Routing configuration
├── shared/                # Shared utilities (renamed từ share)
├── styles/                # Global styles
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
├── App.tsx               # Root App component
└── main.tsx              # Application entry point
```

## Các thay đổi chính

### 1. **API Organization**
- **Trước:** Có cả `api/` và `apis/` folder (trùng lặp)
- **Sau:** Merge thành `api/` duy nhất với:
  - `endpoints/`: Chứa API endpoint definitions
  - `services/`: Chứa API service calls (di chuyển từ `apis/`)

### 2. **Components Restructure**
- **Trước:** Components bị rải rác không có logic rõ ràng
- **Sau:** Chia thành 2 loại chính:
  - `feature/`: Components liên quan đến business logic cụ thể
  - `ui/`: Reusable UI components không liên quan đến business

### 3. **Cleanup Empty Folders**
- Xóa: `services/` (trống)
- Xóa: `pages/menstrualCycle/` (trống) 
- Xóa: `pages/stiTesting/` (trống)

### 4. **Naming Conventions**
- `share/` → `shared/` (rõ ràng hơn)
- Tất cả folder names theo kebab-case hoặc camelCase nhất quán

## Import Patterns

### API Imports
```typescript
// Preferred - sử dụng từ api/index.ts
import { api, doctorAPI, userAPI } from '@/api';

// Hoặc specific imports
import { doctorAPI } from '@/api/services/doctorAPI';
import { getUserProfile } from '@/api/endpoints/userApi';
```

### Component Imports  
```typescript
// UI Components
import { FloatingAppointmentButton, LogoutButton } from '@/components/ui/common';
import { ServiceCard } from '@/components/ui/cards';

// Feature Components
import { ProfileCard } from '@/components/feature/profile';
import { DashboardWrapper } from '@/components/feature/dashboard';
```

## Best Practices

### 1. **Component Organization Rules**
- **UI Components**: Không chứa business logic, có thể reuse
- **Feature Components**: Chứa business logic cụ thể cho feature

### 2. **File Naming**
- Components: PascalCase (`UserProfile.tsx`)
- Files: camelCase (`axiosConfig.ts`)
- Folders: kebab-case hoặc camelCase nhất quán

### 3. **Index Files**
- Mỗi folder components nên có `index.ts` để export
- Giúp clean imports và dễ refactor

## Migration Guide

### Updating Imports
Nếu có lỗi import sau khi restructure:

```typescript
// Old
import { doctorAPI } from '@/apis/doctorAPI';

// New  
import { doctorAPI } from '@/api/services/doctorAPI';
// hoặc
import { doctorAPI } from '@/api';
```

### Component Path Updates
```typescript
// Old
import { ProfileCard } from '@/components/profile/ProfileCard';

// New
import { ProfileCard } from '@/components/feature/profile/ProfileCard';
```

## Lợi ích của cấu trúc mới

1. **Clarity**: Dễ hiểu component thuộc loại nào và có trách nhiệm gì
2. **Maintainability**: Dễ maintain và extend features
3. **Reusability**: UI components có thể reuse dễ dàng
4. **Scalability**: Cấu trúc scale tốt khi project lớn lên
5. **Developer Experience**: Developers mới dễ understand codebase

## Checkpoints

- ✅ API folders merged và organized
- ✅ Components restructured theo feature/ui pattern  
- ✅ Empty folders cleaned up
- ✅ Naming conventions standardized
- ✅ Index files updated
- ✅ Documentation created

---

*Created: 2025-01-27*  
*Author: AI Assistant*  
*Protocol: Multi-Dimensional Thinking + Agent-Execution* 