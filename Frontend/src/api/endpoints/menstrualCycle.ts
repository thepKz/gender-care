import axiosInstance from '../axiosConfig';
import {
  CreateCycleRequest,
  CreateCycleDayRequest,
  GeneratePostPeakRequest,
  ValidateDayRequest,
  ValidateDayResponse,
  GenderPredictionResponse,
  MenstrualCycle,
  CycleDay,
  MenstrualCycleReminder,
  MenstrualCycleReport,
  CycleComparison,
  CalendarDayData,
  ApiResponse,
  PaginatedResponse
} from '../../types';

interface GetCyclesParams {
  page?: number;
  limit?: number;
  status?: string;
}

interface GetCalendarParams {
  month: number;
  year: number;
}

interface UpdateReminderSettings {
  reminderEnabled?: boolean;
  reminderTime?: string;
}

const menstrualCycleApi = {
  // ==================== MENSTRUAL CYCLES ====================

  // Tạo chu kỳ mới
  createCycle: (data: CreateCycleRequest): Promise<ApiResponse<MenstrualCycle>> => {
    return axiosInstance.post('/menstrual-cycles', data);
  },

  // Lấy danh sách chu kỳ của user
  getCycles: (params?: GetCyclesParams): Promise<ApiResponse<PaginatedResponse<MenstrualCycle>>> => {
    return axiosInstance.get('/menstrual-cycles', { params });
  },

  // Lấy dữ liệu calendar theo tháng
  getCalendarData: (params: GetCalendarParams): Promise<ApiResponse<{ month: number; year: number; days: CalendarDayData[] }>> => {
    return axiosInstance.get('/menstrual-cycles/calendar', { params });
  },

  // Lấy chi tiết chu kỳ
  getCycleDetail: (id: string): Promise<ApiResponse<MenstrualCycle>> => {
    return axiosInstance.get(`/menstrual-cycles/${id}`);
  },

  // Cập nhật chu kỳ
  updateCycle: (id: string, data: Partial<MenstrualCycle>): Promise<ApiResponse<MenstrualCycle>> => {
    return axiosInstance.put(`/menstrual-cycles/${id}`, data);
  },

  // Xóa chu kỳ
  deleteCycle: (id: string): Promise<ApiResponse<void>> => {
    return axiosInstance.delete(`/menstrual-cycles/${id}`);
  },

  // ==================== CYCLE DAYS ====================

  // Thêm/cập nhật dữ liệu ngày trong chu kỳ
  createOrUpdateCycleDay: (data: CreateCycleDayRequest): Promise<ApiResponse<CycleDay>> => {
    return axiosInstance.post('/cycle-days', data);
  },

  // Lấy danh sách ngày theo chu kỳ
  getCycleDays: (cycleId: string): Promise<ApiResponse<CycleDay[]>> => {
    return axiosInstance.get(`/menstrual-cycles/${cycleId}/cycle-days`);
  },

  // Lấy chi tiết một ngày
  getCycleDayDetail: (id: string): Promise<ApiResponse<CycleDay>> => {
    return axiosInstance.get(`/cycle-days/${id}`);
  },

  // Cập nhật cycle day
  updateCycleDay: (id: string, data: Partial<CycleDay>): Promise<ApiResponse<CycleDay>> => {
    return axiosInstance.put(`/cycle-days/${id}`, data);
  },

  // Xóa cycle day
  deleteCycleDay: (id: string): Promise<ApiResponse<void>> => {
    return axiosInstance.delete(`/cycle-days/${id}`);
  },

  // ==================== REPORTS ====================

  // Tạo báo cáo cho chu kỳ
  generateCycleReport: (cycleId: string): Promise<ApiResponse<MenstrualCycleReport>> => {
    return axiosInstance.post(`/reports/generate/${cycleId}`);
  },

  // Lấy báo cáo của một chu kỳ
  getCycleReport: (cycleId: string): Promise<ApiResponse<MenstrualCycleReport>> => {
    return axiosInstance.get(`/reports/${cycleId}`);
  },

  // So sánh 3 chu kỳ gần nhất
  compareThreeCycles: (): Promise<ApiResponse<CycleComparison>> => {
    return axiosInstance.get('/reports/comparison');
  },

  // ==================== REMINDERS ====================

  // Lấy cài đặt nhắc nhở
  getReminderSettings: (): Promise<ApiResponse<MenstrualCycleReminder>> => {
    return axiosInstance.get('/reminders');
  },

  // Cập nhật cài đặt nhắc nhở
  updateReminderSettings: (data: UpdateReminderSettings): Promise<ApiResponse<MenstrualCycleReminder>> => {
    return axiosInstance.put('/reminders', data);
  },

  // Trigger gửi nhắc nhở thủ công (cho admin)
  triggerReminders: (): Promise<ApiResponse<any>> => {
    return axiosInstance.post('/reminders/notify');
  },

  // Lấy thống kê reminder (Admin only)
  getReminderStats: (): Promise<ApiResponse<any>> => {
    return axiosInstance.get('/reminders/stats');
  },

  // ==================== LOGIC & ANALYSIS ====================

  // Tự động đánh dấu các ngày sau ngày X
  generatePostPeakDays: (data: GeneratePostPeakRequest): Promise<ApiResponse<CycleDay[]>> => {
    return axiosInstance.post('/logic/generate-post-peak', data);
  },

  // Kiểm tra validation ngày nhập
  validateDayInput: (data: ValidateDayRequest): Promise<ApiResponse<ValidateDayResponse>> => {
    return axiosInstance.post('/logic/validate-day', data);
  },

  // Dự đoán giới tính thai
  getGenderPrediction: (cycleId: string): Promise<ApiResponse<GenderPredictionResponse>> => {
    return axiosInstance.get(`/logic/gender-prediction/${cycleId}`);
  },

  // ==================== LEGACY SUPPORT ====================

  // Legacy API để backward compatibility với UI cũ
  getPredictions: () => {
    // Có thể map từ compareThreeCycles hoặc implement riêng
    return axiosInstance.get('/reports/comparison');
  },

  // Legacy API cho ovulation
  getOvulationDays: () => {
    return axiosInstance.get('/reports/comparison');
  },

  // ==================== BILLINGS CONSTANTS ====================

  // Constants cho validation rules
  MUCUS_FEELING_RULES: {
    'có máu': ['ướt'],
    'lấm tấm máu': ['ướt'],
    'đục': ['dính', 'ẩm'],
    'đục nhiều sợi': ['ướt', 'trơn'],
    'trong nhiều sợi': ['ướt', 'trơn'],
    'trong và âm hộ căng': ['trơn'],
    'ít chất tiết': ['ẩm', 'ướt']
  } as const,

  // Mucus observation options
  MUCUS_OPTIONS: [
    { value: 'có máu', label: 'Có máu' },
    { value: 'lấm tấm máu', label: 'Lấm tấm máu' },
    { value: 'đục', label: 'Đục' },
    { value: 'đục nhiều sợi', label: 'Đục nhiều sợi' },
    { value: 'trong nhiều sợi', label: 'Trong nhiều sợi' },
    { value: 'trong và âm hộ căng', label: 'Trong và âm hộ căng' },
    { value: 'dầy', label: 'Dầy' },
    { value: 'ít chất tiết', label: 'Ít chất tiết' }
  ] as const,

  // Feeling options  
  FEELING_OPTIONS: [
    { value: 'ướt', label: 'Ướt' },
    { value: 'dính', label: 'Dính' },
    { value: 'ẩm', label: 'Ẩm' },
    { value: 'khô', label: 'Khô' },
    { value: 'trơn', label: 'Trơn' }
  ] as const,

  // Calendar symbols
  CALENDAR_SYMBOLS: {
    M: { symbol: 'M', color: '#e53935', description: 'Kinh nguyệt' },
    X: { symbol: 'X', color: '#ff9800', description: 'Ngày đỉnh' },
    1: { symbol: '1', color: '#fdd835', description: 'Ngày 1 sau đỉnh (75%)' },
    2: { symbol: '2', color: '#66bb6a', description: 'Ngày 2 sau đỉnh (50%)' },
    3: { symbol: '3', color: '#42a5f5', description: 'Ngày 3 sau đỉnh (20%)' },
    C: { symbol: 'C', color: '#ab47bc', description: 'Có thể thụ thai' },
    S: { symbol: 'S', color: '#26c6da', description: 'An toàn' },
    D: { symbol: 'D', color: '#78909c', description: 'Khô' }
  } as const
};

export default menstrualCycleApi; 