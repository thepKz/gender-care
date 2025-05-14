import axiosInstance from '../axiosConfig';

interface BookConsultationParams {
  consultantId: string;
  date: string;
  timeSlot: string;
  description?: string;
  consultationType: 'online' | 'offline';
}

interface AskQuestionParams {
  title: string;
  content: string;
  isAnonymous?: boolean;
  categories?: string[];
}

const consultationApi = {
  // Danh sách tư vấn viên
  getConsultants: (params?: any) => {
    return axiosInstance.get('/consultants', { params });
  },
  
  // Chi tiết tư vấn viên
  getConsultantDetail: (id: string) => {
    return axiosInstance.get(`/consultants/${id}`);
  },
  
  // Lấy lịch trống của tư vấn viên
  getConsultantAvailability: (consultantId: string, date: string) => {
    return axiosInstance.get(`/consultants/${consultantId}/availability`, { 
      params: { date } 
    });
  },
  
  // Đặt lịch tư vấn
  bookConsultation: (data: BookConsultationParams) => {
    return axiosInstance.post('/consultations/book', data);
  },
  
  // Lấy danh sách lịch tư vấn của người dùng
  getUserConsultations: (params?: any) => {
    return axiosInstance.get('/consultations/user', { params });
  },
  
  // Hủy lịch tư vấn
  cancelConsultation: (id: string, reason?: string) => {
    return axiosInstance.put(`/consultations/${id}/cancel`, { reason });
  },
  
  // Đánh giá buổi tư vấn
  rateConsultation: (id: string, rating: number, feedback?: string) => {
    return axiosInstance.post(`/consultations/${id}/rating`, { rating, feedback });
  },
  
  // Đặt câu hỏi
  askQuestion: (data: AskQuestionParams) => {
    return axiosInstance.post('/consultations/questions', data);
  },
  
  // Lấy danh sách câu hỏi
  getQuestions: (params?: any) => {
    return axiosInstance.get('/consultations/questions', { params });
  },
  
  // Lấy chi tiết câu hỏi
  getQuestionDetail: (id: string) => {
    return axiosInstance.get(`/consultations/questions/${id}`);
  }
};

export default consultationApi; 