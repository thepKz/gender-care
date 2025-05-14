// User types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: 'guest' | 'customer' | 'consultant' | 'staff' | 'manager' | 'admin';
  emailVerified?: boolean;
  isActive?: boolean;
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

// Thêm các interface cho OTP
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

// Consultant types
export interface Consultant {
  id: string;
  user: User;
  specialization: string[];
  experience: number;
  bio: string;
  education: string[];
  certificates: string[];
  rating: number;
  availability: Availability[];
}

export interface Availability {
  id: string;
  consultantId: string;
  date: string;
  slots: TimeSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: string;
  availabilityId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

// Consultation types
export interface Consultation {
  id: string;
  customerId: string;
  customer?: User;
  consultantId: string;
  consultant?: Consultant;
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

// Question types
export interface Question {
  id: string;
  title: string;
  content: string;
  userId?: string;
  user?: User;
  isAnonymous: boolean;
  categories: string[];
  answers: Answer[];
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Menstrual cycle types
export interface CycleLog {
  id: string;
  userId: string;
  user?: User;
  startDate: string;
  endDate?: string;
  symptoms?: string[];
  notes?: string;
  flow?: 'light' | 'medium' | 'heavy';
  mood?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationReminder {
  id: string;
  userId: string;
  user?: User;
  name: string;
  type: 'contraceptive' | 'vitamin' | 'other';
  time: string;
  days: string[];
  dosage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// STI testing types
export interface TestType {
  id: string;
  name: string;
  description: string;
  price: number;
  preparationGuidelines?: string;
  resultWaitTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentTest {
  id: string;
  appointmentId: string;
  testTypeId: string;
  name: string;
  price: number;
}

export interface TestAppointment {
  id: string;
  userId: string;
  user?: User;
  tests: AppointmentTest[];
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  preferredLocation: 'clinic' | 'home';
  address?: string;
  notes?: string;
  results?: TestResult[];
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestResult {
  id: string;
  appointmentTestId: string;
  result: string;
  normalRange?: string;
  conclusion: 'normal' | 'abnormal';
  recommendations?: string;
  createdAt: string;
}

// Blog types
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  authorId: string;
  author?: User;
  categories: BlogCategory[];
  thumbnail?: string;
  published: boolean;
  publishedAt?: string;
  likes: number;
  comments: BlogComment[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  postId: string;
  userId?: string;
  user?: User;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
} 