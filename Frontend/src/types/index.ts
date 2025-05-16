// User types
export interface User {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  avatar? : string;
  gender: string;
  address?: string;
  year?: string;
  role: 'guest' | 'customer' | 'consultant' | 'staff' | 'manager' | 'admin';
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

// Consultant types
export interface Consultant {
  _id: string;
  userId: string;
  bio: string;
  experience: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultantSpecialization {
  _id: string;
  consultantId: string;
  specialization: string;
}

export interface ConsultantEducation {
  _id: string;
  consultantId: string;
  education: string;
}

export interface ConsultantCertificate {
  _id: string;
  consultantId: string;
  certificate: string;
}

export interface Availability {
  _id: string;
  consultantId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  _id: string;
  availabilityId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

// Consultation types
export interface Consultation {
  _id: string;
  consultantId: string;
  bookedByUserId: string;
  profileId: string;
  date: string;
  timeSlotId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  consultationType: 'online' | 'offline';
  description?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

// User Profile types
export interface UserProfile {
  _id: string;
  ownerId: string;
  fullName: string;
  gender: string;
  phone: string;
  year: string;
  createdAt: string;
  updatedAt: string;
}

// Menstrual cycle types
export interface MenstrualCycle {
  _id: string;
  createdByUserId: string;
  profileId: string;
  startDate: string;
  endDate: string;
  flow: 'light' | 'medium' | 'heavy';
  mood: string;
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

export interface ReminderDay {
  _id: string;
  reminderId: string;
  day: string;
}

// STI testing types
export interface TestType {
  _id: string;
  name: string;
  description: string;
  price: number;
  preparationGuidelines: string;
  resultWaitTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestAppointment {
  _id: string;
  userId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  preferredLocation: 'clinic' | 'home';
  address: string;
  notes: string;
  rating: number;
  feedback: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentTest {
  _id: string;
  appointmentId: string;
  testTypeId: string;
  name: string;
  price: number;
}

export interface TestResult {
  _id: string;
  appointmentTestId: string;
  result: string;
  normalRange: string;
  conclusion: 'normal' | 'abnormal';
  recommendations: string;
  createdAt: string;
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