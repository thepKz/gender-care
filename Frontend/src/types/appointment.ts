// Types for Appointment Management
// Includes both regular appointments and doctor QA consultations

// ✅ UPDATED STATUS TYPES - Đồng bộ với Backend
export type AppointmentStatus = 'pending_payment' | 'pending' | 'scheduled' | 'confirmed' | 'consulting' | 'completed' | 'cancelled' | 'done_testResultItem' | 'done_testResult';
export type ConsultationStatus = 'pending_payment' | 'scheduled' | 'consulting' | 'completed' | 'cancelled';
export type UnifiedStatus = 'pending_payment' | 'pending' | 'scheduled' | 'confirmed' | 'consulting' | 'completed' | 'cancelled';

// API Response Interfaces from Backend - Updated với fields mới
export interface ApiAppointment {
  _id: string;
  createdByUserId: string;
  profileId: {
    _id: string;
    fullName: string;
    gender: string;
    phone: string;
    year: number;
  };
  serviceId?: {
    _id: string;
    serviceName: string;
    price: number;
    serviceType: string;
  };
  packageId?: {
    _id: string;
    name: string;
    price: number;
  };
  doctorId?: {
    _id: string;
    userId: {
      fullName: string;
      email: string;
    };
    specialization?: string;
  };
  slotId?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'test' | 'other';
  typeLocation: 'clinic' | 'home' | 'Online';
  address?: string;
  description?: string;
  notes?: string;
  // ✅ UPDATED STATUS với đầy đủ các trạng thái
  status: AppointmentStatus;
  totalAmount?: number;
  paymentStatus: 'unpaid' | 'paid' | 'partial' | 'refunded';
  paidAt?: string;
  refund?: {
    refundReason?: string;
    processingStatus?: 'pending' | 'completed' | 'rejected';
    refundInfo?: {
      accountNumber: string;
      accountHolderName: string;
      bankName: string;
      submittedAt: string;
    };
    processedBy?: string;
    processedAt?: string;
    processingNotes?: string;
  };
  bookingType: 'new_package' | 'purchased_package' | 'service_only';
  packagePurchaseId?: string;
  expiresAt?: string;
  paymentLinkId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiConsultation {
  _id: string;
  userId: string;
  doctorId?: {
    _id: string;
    userId: {
      fullName: string;
      email: string;
    };
    specialization?: string;
  };
  fullName: string;
  phone: string;
  question: string;
  notes?: string;
  // ✅ UPDATED STATUS
  status: ConsultationStatus;
  appointmentDate?: string;
  appointmentSlot?: string;
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Unified interface for display in UI - Updated
export interface UnifiedAppointment {
  key: string;
  _id: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  serviceType: string;
  doctorName?: string;
  doctorSpecialization?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'test' | 'online-consultation' | 'other';
  typeLocation: 'clinic' | 'home' | 'Online';
  address?: string;
  description: string;
  notes?: string;
  // ✅ UPDATED STATUS với đầy đủ các trạng thái
  status: UnifiedStatus;
  totalAmount?: number;
  paymentStatus?: 'unpaid' | 'paid' | 'partial' | 'refunded';
  refund?: {
    refundReason?: string;
    processingStatus?: 'pending' | 'completed' | 'rejected';
    refundInfo?: {
      accountNumber: string;
      accountHolderName: string;
      bankName: string;
      submittedAt: string;
    };
    processedBy?: string;
    processedAt?: string;
    processingNotes?: string;
  };
  bookingType?: 'new_package' | 'purchased_package' | 'service_only';
  createdAt: string;
  updatedAt: string;
  type: 'appointment' | 'consultation'; // To distinguish data source
  originalData: ApiAppointment | ApiConsultation; // Keep original for detail view
}

// API Response wrapper
export interface AppointmentListResponse {
  success: boolean;
  data: {
    appointments: ApiAppointment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface ConsultationListResponse {
  success: boolean;
  data: {
    consultations: ApiConsultation[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

// Filter options - Updated với fields mới
export interface AppointmentFilters {
  page?: number;
  limit?: number;
  status?: string;
  appointmentType?: string;
  typeLocation?: string;
  doctorId?: string;
  paymentStatus?: string;
  bookingType?: string;
  startDate?: string;
  endDate?: string;
}

// Test Result Types - Thêm types cho test results
export interface TestResultData {
  _id: string;
  appointmentId: string;
  profileId: string;
  doctorId: string;
  diagnosis?: string;
  recommendations?: string;
  createdAt: string;
  testResultItemsId: string[];
}

export interface TestResultResponse {
  success: boolean;
  data: TestResultData;
  message: string;
}

export interface TestResultListResponse {
  success: boolean;
  data: TestResultData[];
  message: string;
} 