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
    conclusion: string;
    symptoms: string;
    treatment: string;
    notes?: string;
    medicines?: any[];
    status?: string;
    pictures?: string[];
  }) => {
    return axiosInstance.post('/medical-records', data);
  },
  
  // Cập nhật hồ sơ y tế
  updateMedicalRecord: (id: string, data: {
    conclusion?: string;
    symptoms?: string;
    treatment?: string;
    notes?: string;
    medicines?: any[];
    status?: string;
  }) => {
    console.log('🔧 API updateMedicalRecord called with:', { id, data });
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

  // ===== MEDICAL RECORD SYNC APIs =====

  // Đồng bộ một appointment thành medical record
  syncAppointmentToMedicalRecord: (appointmentId: string) => {
    return axiosInstance.post(`/medical-records/sync/${appointmentId}`);
  },

  // Đồng bộ tất cả appointments "Hoàn thành kết quả"
  syncAllCompletedAppointments: () => {
    return axiosInstance.post('/medical-records/sync/bulk');
  },

  // Kiểm tra trạng thái sync của appointment
  checkSyncStatus: (appointmentId: string) => {
    return axiosInstance.get(`/medical-records/sync/status/${appointmentId}`);
  },

  // Lấy danh sách appointments cần sync
  getPendingSyncAppointments: () => {
    return axiosInstance.get('/medical-records/sync/pending');
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
  },

  // Lấy medical records theo appointment ID
  getMedicalRecordsByAppointment: async (appointmentId: string) => {
    const response = await axiosInstance.get(`/medical-records/appointment/${appointmentId}`);
    return response;
  },

  // Kiểm tra medical record existence
  checkMedicalRecordByAppointment: async (appointmentId: string) => {
    const response = await axiosInstance.get(`/medical-records/check/${appointmentId}`);
    return response;
  },

  // Lấy medical records theo profile ID
  getMedicalRecordsByProfile: async (profileId: string, page: number = 1, limit: number = 10) => {
    const response = await axiosInstance.get(`/medical-records/profile/${profileId}`, {
      params: { page, limit }
    });
    return response;
  },

  // Xóa medical record
  deleteMedicalRecord: async (recordId: string) => {
    const response = await axiosInstance.delete(`/medical-records/${recordId}`);
    return response;
  },

  // Lấy danh sách medicines
  getMedicines: async (page: number = 1, limit: number = 20, search?: string) => {
    const response = await axiosInstance.get('/medicines', {
      params: { page, limit, search }
    });
    return response;
  },

  // Tìm kiếm medicines
  searchMedicines: async (query: string, limit: number = 20) => {
    const response = await axiosInstance.get('/medicines/search', {
      params: { q: query, limit }
    });
    return response;
  },

  // Tạo medicine mới (Admin/Pharmacist only)
  createMedicine: async (data: {
    name: string;
    activeIngredient?: string;
    dosageForm: string;
    strength?: string;
    manufacturer?: string;
    description?: string;
    sideEffects?: string;
    contraindications?: string;
    storageConditions?: string;
  }) => {
    const response = await axiosInstance.post('/medicines', data);
    return response;
  },

  // Tạo medication reminder
  createMedicationReminder: async (data: {
    profileId: string;
    medicineId: string;
    medicalRecordId?: string;
    dosage: string;
    frequency: string;
    duration: number;
    instructions?: string;
    reminderTimes: string[];
  }) => {
    const response = await axiosInstance.post('/medication-reminders', data);
    return response;
  },

  // Lấy medication reminders theo profile
  getMedicationRemindersByProfile: async (profileId: string) => {
    const response = await axiosInstance.get(`/medication-reminders/profile/${profileId}`);
    return response;
  },

  // Đánh dấu đã uống thuốc
  markMedicationTaken: async (reminderId: string, data: {
    takenAt: string;
    notes?: string;
  }) => {
    const response = await axiosInstance.put(`/medication-reminders/${reminderId}/take`, data);
    return response;
  },

  // Lấy medication dashboard
  getMedicationDashboard: async (profileId: string) => {
    const response = await axiosInstance.get(`/medication-reminders/dashboard/${profileId}`);
    return response;
  }
};

export default medicalApi; 