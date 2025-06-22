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
  appointmentType?: string;
  startDate?: string;
  endDate?: string;
  profileId?: string;
  createdByUserId?: string;
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
    return axiosInstance.get('/appointments', { params });
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
  
  // Lấy consultation đang LIVE hiện tại (DOCTOR/STAFF)
  getLiveConsultations: (doctorId?: string) => {
    const params = doctorId ? { doctorId } : {};
    return axiosInstance.get('/doctor-qa/live', { params });
  },
  
  // Lấy tất cả consultation HÔM NAY (DOCTOR/STAFF) 
  getTodayConsultations: (doctorId?: string) => {
    const params = doctorId ? { doctorId } : {};
    return axiosInstance.get('/doctor-qa/today', { params });
  },
  
  // Lấy danh sách yêu cầu tư vấn của user đang đăng nhập
  getMyConsultationRequests: (params?: QueryParams) => {
    return axiosInstance.get('/doctor-qa/my-requests', { params });
  },

  // Lấy chi tiết yêu cầu tư vấn theo ID
  getConsultationById: (qaId: string) => {
    return axiosInstance.get(`/doctor-qa/${qaId}`);
  },

  // =============== PAYMENT INTEGRATION APIs ===============

  // Tạo payment link cho consultation
  createConsultationPaymentLink: (qaId: string) => {
    return axiosInstance.post(`/payments/consultations/${qaId}/payment`);
  },

  // Check payment status cho consultation
  checkConsultationPaymentStatus: (qaId: string) => {
    return axiosInstance.get(`/payments/consultations/${qaId}/payment/status`);
  },

  // Cancel payment cho consultation
  cancelConsultationPayment: (qaId: string) => {
    return axiosInstance.post(`/payments/consultations/${qaId}/payment/cancel`);
  },

  // Fast confirm consultation payment
  fastConfirmConsultationPayment: (data: {
    qaId: string;
    orderCode: string;
    status: string;
  }) => {
    return axiosInstance.put('/payments/consultations/fast-confirm', data);
  },

  // ✅ LEGACY: Cập nhật trạng thái thanh toán (deprecated - use payment system above)
  updatePaymentStatus: (qaId: string, data: UpdatePaymentStatusParams) => {
    console.warn('updatePaymentStatus is deprecated. Use payment system APIs instead.');
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
  },

  // =============== NEW: CONSULTATION TRANSFER APIs ===============
  
  // Check available doctors trong cùng slot với consultation
  checkAvailableDoctors: (consultationId: string) => {
    return axiosInstance.get(`/consultations/${consultationId}/check-available-doctors`);
  },
  
  // Transfer consultation sang bác sĩ khác trong cùng slot
  transferConsultation: (consultationId: string, data: {
    newDoctorId: string;
    transferReason: string;
  }) => {
    return axiosInstance.post(`/consultations/${consultationId}/transfer`, data);
  },

  // =============== NEW: MEETING WORKFLOW APIs ===============
  
  // Kiểm tra consultation đã có Meeting record chưa
  checkMeetingExistence: (qaId: string) => {
    return axiosInstance.get(`/doctor-qa/${qaId}/check-meeting`);
  },
  
  // Tạo hồ sơ Meeting cho consultation (DOCTOR ONLY)
  createMeetingRecord: (qaId: string) => {
    return axiosInstance.post(`/doctor-qa/${qaId}/create-meeting`);
  },
  
  // Hoàn thành consultation và meeting (DOCTOR ONLY)
  completeConsultationWithMeeting: (qaId: string, doctorNotes?: string) => {
    return axiosInstance.put(`/doctor-qa/${qaId}/complete-consultation`, { doctorNotes });
  },

  // =============== NEW: MEETING NOTES & DETAILS APIs ===============
  
  // Cập nhật meeting notes và thông tin (DOCTOR ONLY)
  updateMeetingNotes: (qaId: string, meetingData: {
    notes?: string;
    maxParticipants?: number;
    actualStartTime?: Date;
  }) => {
    return axiosInstance.put(`/doctor-qa/${qaId}/update-meeting`, meetingData);
  },
  
  // Lấy chi tiết meeting của consultation
  getMeetingDetails: (qaId: string) => {
    return axiosInstance.get(`/doctor-qa/${qaId}/meeting-details`);
  }
};

export default consultationApi; 