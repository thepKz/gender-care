// Types for Appointment Management
// Includes both regular appointments and doctor QA consultations

// ✅ SIMPLIFIED STATUS TYPES (CHỈ SỬA STATUS THÔI)
export type AppointmentStatus = 'pending_payment' | 'scheduled' | 'completed' | 'cancelled';
export type ConsultationStatus = 'pending_payment' | 'scheduled' | 'consulting' | 'completed' | 'cancelled';
export type UnifiedStatus = 'pending_payment' | 'scheduled' | 'confirmed' | 'consulting' | 'completed' | 'cancelled';

// API Response Interfaces from Backend
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
  slotId?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'test' | 'other';
  typeLocation: 'clinic' | 'home' | 'Online';
  address?: string;
  description?: string;
  notes?: string;
  // ✅ SIMPLIFIED STATUS
  status: AppointmentStatus;
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
  // ✅ SIMPLIFIED STATUS (includes 'consulting' for online sessions)
  status: ConsultationStatus;
  appointmentDate?: string;
  appointmentSlot?: string;
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Unified interface for display in UI
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
  // ✅ UNIFIED STATUS (supports both appointment and consultation statuses)
  status: UnifiedStatus;
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

// Filter options
export interface AppointmentFilters {
  page?: number;
  limit?: number;
  status?: string;
  appointmentType?: string;
  startDate?: string;
  endDate?: string;
} 