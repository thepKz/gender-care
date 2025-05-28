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
  
  // Đặt câu hỏi cho bác sĩ
  askDoctorQuestion: (data: {
    doctorId: string;
    fullName: string;
    phone: string;
    notes?: string;
    question: string;
  }) => {
    return axiosInstance.post('/doctor-qa', data);
  },
  
  // Lấy danh sách câu hỏi của người dùng
  getUserQuestions: (params?: QueryParams) => {
    return axiosInstance.get('/doctor-qa/user', { params });
  },
  
  // Lấy chi tiết câu hỏi
  getQuestionDetail: (id: string) => {
    return axiosInstance.get(`/doctor-qa/${id}`);
  }
};

export default consultationApi; 