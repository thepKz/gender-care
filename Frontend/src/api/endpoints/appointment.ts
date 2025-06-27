import axiosInstance from '../axiosConfig';
import axios from 'axios';

interface AppointmentFilters {
    page?: number;
    limit?: number;
    status?: string;
    appointmentType?: string;
    typeLocation?: string;
    paymentStatus?: string;
    bookingType?: string;
    startDate?: string;
    endDate?: string;
    profileId?: string;
    createdByUserId?: string;
    doctorId?: string;
}

interface CreateAppointmentParams {
    profileId: string;
    packageId?: string;
    serviceId?: string;
    doctorId?: string;
    slotId?: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: 'consultation' | 'test' | 'other';
    typeLocation: 'clinic' | 'home' | 'Online';
    address?: string;
    description?: string;
    notes?: string;
}

interface TestResultData {
    appointmentId: string;
    profileId: string;
    doctorId: string;
    conclusion?: string;
    recommendations?: string;
    testResultItemsId: string[];
}

export const appointmentApi = {
    // Lấy danh sách cuộc hẹn (có phân trang và lọc)
    getAllAppointments: async (filters: AppointmentFilters = {}) => {
        const response = await axiosInstance.get('/appointments', { params: filters });
        return response.data;
    },

    // Lấy danh sách cuộc hẹn theo doctorId
    getAppointmentsByDoctorId: async (doctorId: string, filters: AppointmentFilters = {}) => {
        const response = await axiosInstance.get(`/appointments/doctor/${doctorId}`, { params: filters });
        return response.data;
    },

    // Lấy danh sách cuộc hẹn của bác sĩ hiện tại (không cần doctorId)
    getMyAppointments: async (filters: AppointmentFilters = {}) => {
        try {
            const response = await axiosInstance.get('/appointments/my', { params: filters });
            return response.data;
        } catch (error) {
            // Handle case khi doctor chưa có record trong hệ thống
            console.error('Error fetching doctor appointments:', error);
            throw error;
        }
    },

    // Lấy danh sách tất cả cuộc hẹn cho Staff (chỉ appointment, không có consultation)
    getStaffAppointments: async (filters: AppointmentFilters = {}) => {
        try {
            const response = await axiosInstance.get('/appointments/staff', { params: filters });
            return response.data;
        } catch (error) {
            console.error('Error fetching staff appointments:', error);
            throw error;
        }
    },

    // Lấy chi tiết cuộc hẹn theo ID
    getAppointmentById: async (id: string) => {
        const response = await axiosInstance.get(`/appointments/${id}`);
        return response.data;
    },

    // Tạo cuộc hẹn mới với validation tốt hơn
    createAppointment: async (appointmentData: CreateAppointmentParams) => {
        // Kiểm tra các trường bắt buộc
        const missingFields = [];
        if (!appointmentData.profileId) missingFields.push('profileId');
        if (!appointmentData.appointmentDate) missingFields.push('appointmentDate');
        if (!appointmentData.appointmentTime) missingFields.push('appointmentTime');
        if (!appointmentData.appointmentType) missingFields.push('appointmentType');
        if (!appointmentData.typeLocation) missingFields.push('typeLocation');
        if (appointmentData.typeLocation === 'home' && !appointmentData.address) missingFields.push('address');
        if (!appointmentData.serviceId && !appointmentData.packageId) missingFields.push('serviceId hoặc packageId');

        if (missingFields.length > 0) {
            throw new Error(`Thiếu các trường bắt buộc: ${missingFields.join(', ')}`);
        }

        // Kiểm tra định dạng ID MongoDB
        const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

        if (!isValidObjectId(appointmentData.profileId)) {
            throw new Error('ID hồ sơ không hợp lệ');
        }

        if (appointmentData.serviceId && !isValidObjectId(appointmentData.serviceId)) {
            throw new Error('ID dịch vụ không hợp lệ');
        }

        if (appointmentData.packageId && !isValidObjectId(appointmentData.packageId)) {
            throw new Error('ID gói dịch vụ không hợp lệ');
        }

        if (appointmentData.doctorId && !isValidObjectId(appointmentData.doctorId)) {
            throw new Error('ID bác sĩ không hợp lệ');
        }

        if (appointmentData.slotId && !isValidObjectId(appointmentData.slotId)) {
            throw new Error('ID slot thời gian không hợp lệ');
        }

        console.log('Dữ liệu gửi đi:', JSON.stringify(appointmentData, null, 2));
        try {
            const response = await axiosInstance.post('/appointments', appointmentData);
            console.log('Dữ liệu nhận về:', JSON.stringify(response.data, null, 2));
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tạo cuộc hẹn:', error);
            if (axios.isAxiosError(error)) {
                console.error('Chi tiết lỗi:', error.response?.data);

                // Phân tích lỗi cụ thể từ API
                if (error.response?.data?.errors) {
                    const errorDetails = Object.entries(error.response.data.errors)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                    throw new Error(`Lỗi validation: ${errorDetails}`);
                } else if (error.response?.data?.message) {
                    throw new Error(error.response.data.message);
                }
            }
            throw error;
        }
    },

    // Cập nhật thông tin cuộc hẹn
    updateAppointment: async (id: string, appointmentData: Partial<CreateAppointmentParams>) => {
        const response = await axiosInstance.put(`/appointments/${id}`, appointmentData);
        return response.data;
    },

    // Hủy cuộc hẹn (soft delete)
    deleteAppointment: async (id: string) => {
        const response = await axiosInstance.delete(`/appointments/${id}`);
        return response.data;
    },

    // Cập nhật trạng thái cuộc hẹn - Updated với đầy đủ status
    updateAppointmentStatus: async (id: string, status: 'pending_payment' | 'pending' | 'scheduled' | 'confirmed' | 'consulting' | 'completed' | 'cancelled') => {
        const response = await axiosInstance.put(`/appointments/${id}/status`, { status });
        return response.data;
    },

    // Cập nhật trạng thái thanh toán
    updatePaymentStatus: async (id: string, status: 'paid' | 'unpaid' | 'partial' | 'refunded') => {
        const response = await axiosInstance.put(`/appointments/${id}/payment`, { status });
        return response.data;
    },

    // Xác nhận cuộc hẹn (paid -> confirmed)
    confirmAppointment: async (id: string) => {
        const response = await axiosInstance.put(`/appointments/${id}/confirm`);
        return response.data;
    },

    // Hủy cuộc hẹn bởi bác sĩ với lý do
    cancelAppointmentByDoctor: async (id: string, reason: string) => {
        const response = await axiosInstance.put(`/appointments/${id}/cancel-by-doctor`, { reason });
        return response.data;
    },

    // ===== TEST RESULTS API ENDPOINTS =====
    
    // Lấy test results cho appointment
    getTestResultsByAppointment: async (appointmentId: string) => {
        const response = await axiosInstance.get(`/test-results/appointment/${appointmentId}`);
        return response.data;
    },

    // Kiểm tra xem appointment đã có test result chưa
    checkTestResultsByAppointment: async (appointmentId: string) => {
        const response = await axiosInstance.get(`/test-results/check/${appointmentId}`);
        return response.data;
    },

    // Tạo test result mới
    createTestResult: async (testResultData: TestResultData) => {
        const response = await axiosInstance.post('/test-results', testResultData);
        return response.data;
    },

    // Cập nhật test result
    updateTestResult: async (testResultId: string, data: { conclusion?: string; recommendations?: string }) => {
        const response = await axiosInstance.put(`/test-results/${testResultId}`, data);
        return response.data;
    },

    // Xóa test result
    deleteTestResult: async (testResultId: string) => {
        const response = await axiosInstance.delete(`/test-results/${testResultId}`);
        return response.data;
    },

    // Lấy test results theo profile
    getTestResultsByProfile: async (profileId: string, page: number = 1, limit: number = 10) => {
        const response = await axiosInstance.get(`/test-results/profile/${profileId}`, {
            params: { page, limit }
        });
        return response.data;
    },

    // Lấy thống kê test results theo tháng
    getTestResultStats: async (year: number, month: number) => {
        const response = await axiosInstance.get(`/test-results/stats/${year}/${month}`);
        return response.data;
    }
};

export default appointmentApi; 