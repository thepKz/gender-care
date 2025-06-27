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

interface ReminderNotifyResponse {
  message: string;
  notifiedUsers?: number;
}

interface ReminderStatsResponse {
  totalReminders: number;
  activeReminders: number;
  lastNotification?: string;
}

interface TestEmailResponse {
  success: boolean;
  message: string;
}

interface AutoFixResponse {
  success: boolean;
  fixes: Array<{
    action: string;
    message: string;
  }>;
  message: string;
}

interface CycleAnalysisResponse {
  isComplete: boolean;
  analysis: string;
  phase: string;
  peakDay?: {
    date: string;
    cycleDayNumber: number;
  };
  pattern: {
    type: string;
    name: string;
    description: string;
    confidence: string;
  };
  nextPeakPrediction?: {
    prediction: {
      date: string;
      cycleDayNumber: number;
      range: {
        earliest: string;
        latest: string;
      };
    };
    confidence: string;
    message: string;
  };
  recommendations: string[];
}

interface AutoCompleteResponse {
  success: boolean;
  message: string;
  completedCycle: MenstrualCycle;
}

interface CycleGuidanceResponse {
  currentPhase: string;
  instructions: string[];
  tips: string[];
  warnings?: string[];
}

interface DetailedCycleReport {
  cycle: MenstrualCycle;
  chartData: Array<{
    date: string;
    dayNumber: number;
    mucusObservation?: string;
    feeling?: string;
    symbol: string;
    fertilityProbability: number;
    isPeakDay: boolean;
  }>;
  resultCalculation?: {
    peakDayX: number;
    dayXPlus1: number;
    dayY?: number;
    result?: number;
    status: 'normal' | 'short' | 'long' | 'incomplete';
    message: string;
  };
  statistics: {
    totalDays: number;
    peakDay?: number;
    fertileDays: number;
    dryDays: number;
  };
}

interface ThreeCycleComparisonReport {
  cycles: Array<{
    cycleNumber: number;
    startDate: string;
    endDate?: string;
    peakDay?: number;
    result?: number;
    status: string;
    length?: number;
  }>;
  pattern: {
    averageLength: number;
    averageResult: number;
    consistency: 'stable' | 'variable' | 'irregular';
    trend: 'normal' | 'getting_shorter' | 'getting_longer';
  };
  healthAssessment: {
    overall: 'healthy' | 'needs_attention' | 'consult_doctor';
    message: string;
    recommendations: string[];
  };
}

interface PredictiveAnalysisReport {
  nextCycle: {
    predictedStartDate: string;
    predictedPeakDay: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    range: {
      earliest: string;
      latest: string;
    };
  };
  basedOn: {
    cycles: number;
    averageLength: number;
    averageResultValue: number;
    patternRecognition: string;
  };
  warnings?: string[];
}

interface HealthAssessmentReport {
  overall: {
    status: 'healthy' | 'needs_monitoring' | 'consult_doctor';
    score: number; // 0-100
    summary: string;
  };
  factors: {
    cycleRegularity: {
      score: number;
      status: string;
      notes: string;
    };
    peakDayConsistency: {
      score: number;
      status: string;
      notes: string;
    };
    lengthVariation: {
      score: number;
      status: string;
      notes: string;
    };
  };
  recommendations: string[];
  redFlags?: string[];
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
  triggerReminders: (): Promise<ApiResponse<ReminderNotifyResponse>> => {
    return axiosInstance.post('/reminders/notify');
  },

  // Lấy thống kê reminder (Admin only)
  getReminderStats: (): Promise<ApiResponse<ReminderStatsResponse>> => {
    return axiosInstance.get('/reminders/stats');
  },

  // Test gửi email nhắc nhở
  testEmailReminder: (): Promise<ApiResponse<TestEmailResponse>> => {
    return axiosInstance.post('/reminders/test-email');
  },

  // ==================== DATA RECOVERY & VALIDATION ====================

  // Tự động sửa chữa dữ liệu chu kỳ bị lỗi
  autoFixCycleData: (): Promise<ApiResponse<AutoFixResponse>> => {
    return axiosInstance.post('/menstrual-cycles/auto-fix');
  },

  // Validation nâng cao cho dữ liệu ngày
  validateAdvancedCycleDay: (data: {
    cycleId: string;
    date: string;
    mucusObservation?: string;
    feeling?: string;
  }): Promise<ApiResponse<{
    isValid: boolean;
    warnings: string[];
    errors: string[];
    suggestions: string[];
  }>> => {
    return axiosInstance.post('/menstrual-cycles/validate-advanced', data);
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
    'lấm tấm máu': ['ướt', 'khô'],
    'đục': ['dính', 'ẩm', 'khô'],
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
  } as const,

  // ==================== CYCLE ANALYSIS ====================

  // Lấy báo cáo phân tích chu kỳ hoàn chỉnh
  getCycleAnalysis: (cycleId: string): Promise<ApiResponse<CycleAnalysisResponse>> => {
    return axiosInstance.get(`/menstrual-cycles/${cycleId}/analysis`);
  },

  // Tự động đánh dấu chu kỳ hoàn thành
  autoCompleteCycle: (cycleId: string): Promise<ApiResponse<AutoCompleteResponse>> => {
    return axiosInstance.post(`/menstrual-cycles/${cycleId}/auto-complete`);
  },

  // Lấy hướng dẫn chi tiết về chu kỳ hiện tại
  getCycleGuidance: (cycleId: string): Promise<ApiResponse<CycleGuidanceResponse>> => {
    return axiosInstance.get(`/menstrual-cycles/${cycleId}/guidance`);
  },

  // ==================== ADVANCED CYCLE REPORTS ====================

  // Lấy báo cáo chi tiết cho 1 chu kỳ với biểu đồ
  getDetailedCycleReport: (cycleId: string): Promise<ApiResponse<DetailedCycleReport>> => {
    return axiosInstance.get(`/menstrual-cycles/${cycleId}/detailed-report`);
  },

  // Lấy báo cáo so sánh 3 chu kỳ gần nhất với health assessment
  getThreeCycleComparison: (): Promise<ApiResponse<ThreeCycleComparisonReport>> => {
    return axiosInstance.get('/menstrual-cycles/three-cycle-comparison');
  },

  // Dự đoán chu kỳ tiếp theo dựa trên pattern phân tích
  getPredictiveAnalysis: (): Promise<ApiResponse<PredictiveAnalysisReport>> => {
    return axiosInstance.get('/menstrual-cycles/predictive-analysis');
  },

  // Đánh giá sức khỏe dựa trên chu kỳ
  getHealthAssessment: (): Promise<ApiResponse<HealthAssessmentReport>> => {
    return axiosInstance.get('/menstrual-cycles/health-assessment');
  }
};

export default menstrualCycleApi; 