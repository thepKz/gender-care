import axiosInstance from '../axiosConfig';

interface BookAppointmentParams {
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
}

// Online Consultation Types
interface CreateOnlineConsultationParams {
  fullName: string;
  phone: string;
  question: string;
  notes?: string;
}

interface UpdatePaymentStatusParams {
  paymentSuccess: boolean;
}

interface JoinMeetingParams {
  participantType: 'doctor' | 'user';
}

interface CompleteMeetingParams {
  doctorNotes?: string;
}

// Định nghĩa types cho query parameters
interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
}

const consultationApi = {
  // =============== EXISTING DOCTOR CONSULTATION APIs ===============
  // Danh sách bác sĩ
  getDoctors: (params?: QueryParams) => {
    return axiosInstance.get('/doctors', { params });
  },
  
  // Chi tiết bác sĩ
  getDoctorDetail: (id: string) => {
    return axiosInstance.get(`/doctors/${id}`);
  },
  
  // Lấy lịch làm việc của bác sĩ
  getDoctorSchedule: (doctorId: string) => {
    return axiosInstance.get(`/doctors/${doctorId}/schedule`);
  },
  
  // Đặt lịch hẹn
  bookAppointment: (data: BookAppointmentParams) => {
    return axiosInstance.post('/appointments', data);
  },
  
  // Lấy danh sách lịch hẹn của người dùng
  getUserAppointments: (params?: QueryParams) => {
    return axiosInstance.get('/appointments/user', { params });
  },
  
  // Hủy lịch hẹn
  cancelAppointment: (id: string, reason?: string) => {
    return axiosInstance.put(`/appointments/${id}/cancel`, { reason });
  },
  
  // Đánh giá dịch vụ
  createFeedback: (data: {
    appointmentId: string;
    rating: number;
    feedback: string;
    comment?: string;
    doctorId?: string;
    serviceId?: string;
    packageId?: string;
  }) => {
    return axiosInstance.post('/feedbacks', data);
  },

  // =============== ONLINE CONSULTATION APIs (Updated) ===============
  
  // Tạo yêu cầu tư vấn trực tuyến mới
  createOnlineConsultation: (data: CreateOnlineConsultationParams) => {
    return axiosInstance.post('/doctor-qa', data);
  },
  
  // Lấy danh sách yêu cầu tư vấn của user đang đăng nhập
  getMyConsultationRequests: (params?: QueryParams) => {
    return axiosInstance.get('/doctor-qa/my-requests', { params });
  },
  
  // Lấy chi tiết yêu cầu tư vấn theo ID
  getConsultationById: (qaId: string) => {
    return axiosInstance.get(`/doctor-qa/${qaId}`);
  },
  
  // Cập nhật trạng thái thanh toán (payment gateway webhook/mock)
  updatePaymentStatus: (qaId: string, data: UpdatePaymentStatusParams) => {
    return axiosInstance.put(`/doctor-qa/${qaId}/payment`, data);
  },
  
  // Bác sĩ xác nhận/từ chối yêu cầu tư vấn
  doctorConfirmConsultation: (qaId: string, action: 'confirm' | 'reject') => {
    return axiosInstance.put(`/doctor-qa/${qaId}/confirm`, { action });
  },
  
  // Staff xếp lịch tự động (tìm slot gần nhất)
  scheduleConsultation: (qaId: string) => {
    return axiosInstance.put(`/doctor-qa/${qaId}/schedule`);
  },
  
  // Cập nhật trạng thái tổng quát của consultation
  updateConsultationStatus: (qaId: string, status: string, doctorNotes?: string) => {
    return axiosInstance.put(`/doctor-qa/${qaId}/status`, { status, doctorNotes });
  },
  
  // Xóa yêu cầu tư vấn (STAFF only)
  deleteConsultation: (qaId: string) => {
    return axiosInstance.delete(`/doctor-qa/${qaId}`);
  },

  // =============== MEETING INTEGRATION APIs ===============
  
  // Lấy thông tin meeting của consultation
  getConsultationMeeting: (qaId: string) => {
    return axiosInstance.get(`/doctor-qa/${qaId}/meeting`);
  },
  
  // Join meeting (USER/DOCTOR)
  joinConsultationMeeting: (qaId: string, data: JoinMeetingParams) => {
    return axiosInstance.post(`/doctor-qa/${qaId}/join-meeting`, data);
  },
  
  // Hoàn thành meeting và consultation (DOCTOR only)
  completeConsultationMeeting: (qaId: string, data: CompleteMeetingParams) => {
    return axiosInstance.put(`/doctor-qa/${qaId}/complete-meeting`, data);
  },

  // =============== DOCTOR QA MANAGEMENT APIs ===============
  
  // Lấy tất cả yêu cầu tư vấn (STAFF/ADMIN only)
  getAllConsultations: (params?: QueryParams) => {
    return axiosInstance.get('/doctor-qa', { params });
  },
  
  // Lấy yêu cầu tư vấn của bác sĩ cụ thể
  getDoctorConsultations: (doctorId: string, params?: QueryParams) => {
    return axiosInstance.get(`/doctor-qa/doctor/${doctorId}`, { params });
  },

  // Alias method cho getDoctorConsultations (để consistent với naming)
  getDoctorQAByDoctorId: (doctorId: string, params?: QueryParams) => {
    return axiosInstance.get(`/doctor-qa/doctor/${doctorId}`, { params });
  },
  
  // Lấy yêu cầu tư vấn của bác sĩ hiện tại (không cần doctorId)
  getMyConsultations: (params?: QueryParams) => {
    try {
      return axiosInstance.get('/doctor-qa/my', { params });
    } catch (error) {
      // Handle case khi doctor chưa có record trong hệ thống
      console.error('Error fetching doctor consultations:', error);
      throw error;
    }
  },
  
  // Tìm bác sĩ có ít lịch đặt nhất (STAFF only)
  getLeastBookedDoctor: () => {
    return axiosInstance.get('/doctor-qa/least-booked-doctor');
  },

  // =============== LEGACY APIs (for backward compatibility) ===============
  
  // Đặt câu hỏi cho bác sĩ (legacy - redirect to createOnlineConsultation)
  askDoctorQuestion: (data: {
    doctorId?: string;
    fullName: string;
    phone: string;
    notes?: string;
    question: string;
  }) => {
    // Convert to new format
    const consultationData: CreateOnlineConsultationParams = {
      fullName: data.fullName,
      phone: data.phone,
      question: data.question,
      notes: data.notes
    };
    return axiosInstance.post('/doctor-qa', consultationData);
  },
  
  // Lấy danh sách câu hỏi của người dùng (legacy)
  getUserQuestions: (params?: QueryParams) => {
    return consultationApi.getMyConsultationRequests(params);
  },
  
  // Lấy chi tiết câu hỏi (legacy)
  getQuestionDetail: (id: string) => {
    return consultationApi.getConsultationById(id);
  },

  // Xác nhận cuộc tư vấn (paid -> confirmed)
  confirmConsultation: (qaId: string) => {
    return axiosInstance.put(`/doctor-qa/${qaId}/confirm-consultation`);
  }
};

export default consultationApi; 