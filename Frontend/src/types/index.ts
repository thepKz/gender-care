// User types
export interface User {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  gender: 'male' | 'female' | 'other';
  address?: string;
  year?: string;
  role: 'guest' | 'customer' | 'doctor' | 'staff' | 'manager' | 'admin';
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Staff types
export interface StaffDetails {
  _id: string;
  userId: string;
  staffType: 'Nursing' | 'Blogers' | 'Normal';
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// OTP types
export interface OtpCode {
  _id: string;
  userId: string;
  type: 'email_verification' | 'password_reset' | 'login';
  otp: string;
  expires: string;
  verified: boolean;
  verifiedAt?: string;
  attempts: number;
  createdAt: string;
}

export interface OtpRequest {
  email: string;
  type: 'email_verification' | 'password_reset' | 'login';
}

export interface OtpVerificationRequest {
  userId: string;
  otp: string;
  type: 'email_verification' | 'password_reset' | 'login';
}

export interface OtpVerificationResponse {
  success: boolean;
  message: string;
}

// Login history types
export interface LoginHistory {
  _id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  loginAt: string;
  status: 'success' | 'failed';
  failReason?: string;
}

// Doctor types
export interface DoctorInfo {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  phone?: string;
  role?: string;
}

export interface Doctor {
  _id: string;
  userId: DoctorInfo;
  bio?: string;
  experience?: number;
  rating?: number;
  image?: string;
  specialization?: string;
  education?: string;
  certificate?: string;
  workplace?: string;
  createdAt: string;
  updatedAt: string;
}

// Doctor schedule types
export interface TimeSlot {
  _id: string;
  slotTime: string;
  isBooked: boolean;
}

export interface WeekScheduleObject {
  _id: string;
  dayOfWeek: string;
  slots: TimeSlot[];
}

export interface DoctorSchedule {
  _id: string;
  doctorId: string;
  weekSchedule: WeekScheduleObject[];
  createdAt: string;
  updatedAt: string;
}

// Export DoctorSchedule type for external use
export type { DoctorSchedule as DoctorScheduleType };

// Service types
export interface Service {
  _id: string;
  serviceName: string;
  price: number;
  description: string;
  isDeleted: number;
  serviceType: 'consultation' | 'test' | 'treatment' | 'other';
  availableAt: string[]; // ['Athome', 'Online', 'Center']
}

export interface CreateServiceRequest {
  serviceName: string;
  price: number;
  description: string;
  image?: string;
  serviceType: 'consultation' | 'test' | 'treatment' | 'other';
  availableAt: ('Athome' | 'Online' | 'Center')[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {}

export interface GetServicesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  serviceType?: 'consultation' | 'test' | 'treatment' | 'other';
  availableAt?: 'Athome' | 'Online' | 'Center';
  search?: string;
  isActive?: boolean;
  includeDeleted?: boolean; // For manager to view deleted services
}

// Create schedule form values
export interface CreateScheduleFormValues {
  doctorId: string;
  weekSchedule: WeekScheduleObject[];
  overwrite?: boolean; // For overwriting existing schedules
}

export interface ServicesResponse {
  success: boolean;
  data: {
    services: Service[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface ServiceResponse {
  success: boolean;
  data: Service;
  message?: string;
}

// Service package types - Hybrid model with subscription + multi-profile support
export interface ServicePackage {
  _id: string;
  name: string;
  description: string;
  priceBeforeDiscount: number;  // Giá gốc được tính tự động từ tổng giá dịch vụ x maxUsages
  price: number;                // Giá đã giảm (nếu có) – không dùng mã
  serviceIds: string[] | Service[];
  isActive: boolean;
  durationInDays: number;       // 🔹 Thời hạn sử dụng tính theo ngày (30, 90...)
  maxUsages: number;           // 🔹 Số lượt được dùng tối đa cho toàn gói
  maxProfiles: number[];       // 🔹 [1, 2, 4] - Số người tối đa có thể sử dụng gói
  isMultiProfile: boolean;     // 🔹 Gói này có hỗ trợ nhiều hồ sơ không
  pricingInfo?: {
    packageId: string;
    packageName: string;
    baseServicePrice: number;       // Tổng giá của các dịch vụ trong gói
    originalPrice: number;          // Giá gốc được tính tự động
    discountPercentage: number;     // % giảm giá
    durationInDays: number;         // Thời hạn sử dụng
    maxUsages: number;             // Số lượt được dùng tối đa
    maxProfiles: number[];         // Tùy chọn số profile
    isMultiProfile: boolean;       // Hỗ trợ nhiều hồ sơ
    pricePerUsage: number;         // Giá mỗi lượt sử dụng
    pricePerDay: number;           // Giá mỗi ngày sử dụng
    pricePerProfile: number;       // Giá trung bình mỗi profile (cho multi-profile)
  };
  valueMetrics?: {
    savingsAmount: number;
    savingsPercentage: number;
    valueRating: 'excellent' | 'good' | 'fair' | 'poor';
  };
  autoCalculation?: {
    totalServicePrice: number;     // Tổng giá các dịch vụ
    calculatedPrice: number;       // Giá được tính tự động
    formula: string;               // Công thức tính giá
  };
  pricingSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicePackageRequest {
  name: string;
  description: string;
  priceBeforeDiscount: number;
  price: number;                // Chỉ cần nhập giá khuyến mãi, priceBeforeDiscount sẽ được tính tự động
  serviceIds: string[];
  durationInDays: number;       // 🔹 Thời hạn sử dụng tính theo ngày (30, 90...)
  maxUsages: number;           // 🔹 Số lượt được dùng tối đa cho toàn gói
  maxProfiles: number[];       // 🔹 [1, 2, 4] - Số người tối đa có thể sử dụng gói
  isMultiProfile: boolean;     // 🔹 Gói này có hỗ trợ nhiều hồ sơ không
}

export interface UpdateServicePackageRequest extends Partial<CreateServicePackageRequest> {
  isActive?: boolean;
}

export interface GetServicePackagesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
  includeDeleted?: boolean; // For manager to view deleted packages
}

export interface ServicePackagesResponse {
  success: boolean;
  data: {
    packages: ServicePackage[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface ServicePackageResponse {
  success: boolean;
  data: ServicePackage;
  message?: string;
}

// Appointment types
export interface Appointment {
  _id: string;
  createdByUserId: string;
  profileId: string;
  packageId?: string;
  serviceId?: string;
  slotId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'test' | 'other';
  typeLocation: 'clinic' | 'home' | 'Online';
  address?: string;
  description?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Feedback types
export interface Feedback {
  _id: string;
  rating: number;
  feedback: string;
  comment: string;
  appointmentId: string;
  doctorId?: string;
  serviceId?: string;
  packageId?: string;
}

// User Profile types
export interface UserProfile {
  _id: string;
  ownerId: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  year?: Date | string;
  createdAt: string;
  updatedAt: string;
}

// User Profile List Props
export interface UserProfileListProps {
  profiles: UserProfile[];
  loading: boolean;
  onEdit: (profile: UserProfile) => void;
  onDelete: (id: string) => Promise<void>;
  onAdd: () => void;
  searchQuery: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onView: (id: string) => void;
}

// Menstrual cycle types
export interface MenstrualCycle {
  _id: string;
  createdByUserId: string;
  profileId: string;
  startDate: string;
  endDate: string;
  stamp: string;
  symbol: string;
  mood: string;
  observation: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CycleSymptom {
  _id: string;
  cycleId: string;
  symptom: string;
}

// Medication reminder types
export interface MedicationReminder {
  _id: string;
  createdByUserId: string;
  profileId: string;
  name: string;
  type: 'contraceptive' | 'vitamin' | 'other';
  time: string;
  dosage: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDay {
  _id: string;
  reminderId: string;
  notificationTimes: string;
  status: 'send' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// Test types
export interface AppointmentTest {
  _id: string;
  appointmentId: string;
  description: string;
  name: string;
  price: number;
  preparationGuidelines: string;
  resultWaitTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestResult {
  _id: string;
  appointmentTestId: string;
  conclusion: string;
  recommendations: string;
  createdAt: string;
}

export interface TestCategory {
  _id: string;
  name: string;
  description: string;
  unit: string;
  normalRange: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestResultItem {
  _id: string;
  testResultId: string;
  itemNameId: string;
  value: string;
  unit: string;
  currentRange: string;
  flag: 'high' | 'low' | 'normal';
}

// Blog types
export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  authorId: string;
  thumbnail: string;
  published: boolean;
  publishedAt: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostCategory {
  _id: string;
  postId: string;
  categoryId: string;
}

// System config types
export interface SystemConfig {
  _id: string;
  key: string;
  value: string;
}

// Promotion types
export interface Promotion {
  _id: string;
  name: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  maxUses: number;
  usedCount: number;
  applicablePackages: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Doctor Q&A types
export interface DoctorQA {
  _id: string;
  doctorId: string;
  userId: string;
  fullName: string;
  phone: string;
  notes: string;
  question: string;
  status: 'pending_payment' | 'contacted' | 'resolved' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Bill types
export interface Bill {
  _id: string;
  userId: string;
  profileId: string;
  billNumber: string;
  packageId?: string;
  appointmentId?: string;
  promotionId?: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Payment types
export interface Payment {
  _id: string;
  userId: string;
  billId: string;
  amount: number;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'mobile_payment' | 'cash';
  paymentGateway: string;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  paymentAt: string;
}

// Package purchase types - Updated with new subscription fields
export interface PackagePurchase {
  _id: string;
  userId: string;              // Ai là người mua
  profileId: string;           // Hồ sơ bệnh án nào sử dụng gói này
  packageId: string;           // FK đến ServicePackages._id
  billId: string;              // Liên kết hóa đơn thanh toán
  activatedAt: string;         // 🔹 Ngày bắt đầu sử dụng gói
  expiredAt: string;           // 🔹 Ngày hết hạn (tính từ activatedAt + durationInDays)
  remainingUsages: number;     // 🔹 Số lượt còn lại có thể dùng
  totalAllowedUses: number;    // 🔹 Tổng lượt ban đầu được dùng
  isActive: boolean;           // 🔹 Gói còn hiệu lực hay đã hết hạn/lượt
  createdAt: string;
  updatedAt: string;
}

// Medical record types
export interface MedicalRecord {
  _id: string;
  doctorId: string;
  profileId: string;
  appointmentId: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes: string;
  pictures: string[];
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

// Pagination types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}