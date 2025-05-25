# Coding Convention - Gender Healthcare Project

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc Project](#cấu-trúc-project)
3. [Design Conventions](#design-conventions)
4. [Frontend Conventions](#frontend-conventions)
5. [Backend Conventions](#backend-conventions)
6. [Database Conventions](#database-conventions)
7. [Git Conventions](#git-conventions)
8. [Testing Conventions](#testing-conventions)
9. [Documentation Conventions](#documentation-conventions)

---

## Tổng quan

### Nguyên tắc cơ bản

- **Consistent**: Viết code nhất quán trong toàn bộ project
- **Readable**: Code phải dễ đọc và hiểu
- **Maintainable**: Dễ bảo trì và mở rộng
- **Secure**: Ưu tiên bảo mật, đặc biệt với dữ liệu y tế
- **Performance**: Tối ưu hiệu suất cho trải nghiệm người dùng

### Tech Stack chính

**Frontend**: React + TypeScript + Vite + TailwindCSS + Ant Design  
**Backend**: Node.js + Express + TypeScript + MongoDB + Mongoose  
**Tools**: ESLint + Prettier + Jest + Swagger

---

## Cấu trúc Project

### Cấu trúc thư mục Frontend

```
Frontend/
├── public/
│   ├── fonts/                 # Font files
│   └── images/                # Static images
├── src/
│   ├── api/                   # API configurations
│   │   └── endpoints/         # API endpoint definitions
│   ├── apis/                  # Legacy API folder (consolidate với api/)
│   ├── assets/                # Static assets
│   │   ├── fonts/
│   │   ├── icons/
│   │   └── images/
│   ├── components/            # Reusable components
│   │   ├── auth/              # Auth-related components
│   │   ├── common/            # Common/shared components
│   │   ├── layouts/           # Layout components
│   │   ├── specific/          # Feature-specific components
│   │   └── ui/                # UI components (Ant Design wrappers)
│   ├── hooks/                 # Custom React hooks
│   ├── layouts/               # Page layouts
│   ├── pages/                 # Page components
│   │   ├── auth/              # Authentication pages
│   │   ├── blog/              # Blog pages
│   │   ├── consultation/      # Consultation pages
│   │   ├── dashboard/         # Dashboard pages
│   │   └── [feature]/         # Feature-based pages
│   ├── redux/                 # Redux store
│   │   └── slices/            # Redux slices
│   ├── routes/                # Routing configuration
│   ├── services/              # Business logic services
│   ├── share/                 # Shared utilities (consolidate với utils/)
│   ├── styles/                # Global styles
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
└── package.json
```

### Cấu trúc thư mục Backend

```
Backend/
├── src/
│   ├── controllers/           # Request handlers
│   ├── errors/                # Custom error classes
│   ├── middleware/            # Express middleware
│   ├── models/                # Mongoose models
│   ├── routes/                # Route definitions
│   ├── services/              # Business logic services
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── swagger.yaml           # API documentation
│   └── index.ts               # Application entry point
├── uploads/                   # File uploads
└── package.json
```

---

## Design Conventions

### 1. Design System Overview

#### Brand Identity
- **Primary Brand**: Gender Healthcare - Chăm sóc sức khỏe phụ nữ
- **Mission**: Cung cấp dịch vụ chăm sóc sức khỏe toàn diện, an toàn và riêng tư cho phụ nữ
- **Values**: Tin cậy, Chuyên nghiệp, Thân thiện, Bảo mật

#### Design Principles
- **Accessibility First**: Thiết kế dễ tiếp cận cho mọi người dùng
- **Mobile-First**: Ưu tiên trải nghiệm trên thiết bị di động
- **Privacy-Focused**: Giao diện thể hiện sự bảo mật và riêng tư
- **Medical Professional**: Thiết kế chuyên nghiệp phù hợp lĩnh vực y tế
- **User-Centric**: Tập trung vào trải nghiệm người dùng

### 2. Color Palette

#### Primary Colors
```css
:root {
  /* Primary Blues - Chủ đạo */
  --blue-primary: #0c3c54;      /* Xanh đậm chính */
  --blue-secondary: #0F7EA9;    /* Xanh phụ */
  --blue-light: #4A90E2;        /* Xanh sáng */
  --blue-lighter: #E3F2FD;      /* Xanh rất nhạt */
  
  /* Accent Colors - Màu nhấn */
  --green-primary: #006478;     /* Xanh lá chính */
  --green-secondary: #00A693;   /* Xanh lá phụ */
  --green-light: #4CAF50;       /* Xanh lá sáng */
  
  /* Neutral Colors - Màu trung tính */
  --white: #FFFFFF;
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;
  
  /* Status Colors - Màu trạng thái */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
}
```

#### Color Usage Guidelines
```typescript
// ✅ Đúng - Sử dụng màu theo ngữ cảnh
const colorUsage = {
  // Primary Actions
  primaryButton: 'bg-blue-primary hover:bg-blue-secondary',
  primaryLink: 'text-blue-primary hover:text-blue-secondary',
  
  // Secondary Actions
  secondaryButton: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  
  // Success States
  successMessage: 'bg-green-light text-white',
  successIcon: 'text-success',
  
  // Medical/Health Context
  healthCard: 'border-green-primary bg-green-lighter',
  consultationButton: 'bg-green-primary hover:bg-green-secondary',
  
  // Backgrounds
  pageBackground: 'bg-gray-50',
  cardBackground: 'bg-white',
  sectionBackground: 'bg-gray-100'
};

// ❌ Sai - Sử dụng màu không nhất quán
const wrongUsage = {
  randomColors: 'bg-red-500', // Không có trong design system
  hardcodedHex: 'bg-[#123456]', // Không sử dụng CSS variables
  inconsistentHover: 'hover:bg-purple-500' // Không theo quy tắc
};
```

### 3. Typography

#### Font Family
```css
/* Primary Font - SF Pro Rounded */
@font-face {
  font-family: 'SF Pro Rounded';
  src: url('/fonts/SF-Pro-Rounded-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SF Pro Rounded';
  src: url('/fonts/SF-Pro-Rounded-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Fallback Fonts */
:root {
  --font-primary: 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
}
```

#### Typography Scale
```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

#### Typography Usage
```typescript
// ✅ Đúng - Sử dụng typography scale
const typographyClasses = {
  // Headings
  h1: 'text-4xl font-bold leading-tight text-gray-900',
  h2: 'text-3xl font-bold leading-tight text-gray-800',
  h3: 'text-2xl font-semibold leading-normal text-gray-800',
  h4: 'text-xl font-semibold leading-normal text-gray-700',
  h5: 'text-lg font-medium leading-normal text-gray-700',
  h6: 'text-base font-medium leading-normal text-gray-600',
  
  // Body Text
  bodyLarge: 'text-lg leading-relaxed text-gray-700',
  body: 'text-base leading-normal text-gray-600',
  bodySmall: 'text-sm leading-normal text-gray-500',
  
  // Special Text
  caption: 'text-xs leading-normal text-gray-400',
  label: 'text-sm font-medium text-gray-700',
  link: 'text-blue-primary hover:text-blue-secondary underline',
  
  // Medical Context
  medicalTitle: 'text-2xl font-bold text-green-primary',
  consultantName: 'text-lg font-semibold text-gray-800',
  appointmentTime: 'text-sm font-medium text-blue-primary'
};
```

### 4. Spacing & Layout

#### Spacing Scale
```css
:root {
  /* Spacing Scale (8px base) */
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */
}
```

#### Layout Guidelines
```typescript
// ✅ Container và Grid System
const layoutClasses = {
  // Containers
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  containerSmall: 'max-w-4xl mx-auto px-4 sm:px-6',
  containerMedium: 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Grid Systems
  gridCols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  gridCols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  gridCols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
  
  // Flexbox Layouts
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexCol: 'flex flex-col',
  flexWrap: 'flex flex-wrap',
  
  // Spacing
  sectionPadding: 'py-16 lg:py-24',
  cardPadding: 'p-6 lg:p-8',
  buttonPadding: 'px-6 py-3',
  inputPadding: 'px-4 py-3'
};
```

### 5. Component Design Patterns

#### Button Variants
```typescript
// Button Design System
const buttonVariants = {
  // Primary Buttons
  primary: `
    bg-blue-primary text-white font-medium
    hover:bg-blue-secondary focus:ring-2 focus:ring-blue-primary focus:ring-offset-2
    disabled:bg-gray-300 disabled:cursor-not-allowed
    transition-all duration-200 ease-in-out
    px-6 py-3 rounded-lg
  `,
  
  // Secondary Buttons
  secondary: `
    bg-white text-blue-primary border-2 border-blue-primary font-medium
    hover:bg-blue-primary hover:text-white focus:ring-2 focus:ring-blue-primary focus:ring-offset-2
    disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300
    transition-all duration-200 ease-in-out
    px-6 py-3 rounded-lg
  `,
  
  // Medical/Health Buttons
  medical: `
    bg-green-primary text-white font-medium
    hover:bg-green-secondary focus:ring-2 focus:ring-green-primary focus:ring-offset-2
    disabled:bg-gray-300 disabled:cursor-not-allowed
    transition-all duration-200 ease-in-out
    px-6 py-3 rounded-lg
  `,
  
  // Danger Buttons
  danger: `
    bg-error text-white font-medium
    hover:bg-red-600 focus:ring-2 focus:ring-error focus:ring-offset-2
    disabled:bg-gray-300 disabled:cursor-not-allowed
    transition-all duration-200 ease-in-out
    px-6 py-3 rounded-lg
  `,
  
  // Ghost Buttons
  ghost: `
    bg-transparent text-gray-600 font-medium
    hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
    disabled:text-gray-400 disabled:cursor-not-allowed
    transition-all duration-200 ease-in-out
    px-6 py-3 rounded-lg
  `
};

// Button Sizes
const buttonSizes = {
  small: 'px-4 py-2 text-sm',
  medium: 'px-6 py-3 text-base',
  large: 'px-8 py-4 text-lg'
};
```

#### Card Components
```typescript
// Card Design System
const cardVariants = {
  // Basic Card
  basic: `
    bg-white rounded-xl shadow-sm border border-gray-200
    hover:shadow-md transition-shadow duration-200
    p-6
  `,
  
  // Medical Card
  medical: `
    bg-white rounded-xl shadow-sm border-l-4 border-l-green-primary
    hover:shadow-md transition-shadow duration-200
    p-6
  `,
  
  // Consultation Card
  consultation: `
    bg-gradient-to-br from-blue-50 to-green-50 rounded-xl
    border border-blue-200 hover:border-blue-300
    hover:shadow-lg transition-all duration-200
    p-6
  `,
  
  // Profile Card
  profile: `
    bg-white rounded-2xl shadow-lg border border-gray-100
    hover:shadow-xl transition-shadow duration-300
    p-8
  `,
  
  // Dashboard Card
  dashboard: `
    bg-white rounded-lg shadow-sm border border-gray-200
    hover:shadow-md transition-shadow duration-200
    p-4
  `
};
```

#### Form Components
```typescript
// Form Design System
const formComponents = {
  // Input Fields
  input: `
    w-full px-4 py-3 border border-gray-300 rounded-lg
    focus:ring-2 focus:ring-blue-primary focus:border-blue-primary
    disabled:bg-gray-100 disabled:cursor-not-allowed
    placeholder:text-gray-400
    transition-colors duration-200
  `,
  
  // Input with Error
  inputError: `
    w-full px-4 py-3 border border-error rounded-lg
    focus:ring-2 focus:ring-error focus:border-error
    bg-red-50 placeholder:text-red-400
    transition-colors duration-200
  `,
  
  // Select Fields
  select: `
    w-full px-4 py-3 border border-gray-300 rounded-lg
    focus:ring-2 focus:ring-blue-primary focus:border-blue-primary
    bg-white cursor-pointer
    transition-colors duration-200
  `,
  
  // Labels
  label: `
    block text-sm font-medium text-gray-700 mb-2
  `,
  
  // Error Messages
  errorMessage: `
    text-sm text-error mt-1 flex items-center gap-1
  `,
  
  // Help Text
  helpText: `
    text-sm text-gray-500 mt-1
  `
};
```

### 6. Icons & Imagery

#### Icon Guidelines
```typescript
// Icon Usage Guidelines
const iconGuidelines = {
  // Sizes
  sizes: {
    xs: 'w-3 h-3',      // 12px
    sm: 'w-4 h-4',      // 16px
    base: 'w-5 h-5',    // 20px
    lg: 'w-6 h-6',      // 24px
    xl: 'w-8 h-8',      // 32px
    '2xl': 'w-12 h-12'  // 48px
  },
  
  // Colors
  colors: {
    primary: 'text-blue-primary',
    secondary: 'text-gray-500',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    medical: 'text-green-primary'
  },
  
  // Context Usage
  contexts: {
    navigation: 'w-5 h-5 text-gray-500',
    button: 'w-4 h-4 mr-2',
    status: 'w-4 h-4 text-success',
    medical: 'w-6 h-6 text-green-primary',
    consultation: 'w-5 h-5 text-blue-primary'
  }
};

// Medical Icons Mapping
const medicalIcons = {
  consultation: 'UserGroupIcon',
  appointment: 'CalendarIcon',
  health: 'HeartIcon',
  medication: 'BeakerIcon',
  test: 'ClipboardDocumentCheckIcon',
  cycle: 'ArrowPathIcon',
  profile: 'UserCircleIcon',
  settings: 'CogIcon'
};
```

#### Image Guidelines
```typescript
// Image Usage Guidelines
const imageGuidelines = {
  // Aspect Ratios
  aspectRatios: {
    square: 'aspect-square',        // 1:1
    landscape: 'aspect-video',      // 16:9
    portrait: 'aspect-[3/4]',       // 3:4
    banner: 'aspect-[21/9]'         // 21:9
  },
  
  // Sizes
  sizes: {
    avatar: 'w-10 h-10 rounded-full',
    avatarLarge: 'w-16 h-16 rounded-full',
    thumbnail: 'w-20 h-20 rounded-lg',
    card: 'w-full h-48 object-cover rounded-t-lg',
    hero: 'w-full h-96 lg:h-[500px] object-cover'
  },
  
  // Medical Context
  medical: {
    doctorAvatar: 'w-12 h-12 rounded-full border-2 border-green-primary',
    consultationBanner: 'w-full h-64 object-cover rounded-lg',
    healthTip: 'w-full h-40 object-cover rounded-lg'
  }
};
```

### 7. Animation & Transitions

#### Animation Guidelines
```css
/* Transition Durations */
:root {
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
  
  /* Easing Functions */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Common Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes slideRight {
  from { 
    opacity: 0; 
    transform: translateX(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -30px, 0);
  }
  70% {
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
}
```

#### Animation Usage
```typescript
// Animation Classes
const animations = {
  // Page Transitions
  pageEnter: 'animate-fadeIn duration-300 ease-out',
  pageExit: 'animate-fadeOut duration-200 ease-in',
  
  // Component Animations
  cardHover: 'hover:scale-105 transition-transform duration-200 ease-out',
  buttonHover: 'hover:shadow-lg transition-shadow duration-200 ease-out',
  
  // Loading States
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  
  // Medical Context
  heartbeat: 'animate-pulse duration-1000',
  consultationSlide: 'animate-slideRight duration-300 ease-out',
  
  // Form Interactions
  inputFocus: 'focus:scale-105 transition-transform duration-150 ease-out',
  errorShake: 'animate-bounce duration-300 ease-in-out'
};
```

### 8. Responsive Design

#### Breakpoints
```css
/* Tailwind CSS Breakpoints */
:root {
  --breakpoint-sm: 640px;   /* Small devices */
  --breakpoint-md: 768px;   /* Medium devices */
  --breakpoint-lg: 1024px;  /* Large devices */
  --breakpoint-xl: 1280px;  /* Extra large devices */
  --breakpoint-2xl: 1536px; /* 2X large devices */
}
```

#### Responsive Patterns
```typescript
// Responsive Design Patterns
const responsivePatterns = {
  // Navigation
  mobileNav: 'block md:hidden',
  desktopNav: 'hidden md:block',
  
  // Grid Layouts
  responsiveGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  consultationGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  
  // Typography
  responsiveHeading: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl',
  responsiveBody: 'text-sm sm:text-base lg:text-lg',
  
  // Spacing
  responsivePadding: 'p-4 sm:p-6 lg:p-8 xl:p-12',
  responsiveMargin: 'm-4 sm:m-6 lg:m-8 xl:m-12',
  
  // Medical Context
  consultationCard: 'w-full sm:w-auto lg:w-80 xl:w-96',
  appointmentList: 'space-y-2 sm:space-y-4 lg:space-y-6'
};
```

### 9. Accessibility Guidelines

#### WCAG Compliance
```typescript
// Accessibility Guidelines
const accessibilityGuidelines = {
  // Color Contrast
  colorContrast: {
    // Minimum contrast ratio 4.5:1 for normal text
    normalText: 'text-gray-700', // Contrast ratio: 4.5:1
    largeText: 'text-gray-600',  // Contrast ratio: 3:1 (acceptable for large text)
    
    // High contrast for important elements
    primaryButton: 'bg-blue-primary text-white', // Contrast ratio: 7:1
    errorText: 'text-error',     // Contrast ratio: 5.2:1
  },
  
  // Focus States
  focusStates: {
    button: 'focus:ring-2 focus:ring-blue-primary focus:ring-offset-2',
    input: 'focus:ring-2 focus:ring-blue-primary focus:border-blue-primary',
    link: 'focus:outline-none focus:ring-2 focus:ring-blue-primary focus:ring-offset-2'
  },
  
  // ARIA Labels
  ariaLabels: {
    navigation: 'aria-label="Main navigation"',
    search: 'aria-label="Search consultations"',
    profile: 'aria-label="User profile menu"',
    consultation: 'aria-label="Book consultation"'
  },
  
  // Semantic HTML
  semanticElements: {
    navigation: '<nav role="navigation">',
    main: '<main role="main">',
    aside: '<aside role="complementary">',
    article: '<article role="article">'
  }
};
```

### 10. Medical UI Patterns

#### Health Data Visualization
```typescript
// Medical-specific UI patterns
const medicalUIPatterns = {
  // Cycle Tracking
  cycleCalendar: `
    grid grid-cols-7 gap-1 p-4
    bg-gradient-to-br from-pink-50 to-purple-50
    rounded-xl border border-pink-200
  `,
  
  cycleDayActive: `
    bg-pink-500 text-white rounded-full
    w-8 h-8 flex items-center justify-center
    text-sm font-medium
  `,
  
  cycleDayPredicted: `
    bg-pink-200 text-pink-700 rounded-full
    w-8 h-8 flex items-center justify-center
    text-sm font-medium border-2 border-dashed border-pink-400
  `,
  
  // Consultation Status
  consultationPending: `
    bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full
    text-sm font-medium border border-yellow-300
  `,
  
  consultationConfirmed: `
    bg-green-100 text-green-800 px-3 py-1 rounded-full
    text-sm font-medium border border-green-300
  `,
  
  consultationCompleted: `
    bg-blue-100 text-blue-800 px-3 py-1 rounded-full
    text-sm font-medium border border-blue-300
  `,
  
  // Health Metrics
  healthMetricCard: `
    bg-white rounded-lg p-4 border-l-4 border-l-green-primary
    shadow-sm hover:shadow-md transition-shadow duration-200
  `,
  
  healthMetricValue: `
    text-2xl font-bold text-gray-900 mb-1
  `,
  
  healthMetricLabel: `
    text-sm text-gray-600 uppercase tracking-wide
  `,
  
  // Test Results
  testResultNormal: `
    bg-green-50 border border-green-200 rounded-lg p-4
    text-green-800
  `,
  
  testResultAbnormal: `
    bg-red-50 border border-red-200 rounded-lg p-4
    text-red-800
  `,
  
  testResultPending: `
    bg-yellow-50 border border-yellow-200 rounded-lg p-4
    text-yellow-800
  `
};
```

### 11. Component Library Structure

#### Component Organization
```typescript
// Component Library Structure
const componentLibrary = {
  // Base Components
  base: {
    Button: 'components/ui/Button.tsx',
    Input: 'components/ui/Input.tsx',
    Card: 'components/ui/Card.tsx',
    Modal: 'components/ui/Modal.tsx',
    Badge: 'components/ui/Badge.tsx'
  },
  
  // Layout Components
  layout: {
    Header: 'components/layouts/Header.tsx',
    Footer: 'components/layouts/Footer.tsx',
    Sidebar: 'components/layouts/Sidebar.tsx',
    Container: 'components/layouts/Container.tsx'
  },
  
  // Medical Components
  medical: {
    ConsultationCard: 'components/medical/ConsultationCard.tsx',
    CycleTracker: 'components/medical/CycleTracker.tsx',
    HealthMetric: 'components/medical/HealthMetric.tsx',
    TestResult: 'components/medical/TestResult.tsx',
    AppointmentCard: 'components/medical/AppointmentCard.tsx'
  },
  
  // Form Components
  forms: {
    FormField: 'components/forms/FormField.tsx',
    FormGroup: 'components/forms/FormGroup.tsx',
    FormValidation: 'components/forms/FormValidation.tsx',
    DatePicker: 'components/forms/DatePicker.tsx',
    TimePicker: 'components/forms/TimePicker.tsx'
  }
};
```

### 12. Design Tokens

#### Design Token Structure
```typescript
// Design Tokens for consistent theming
export const designTokens = {
  colors: {
    primary: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#0c3c54', // Primary
      600: '#0F7EA9',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1'
    },
    medical: {
      50: '#E0F7FA',
      100: '#B2EBF2',
      200: '#80DEEA',
      300: '#4DD0E1',
      400: '#26C6DA',
      500: '#006478', // Medical Primary
      600: '#00A693',
      700: '#0097A7',
      800: '#00838F',
      900: '#006064'
    }
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  }
};
```

---

## Frontend Conventions

### 1. Naming Conventions

#### Files và Folders
```typescript
// ✅ Đúng
components/auth/LoginForm.tsx
pages/consultation/ConsultationDetail.tsx
hooks/useAuth.ts
types/index.ts

// ❌ Sai
components/auth/loginform.tsx
pages/consultation/consultationdetail.tsx
hooks/UseAuth.ts
```

#### Components
```typescript
// ✅ PascalCase cho components
const LoginForm: React.FC = () => {
  return <div>Login Form</div>;
};

// ✅ camelCase cho props
interface LoginFormProps {
  onSubmit: (data: LoginData) => void;
  isLoading: boolean;
  redirectTo?: string;
}
```

#### Variables và Functions
```typescript
// ✅ camelCase
const userProfile = getUserProfile();
const isAuthenticated = checkAuth();

// ✅ Boolean variables bắt đầu với is/has/can/should
const isLoading = false;
const hasPermission = true;
const canEdit = user.role === 'admin';
const shouldShowModal = isAuthenticated && hasPermission;
```

#### Constants
```typescript
// ✅ SCREAMING_SNAKE_CASE cho constants
const API_BASE_URL = 'https://api.example.com';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  CONSULTANT: 'consultant'
} as const;
```

### 2. Component Structure

#### Function Component Template
```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';

// Types/Interfaces
interface ComponentNameProps {
  title: string;
  onSubmit?: (data: any) => void;
  className?: string;
}

// Main Component
const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  onSubmit,
  className = ''
}) => {
  // State
  const [isLoading, setIsLoading] = useState(false);
  
  // Hooks
  const navigate = useNavigate();
  
  // Event Handlers
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Logic
      onSubmit?.(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Render
  return (
    <div className={`component-wrapper ${className}`}>
      <h1>{title}</h1>
      <Button onClick={handleSubmit} loading={isLoading}>
        Submit
      </Button>
    </div>
  );
};

export default ComponentName;
```

### 3. TypeScript Conventions

#### Interface Definitions
```typescript
// ✅ Đúng - Interface names với PascalCase
interface User {
  _id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ✅ Union types cho constants
type UserRole = 'guest' | 'customer' | 'consultant' | 'staff' | 'manager' | 'admin';

// ✅ Generic types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

#### Props với Optional và Default values
```typescript
interface ComponentProps {
  // Required props
  title: string;
  userId: string;
  
  // Optional props với ?
  className?: string;
  variant?: 'primary' | 'secondary';
  onSubmit?: (data: FormData) => void;
}

// Default values trong destructuring
const Component: React.FC<ComponentProps> = ({
  title,
  userId,
  className = '',
  variant = 'primary',
  onSubmit
}) => {
  // Component logic
};
```

### 4. Styling với TailwindCSS

#### Class Naming và Organization
```typescript
// ✅ Đúng - Logical grouping
const buttonClasses = `
  // Layout
  inline-flex items-center justify-center
  // Spacing
  px-4 py-2 mx-2
  // Typography
  text-sm font-medium
  // Colors
  bg-blue-600 text-white
  // States
  hover:bg-blue-700 focus:ring-2 focus:ring-blue-500
  // Transitions
  transition-all duration-200
  // Responsive
  md:px-6 md:text-base
`;

// ✅ Custom colors trong config
const customColors = {
  'blue-primary': '#0c3c54',
  'blue-secondary': '#0F7EA9',
  'green-dark': '#006478'
};
```

#### Responsive Design Pattern
```typescript
// ✅ Mobile-first approach
<div className="
  w-full p-4
  md:w-1/2 md:p-6
  lg:w-1/3 lg:p-8
">
  Content
</div>
```

### 5. State Management với Redux Toolkit

#### Slice Structure
```typescript
// features/auth/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    loginFailure: (state) => {
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
```

### 6. API Calls và Error Handling

#### API Service Pattern
```typescript
// services/authService.ts
import axios from 'axios';
import { LoginRequest, RegisterRequest } from '../types';

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class AuthService {
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
      }
      throw error;
    }
  }
  
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Đăng ký thất bại';
        throw new Error(message);
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
```

#### Custom Hook cho API calls
```typescript
// hooks/useAuth.ts
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { authService } from '../services/authService';
import { loginSuccess, loginFailure } from '../redux/slices/authSlice';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      dispatch(loginSuccess(response));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(errorMessage);
      dispatch(loginFailure());
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading,
    error
  };
};
```

---

## Backend Conventions

### 1. Project Structure

#### Controllers
```typescript
// controllers/authController.ts
import { Request, Response } from 'express';
import { ValidationError } from '../errors/validationError';
import { authService } from '../services/authService';

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, gender, phone } = req.body;
    
    // Validation
    const validationResult = validateRegisterInput({
      fullName, email, password, gender, phone
    });
    
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }
    
    // Business logic
    const result = await authService.register({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      gender: gender.trim(),
      phone: phone?.trim()
    });
    
    return res.status(201).json({
      message: "Đăng ký thành công!",
      data: result
    });
    
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json(error.errors);
    }
    
    console.error('Register error:', error);
    return res.status(500).json({ 
      message: "Đã xảy ra lỗi server" 
    });
  }
};
```

#### Models (Mongoose)
```typescript
// models/User.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  gender: string;
  role: 'guest' | 'customer' | 'consultant' | 'staff' | 'manager' | 'admin';
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
    minlength: [3, 'Họ tên phải có ít nhất 3 ký tự'],
    maxlength: [50, 'Họ tên không được quá 50 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[A-Za-z0-9\._%+\-]+@[A-Za-z0-9\.\-]+\.[A-Za-z]{2,}$/,
      'Email không hợp lệ'
    ]
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  gender: {
    type: String,
    required: [true, 'Giới tính là bắt buộc'],
    enum: ['male', 'female', 'other']
  },
  role: {
    type: String,
    enum: ['guest', 'customer', 'consultant', 'staff', 'manager', 'admin'],
    default: 'customer'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
```

#### Services
```typescript
// services/authService.ts
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { OtpCode } from '../models/OtpCode';
import { signToken, signRefreshToken } from '../utils/jwt';
import { sendVerificationEmail } from './emailService';

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  gender: string;
  phone?: string;
}

class AuthService {
  async register(data: RegisterData) {
    const { fullName, email, password, gender, phone } = data;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email này đã được sử dụng!');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      gender,
      phone,
      role: 'customer',
      emailVerified: false,
      isActive: true
    });
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 60);
    
    await OtpCode.create({
      userId: newUser._id,
      type: 'email_verification',
      otp,
      expires: expiryDate,
      verified: false,
      attempts: 0
    });
    
    // Send verification email
    await sendVerificationEmail(email, otp, fullName);
    
    // Generate tokens
    const token = await signToken({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role
    });
    
    return {
      id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      gender: newUser.gender,
      role: newUser.role,
      emailVerified: false,
      token
    };
  }
}

export const authService = new AuthService();
```

### 2. Error Handling

#### Custom Error Classes
```typescript
// errors/validationError.ts
export class ValidationError extends Error {
  public errors: Record<string, string>;
  
  constructor(errors: Record<string, string>) {
    super('Validation Error');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// errors/notFoundError.ts
export class NotFoundError extends Error {
  constructor(message: string = 'Không tìm thấy tài nguyên') {
    super(message);
    this.name = 'NotFoundError';
  }
}

// errors/unauthorizedError.ts
export class UnauthorizedError extends Error {
  constructor(message: string = 'Không có quyền truy cập') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
```

#### Global Error Handler
```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/validationError';
import { NotFoundError } from '../errors/notFoundError';
import { UnauthorizedError } from '../errors/unauthorizedError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`Error ${req.method} ${req.path}:`, err);
  
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      errors: err.errors
    });
  }
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      message: err.message
    });
  }
  
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      message: err.message
    });
  }
  
  // Default error
  return res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
```

### 3. Middleware

#### Authentication Middleware
```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { UnauthorizedError } from '../errors/unauthorizedError';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') ||
                 req.cookies.access_token;
    
    if (!token) {
      throw new UnauthorizedError('Token không tồn tại');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded._id).select('-password');
    
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Token không hợp lệ');
    }
    
    req.user = {
      _id: user._id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    next(new UnauthorizedError('Token không hợp lệ'));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Chưa xác thực'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new UnauthorizedError('Không có quyền truy cập'));
    }
    
    next();
  };
};
```

#### Validation Middleware
```typescript
// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/validationError';

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { fullName, email, password, gender } = req.body;
  const errors: Record<string, string> = {};
  
  // Validate fullName
  if (!fullName?.trim()) {
    errors.fullName = 'Họ tên là bắt buộc';
  } else if (fullName.trim().length < 3) {
    errors.fullName = 'Họ tên phải có ít nhất 3 ký tự';
  }
  
  // Validate email
  if (!email?.trim()) {
    errors.email = 'Email là bắt buộc';
  } else if (!/^[A-Za-z0-9\._%+\-]+@[A-Za-z0-9\.\-]+\.[A-Za-z]{2,}$/.test(email.trim())) {
    errors.email = 'Email không hợp lệ';
  }
  
  // Validate password
  if (!password?.trim()) {
    errors.password = 'Mật khẩu là bắt buộc';
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=.{6,30})/.test(password.trim())) {
    errors.password = 'Mật khẩu phải chứa chữ thường, in hoa, số, ký tự đặc biệt và từ 6-30 ký tự';
  }
  
  // Validate gender
  if (!gender?.trim()) {
    errors.gender = 'Giới tính là bắt buộc';
  } else if (!['male', 'female', 'other'].includes(gender.trim())) {
    errors.gender = 'Giới tính không hợp lệ';
  }
  
  if (Object.keys(errors).length > 0) {
    return next(new ValidationError(errors));
  }
  
  next();
};
```

---

## Database Conventions

### 1. Naming Conventions

#### Collections (Models)
```typescript
// ✅ Đúng - PascalCase, số ít
User, UserProfile, MenstrualCycle, TestAppointment

// ❌ Sai
users, user_profile, menstrual_cycles
```

#### Fields
```typescript
// ✅ camelCase
fullName, emailVerified, createdAt, updatedAt

// ❌ snake_case
full_name, email_verified, created_at
```

### 2. Schema Design

#### Base Schema Pattern
```typescript
const BaseSchema = {
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
};

// Pre-save middleware để auto-update updatedAt
schema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
```

#### Relationships
```typescript
// Reference Pattern - cho large documents
const consultationSchema = new Schema({
  consultantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookedByUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Embedded Pattern - cho small, rarely changed documents
const addressSchema = new Schema({
  street: String,
  city: String,
  country: String
});

const userSchema = new Schema({
  address: addressSchema
});
```

---

## Git Conventions

### 1. Branch Naming

```bash
# Feature branches
feature/user-authentication
feature/menstrual-cycle-tracking
feature/sti-testing-appointment

# Bug fixes
bugfix/login-validation-error
bugfix/consultation-booking-bug

# Hotfix
hotfix/security-vulnerability
hotfix/payment-integration

# Release
release/v1.2.0
```

### 2. Commit Messages

#### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- **feat**: Tính năng mới
- **fix**: Sửa bug
- **docs**: Cập nhật documentation
- **style**: Thay đổi formatting, thiếu semicolon, etc
- **refactor**: Refactor code
- **test**: Thêm/sửa tests
- **chore**: Cập nhật build tasks, package manager configs, etc

#### Examples
```bash
feat(auth): thêm chức năng đăng nhập bằng Google

- Tích hợp Google OAuth2
- Thêm button đăng nhập Google trong UI
- Xử lý callback và lưu user info

Closes #123

fix(consultation): sửa lỗi double booking

- Kiểm tra availability trước khi book
- Thêm database constraint để tránh conflict
- Update UI để hiển thị thời gian đã được book

Fixes #456

docs(api): cập nhật API documentation cho consultation endpoints

- Thêm examples cho request/response
- Cập nhật error codes
- Thêm authentication requirements
```

### 3. Pull Request Template

```markdown
## 📝 Mô tả

Tóm tắt ngắn gọn về những thay đổi trong PR này.

## 🔧 Loại thay đổi

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## ✅ Checklist

- [ ] Code đã được test
- [ ] Code tuân thủ coding conventions
- [ ] Self-review đã được thực hiện
- [ ] Documentation đã được cập nhật (nếu cần)
- [ ] Không có console.log hay debug code
- [ ] Đã test trên nhiều device/browser (frontend)

## 🧪 Testing

Mô tả cách test các thay đổi:

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## 📸 Screenshots (nếu có)

Thêm screenshots để minh họa UI changes.

## 🔗 Related Issues

Closes #(issue_number)
```

---

## Testing Conventions

### 1. Frontend Testing (Jest + React Testing Library)

#### Component Testing
```typescript
// __tests__/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import LoginForm from '../components/auth/LoginForm';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should render login form with email and password fields', () => {
    renderWithProvider(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('should show validation errors for invalid input', async () => {
    renderWithProvider(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /đăng nhập/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email là bắt buộc/i)).toBeInTheDocument();
      expect(screen.getByText(/mật khẩu là bắt buộc/i)).toBeInTheDocument();
    });
  });

  it('should call onSubmit with correct data when form is valid', async () => {
    const mockOnSubmit = jest.fn();
    renderWithProvider(<LoginForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/mật khẩu/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

#### Hook Testing
```typescript
// __tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { useAuth } from '../hooks/useAuth';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useAuth', () => {
  it('should login successfully with valid credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      const response = await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(response.success).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

### 2. Backend Testing

#### Controller Testing
```typescript
// __tests__/controllers/authController.test.ts
import request from 'supertest';
import app from '../../src/index';
import { User } from '../../src/models/User';

describe('Auth Controller', () => {
  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        gender: 'male'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('Đăng ký thành công!');
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.fullName).toBe(userData.fullName);
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'invalid-email',
        password: 'Password123!',
        gender: 'male'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.email).toBe('Email không hợp lệ!');
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        gender: 'male'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.email).toBe('Email này đã được sử dụng!');
    });
  });
});
```

#### Service Testing
```typescript
// __tests__/services/authService.test.ts
import { authService } from '../../src/services/authService';
import { User } from '../../src/models/User';

describe('AuthService', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('register', () => {
    it('should create new user with hashed password', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        gender: 'male'
      };

      const result = await authService.register(userData);

      expect(result.email).toBe(userData.email);
      expect(result.fullName).toBe(userData.fullName);
      expect(result.token).toBeDefined();

      const user = await User.findById(result.id);
      expect(user).toBeDefined();
      expect(user!.password).not.toBe(userData.password); // Should be hashed
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        gender: 'male'
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow(
        'Email này đã được sử dụng!'
      );
    });
  });
});
```

---

## Documentation Conventions

### 1. Code Comments

#### Function/Method Documentation
```typescript
/**
 * Đăng ký người dùng mới và gửi email xác thực
 * 
 * @param data - Thông tin đăng ký người dùng
 * @param data.fullName - Họ và tên đầy đủ
 * @param data.email - Địa chỉ email (sẽ được normalize)
 * @param data.password - Mật khẩu (sẽ được hash)
 * @param data.gender - Giới tính (male/female/other)
 * @param data.phone - Số điện thoại (optional)
 * 
 * @returns Promise resolve với thông tin user và token
 * @throws {ValidationError} Khi dữ liệu đầu vào không hợp lệ
 * @throws {Error} Khi email đã tồn tại hoặc lỗi server
 * 
 * @example
 * ```typescript
 * const result = await authService.register({
 *   fullName: 'Nguyễn Văn A',
 *   email: 'user@example.com',
 *   password: 'Password123!',
 *   gender: 'male'
 * });
 * ```
 */
async register(data: RegisterData): Promise<RegisterResult> {
  // Implementation
}
```

#### Complex Business Logic
```typescript
// Tính toán chu kỳ kinh nguyệt và dự đoán rụng trứng
// Algorithm dựa trên:
// 1. Chu kỳ trung bình: 28 ngày
// 2. Rụng trứng thường xảy ra vào ngày 14 trước kỳ kinh tiếp theo
// 3. Thời gian có thể mang thai: 6 ngày (5 ngày trước + 1 ngày sau rụng trứng)
const calculateOvulationPeriod = (lastPeriodDate: Date, cycleLength: number = 28) => {
  // Tính ngày kỳ kinh tiếp theo
  const nextPeriodDate = new Date(lastPeriodDate);
  nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
  
  // Tính ngày rụng trứng (14 ngày trước kỳ kinh tiếp theo)
  const ovulationDate = new Date(nextPeriodDate);
  ovulationDate.setDate(ovulationDate.getDate() - 14);
  
  // Thời gian có thể mang thai
  const fertilityWindowStart = new Date(ovulationDate);
  fertilityWindowStart.setDate(fertilityWindowStart.getDate() - 5);
  
  const fertilityWindowEnd = new Date(ovulationDate);
  fertilityWindowEnd.setDate(fertilityWindowEnd.getDate() + 1);
  
  return {
    ovulationDate,
    fertilityWindowStart,
    fertilityWindowEnd,
    nextPeriodDate
  };
};
```

### 2. API Documentation (Swagger)

```yaml
# swagger.yaml
paths:
  /api/auth/register:
    post:
      tags:
        - Authentication
      summary: Đăng ký người dùng mới
      description: |
        Tạo tài khoản mới cho người dùng với các thông tin cơ bản.
        Sau khi đăng ký thành công, hệ thống sẽ gửi email xác thực.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - fullName
                - email
                - password
                - gender
              properties:
                fullName:
                  type: string
                  minLength: 3
                  maxLength: 50
                  example: "Nguyễn Văn A"
                  description: "Họ và tên đầy đủ"
                email:
                  type: string
                  format: email
                  example: "user@example.com"
                  description: "Địa chỉ email duy nhất"
                password:
                  type: string
                  minLength: 6
                  maxLength: 30
                  pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])"
                  example: "Password123!"
                  description: "Mật khẩu mạnh có chữ hoa, thường, số và ký tự đặc biệt"
                gender:
                  type: string
                  enum: [male, female, other]
                  example: "male"
                  description: "Giới tính"
                phone:
                  type: string
                  pattern: "^[0-9]{10,11}$"
                  example: "0987654321"
                  description: "Số điện thoại (không bắt buộc)"
      responses:
        201:
          description: Đăng ký thành công
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Đăng ký thành công!"
                  data:
                    $ref: '#/components/schemas/UserResponse'
        400:
          description: Dữ liệu không hợp lệ
          content:
            application/json:
              schema:
                type: object
                properties:
                  fullName:
                    type: string
                    example: "Họ tên là bắt buộc"
                  email:
                    type: string
                    example: "Email không hợp lệ"
                  password:
                    type: string
                    example: "Mật khẩu phải chứa chữ thường, in hoa, số, ký tự đặc biệt"
        500:
          description: Lỗi server
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Đã xảy ra lỗi server"

components:
  schemas:
    UserResponse:
      type: object
      properties:
        id:
          type: string
          example: "60d5ecb8b392e1b8c8f5c123"
        fullName:
          type: string
          example: "Nguyễn Văn A"
        email:
          type: string
          example: "user@example.com"
        gender:
          type: string
          example: "male"
        role:
          type: string
          example: "customer"
        emailVerified:
          type: boolean
          example: false
```

### 3. README Template

```markdown
# Feature Name

## Mô tả

Mô tả ngắn gọn về feature này làm gì.

## Cài đặt

```bash
npm install
```

## Sử dụng

### Basic Usage

```typescript
import { FeatureName } from './feature';

const feature = new FeatureName({
  option1: 'value1',
  option2: 'value2'
});

const result = await feature.doSomething();
```

### Advanced Usage

```typescript
// More complex examples
```

## API Reference

### `doSomething(params)`

Mô tả method này làm gì.

**Parameters:**
- `params` (Object): Tham số đầu vào
  - `param1` (string): Mô tả param1
  - `param2` (number, optional): Mô tả param2

**Returns:**
- Promise<Result>: Mô tả kết quả trả về

**Example:**
```typescript
const result = await feature.doSomething({
  param1: 'value',
  param2: 123
});
```

## Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License
```

---

## Kết luận

Document này cung cấp các quy ước coding toàn diện cho project Gender Healthcare. Việc tuân thủ các quy ước này sẽ giúp:

- **Cải thiện chất lượng code**: Code nhất quán, dễ đọc và bảo trì
- **Tăng hiệu quả làm việc nhóm**: Mọi người hiểu và làm việc theo cùng một standard
- **Giảm thời gian review code**: Code đã tuân thủ quy ước sẽ dễ review hơn
- **Tăng tính bảo mật**: Các best practices về security được áp dụng nhất quán
- **Cải thiện trải nghiệm người dùng**: Code tốt dẫn đến product tốt

### Các bước tiếp theo

1. **Team training**: Đào tạo team về các conventions này
2. **Setup tooling**: Cấu hình ESLint, Prettier, pre-commit hooks
3. **Code review checklist**: Tạo checklist để review code theo conventions
4. **Continuous improvement**: Cập nhật conventions khi cần thiết

### Liên hệ

Nếu có thắc mắc hoặc đề xuất cải thiện conventions, vui lòng tạo issue hoặc discussion trong repository. 