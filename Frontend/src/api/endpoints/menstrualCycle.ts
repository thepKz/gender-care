import axiosInstance from '../axiosConfig';

interface CycleLogParams {
  startDate: string;
  endDate?: string;
  symptoms?: string[];
  notes?: string;
  flow?: 'light' | 'medium' | 'heavy';
  mood?: string;
}

interface MedicationReminderParams {
  name: string;
  type: 'contraceptive' | 'vitamin' | 'other';
  time: string;
  days: string[];
  dosage?: string;
  notes?: string;
}

const menstrualCycleApi = {
  // Lấy lịch sử chu kỳ kinh nguyệt
  getCycles: (params?: any) => {
    return axiosInstance.get('/menstrual-cycles', { params });
  },
  
  // Tạo log chu kỳ mới
  createCycleLog: (data: CycleLogParams) => {
    return axiosInstance.post('/menstrual-cycles/log', data);
  },
  
  // Cập nhật log chu kỳ
  updateCycleLog: (id: string, data: Partial<CycleLogParams>) => {
    return axiosInstance.put(`/menstrual-cycles/log/${id}`, data);
  },
  
  // Xóa log chu kỳ
  deleteCycleLog: (id: string) => {
    return axiosInstance.delete(`/menstrual-cycles/log/${id}`);
  },
  
  // Lấy dự đoán chu kỳ
  getPredictions: () => {
    return axiosInstance.get('/menstrual-cycles/predictions');
  },
  
  // Lấy ngày rụng trứng dự kiến
  getOvulationDays: () => {
    return axiosInstance.get('/menstrual-cycles/ovulation');
  },
  
  // Tạo nhắc nhở thuốc
  createMedicationReminder: (data: MedicationReminderParams) => {
    return axiosInstance.post('/menstrual-cycles/medication-reminders', data);
  },
  
  // Lấy danh sách nhắc nhở thuốc
  getMedicationReminders: () => {
    return axiosInstance.get('/menstrual-cycles/medication-reminders');
  },
  
  // Cập nhật nhắc nhở thuốc
  updateMedicationReminder: (id: string, data: Partial<MedicationReminderParams>) => {
    return axiosInstance.put(`/menstrual-cycles/medication-reminders/${id}`, data);
  },
  
  // Xóa nhắc nhở thuốc
  deleteMedicationReminder: (id: string) => {
    return axiosInstance.delete(`/menstrual-cycles/medication-reminders/${id}`);
  }
};

export default menstrualCycleApi; 