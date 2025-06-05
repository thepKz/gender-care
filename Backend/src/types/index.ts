import { Request } from 'express';
import mongoose from 'mongoose';

export * from "./auth";

// User types
export interface IUser {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  gender: string;
  address?: string;
  year?: Date;
  role: 'guest' | 'customer' | 'doctor' | 'staff' | 'manager' | 'admin';
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Staff types
export interface IStaffDetails {
  _id: string;
  userId: string;
  staffType: 'Nursing' | 'Blogers' | 'Normal';
  createdAt: Date;
  updatedAt: Date;
}

// OTP types
export interface IOtpCode {
  _id: string;
  userId: string;
  type: 'email_verification' | 'password_reset' | 'login';
  otp: string;
  expires: Date;
  verified: boolean;
  verifiedAt?: Date;
  attempts: number;
  createdAt: Date;
}

// Login history types
export interface ILoginHistory {
  _id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  loginAt: Date;
  status: 'success' | 'failed';
  failReason?: string;
}

// Doctor types
export interface IDoctor {
  _id: string;
  userId: string;
  bio: string;
  experience: number;
  rating: number;
  specialization: string;
  education: string;
  certificate: string;
  createdAt: Date;
  updatedAt: Date;
}

// Doctor schedule types
export interface ITimeSlot {
  _id: string;
  slotTime: string;
  isBooked: boolean;
}

export interface IWeekScheduleObject {
  _id: string;
  dayOfWeek: string;
  slots: ITimeSlot[];
}

export interface IDoctorSchedule {
  _id: string;
  doctorId: string;
  weekSchedule: IWeekScheduleObject[];
  createdAt: Date;
  updatedAt: Date;
}

// Service types
export interface IService {
  _id: string;
  serviceName: string;
  price: number;
  description: string;
  isDeleted: boolean;
  serviceType: 'consultation' | 'test' | 'other';
  availableAt: string[]; // ['Athome', 'Online', 'Center']
}

// Service package types
export interface IServicePackage {
  _id: string;
  name: string;
  description: string;
  priceBeforeDiscount: number;
  price: number;
  serviceIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Appointment types
export interface IAppointment {
  _id: string;
  createdByUserId: string;
  profileId: string;
  packageId?: string;
  serviceId?: string;
  slotId: string;
  appointmentDate: Date;
  appointmentTime: string;
  appointmentType: 'consultation' | 'test' | 'other';
  typeLocation: 'clinic' | 'home' | 'Online';
  address?: string;
  description?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Feedback types
export interface IFeedback {
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
export interface IUserProfile {
  _id: string;
  ownerId: string | mongoose.Types.ObjectId;
  fullName: string;
  gender: string;
  phone: string;
  year: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Menstrual cycle types
export interface IMenstrualCycle {
  _id: string;
  createdByUserId: string;
  profileId: string;
  startDate: Date;
  endDate: Date;
  stamp: string;
  symbol: string;
  mood: string;
  observation: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICycleSymptom {
  _id: string;
  cycleId: string;
  symptom: string;
}

// Medication reminder types
export interface IMedicationReminder {
  _id: string;
  createdByUserId: string;
  profileId: string;
  name: string;
  type: 'contraceptive' | 'vitamin' | 'other';
  time: string;
  dosage: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDay {
  _id: string;
  reminderId: string;
  notificationTimes: Date;
  status: 'send' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// Test types
export interface IAppointmentTest {
  _id: string;
  appointmentId: string;
  description: string;
  name: string;
  price: number;
  preparationGuidelines: string;
  resultWaitTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestResult {
  _id: string;
  appointmentTestId: string;
  conclusion: string;
  recommendations: string;
  createdAt: Date;
}

export interface ITestCategory {
  _id: string;
  name: string;
  description: string;
  unit: string;
  normalRange: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestResultItem {
  _id: string;
  testResultId: string;
  itemNameId: string;
  value: string;
  unit: string;
  currentRange: string;
  flag: 'high' | 'low' | 'normal';
}

// Blog types
export interface IBlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  authorId: string;
  thumbnail: string;
  published: boolean;
  publishedAt: Date;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlogCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostCategory {
  _id: string;
  postId: string;
  categoryId: string;
}

// System config types
export interface ISystemConfig {
  _id: string;
  key: string;
  value: string;
}

// Promotion types
export interface IPromotion {
  _id: string;
  name: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: Date;
  endDate: Date;
  maxUses: number;
  usedCount: number;
  applicablePackages: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Doctor Q&A types
export interface IDoctorQA {
  _id: string;
  doctorId: string;
  userId: string;
  fullName: string;
  phone: string;
  notes: string;
  question: string;
  status: 'pending' | 'contacted' | 'resolved' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Bill types
export interface IBill {
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
  createdAt: Date;
  updatedAt: Date;
}

// Payment types
export interface IPayment {
  _id: string;
  userId: string;
  billId: string;
  amount: number;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'mobile_payment' | 'cash';
  paymentGateway: string;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
  paymentAt: Date;
}

// Package purchase types
export interface IPackagePurchase {
  _id: string;
  profileId: string;
  userId: string;
  packageId: string;
  billId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Medical record types
export interface IMedicalRecord {
  _id: string;
  doctorId: string;
  profileId: string;
  appointmentId: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes: string;
  pictures: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types
export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    fullName: string;
    role: string;
  };
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
