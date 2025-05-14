import axiosInstance from '../axiosConfig';

interface BookTestParams {
  testIds: string[];
  appointmentDate: string;
  appointmentTime: string;
  preferredLocation?: 'clinic' | 'home';
  address?: string;
  notes?: string;
}

const stiTestingApi = {
  // Lấy danh sách các loại xét nghiệm STI
  getTestTypes: () => {
    return axiosInstance.get('/sti-tests/types');
  },
  
  // Lấy thông tin chi tiết của loại xét nghiệm
  getTestTypeDetail: (id: string) => {
    return axiosInstance.get(`/sti-tests/types/${id}`);
  },
  
  // Đặt lịch xét nghiệm
  bookTest: (data: BookTestParams) => {
    return axiosInstance.post('/sti-tests/book', data);
  },
  
  // Lấy danh sách đặt xét nghiệm của người dùng
  getUserTestAppointments: (params?: any) => {
    return axiosInstance.get('/sti-tests/user', { params });
  },
  
  // Lấy chi tiết lịch xét nghiệm
  getTestAppointmentDetail: (id: string) => {
    return axiosInstance.get(`/sti-tests/appointments/${id}`);
  },
  
  // Hủy lịch xét nghiệm
  cancelTestAppointment: (id: string, reason?: string) => {
    return axiosInstance.put(`/sti-tests/appointments/${id}/cancel`, { reason });
  },
  
  // Lấy kết quả xét nghiệm
  getTestResults: (appointmentId: string) => {
    return axiosInstance.get(`/sti-tests/appointments/${appointmentId}/results`);
  },
  
  // Đánh giá dịch vụ xét nghiệm
  rateTestService: (appointmentId: string, rating: number, feedback?: string) => {
    return axiosInstance.post(`/sti-tests/appointments/${appointmentId}/rating`, {
      rating,
      feedback
    });
  },
  
  // Lấy giá các loại xét nghiệm
  getTestPrices: () => {
    return axiosInstance.get('/sti-tests/prices');
  }
};

export default stiTestingApi; 