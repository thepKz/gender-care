import axiosInstance from '../axiosConfig';
import axios from 'axios';

interface AppointmentFilters {
    page?: number;
    limit?: number;
    status?: string;
    appointmentType?: string;
    startDate?: string;
    endDate?: string;
    profileId?: string;
    createdByUserId?: string;
}

interface CreateAppointmentParams {
    profileId: string;
    packageId?: string;
    serviceId?: string;
    slotId?: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: 'consultation' | 'test' | 'other';
    typeLocation: 'clinic' | 'home' | 'online';
    address?: string;
    description?: string;
    notes?: string;
}

export const appointmentApi = {
    // Lấy danh sách cuộc hẹn (có phân trang và lọc)
    getAllAppointments: async (filters: AppointmentFilters = {}) => {
        const response = await axiosInstance.get('/appointments', { params: filters });
        return response.data;
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
        const invalidFields = [];

        if (!isValidObjectId(appointmentData.profileId)) {
            invalidFields.push('ID hồ sơ');
        }

        if (appointmentData.serviceId && !isValidObjectId(appointmentData.serviceId)) {
            invalidFields.push('ID dịch vụ');
        }

        if (appointmentData.packageId && !isValidObjectId(appointmentData.packageId)) {
            invalidFields.push('ID gói dịch vụ');
        }

        if (appointmentData.slotId && !isValidObjectId(appointmentData.slotId)) {
            invalidFields.push('ID slot thời gian');
        }

        if (invalidFields.length > 0) {
            throw new Error(`Các trường không hợp lệ: ${invalidFields.join(', ')}`);
        }

        // Kiểm tra định dạng ngày tháng
        const isValidDate = (dateStr: string) => {
            const date = new Date(dateStr);
            return !isNaN(date.getTime());
        };

        if (!isValidDate(appointmentData.appointmentDate)) {
            throw new Error('Ngày hẹn không hợp lệ');
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
                console.error('Status code:', error.response?.status);
                console.error('Headers:', error.response?.headers);

                // Phân tích lỗi cụ thể từ API
                if (error.response?.data?.errors) {
                    const errorDetails = Object.entries(error.response.data.errors)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                    throw new Error(`Lỗi validation: ${errorDetails}`);
                } else if (error.response?.data?.message) {
                    throw new Error(error.response.data.message);
                } else if (error.response?.status === 401) {
                    throw new Error('Bạn cần đăng nhập để đặt lịch');
                } else if (error.response?.status === 404) {
                    throw new Error('Không tìm thấy tài nguyên yêu cầu');
                } else if (error.response?.status === 500) {
                    throw new Error('Lỗi máy chủ, vui lòng thử lại sau');
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

    // Cập nhật trạng thái cuộc hẹn
    updateAppointmentStatus: async (id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
        const response = await axiosInstance.put(`/appointments/${id}/status`, { status });
        return response.data;
    }
};

export default appointmentApi; 