import axiosInstance from '../axiosConfig';

// Định nghĩa types cho query parameters
interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  profileId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
}

const medicalApi = {
  // Lấy danh sách hồ sơ y tế
  getMedicalRecords: (params?: QueryParams) => {
    return axiosInstance.get('/medical-records', { params });
  },
  
  // Lấy chi tiết hồ sơ y tế
  getMedicalRecordDetail: (id: string) => {
    return axiosInstance.get(`/medical-records/${id}`);
  },
  
  // Tạo hồ sơ y tế (dành cho bác sĩ)
  createMedicalRecord: (data: {
    profileId: string;
    appointmentId: string;
    diagnosis: string;
    symptoms: string;
    treatment: string;
    notes?: string;
    pictures?: string[];
  }) => {
    return axiosInstance.post('/medical-records', data);
  },
  
  // Cập nhật hồ sơ y tế
  updateMedicalRecord: (id: string, data: {
    diagnosis?: string;
    symptoms?: string;
    treatment?: string;
    notes?: string;
    pictures?: string[];
  }) => {
    return axiosInstance.put(`/medical-records/${id}`, data);
  },
  
  // Lấy danh sách xét nghiệm
  getAppointmentTests: (appointmentId: string) => {
    return axiosInstance.get(`/appointment-tests/appointment/${appointmentId}`);
  },
  
  // Lấy kết quả xét nghiệm
  getTestResults: (appointmentTestId: string) => {
    return axiosInstance.get(`/test-results/appointment-test/${appointmentTestId}`);
  },
  
  // Lấy chi tiết kết quả xét nghiệm
  getTestResultDetail: (id: string) => {
    return axiosInstance.get(`/test-results/${id}`);
  },
  
  // Lấy danh sách loại xét nghiệm
  getTestCategories: (params?: QueryParams) => {
    return axiosInstance.get('/test-categories', { params });
  },
  
  // Lấy chi tiết từng chỉ số xét nghiệm
  getTestResultItems: (testResultId: string) => {
    return axiosInstance.get(`/test-result-items/test-result/${testResultId}`);
  },
  
  // Upload hình ảnh y tế
  uploadMedicalImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return axiosInstance.post('/medical-records/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

export default medicalApi; 