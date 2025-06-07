import axiosInstance from '../axiosConfig';

interface Doctor {
    _id: string;
    userId?: {
        _id: string;
        fullName: string;
        email: string;
        avatar?: string;
        phone?: string;
    };
    bio?: string;
    experience?: number;
    rating?: number;
    specialization?: string;
    education?: string;
    certificate?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface DoctorResponse {
    success: boolean;
    message?: string;
    data: Doctor[];
}

interface SingleDoctorResponse {
    success: boolean;
    message?: string;
    data: Doctor;
}

const doctorApi = {
    // Lấy danh sách bác sĩ
    getAllDoctors: async () => {
        try {
            const response = await axiosInstance.get<Doctor[] | DoctorResponse>('/doctors');
            // Kiểm tra xem response có đúng định dạng không
            if (Array.isArray(response.data)) {
                return { success: true, data: response.data };
            } else if (response.data.data) {
                return { success: true, data: response.data.data };
            }
            return { success: false, message: 'Định dạng dữ liệu không hợp lệ', data: [] };
        } catch (error) {
            console.error('Error fetching doctors:', error);
            return { success: false, message: 'Không thể tải danh sách bác sĩ', data: [] };
        }
    },

    // Lấy chi tiết bác sĩ theo ID
    getDoctorById: async (id: string) => {
        try {
            const response = await axiosInstance.get<Doctor | SingleDoctorResponse>(`/doctors/${id}`);
            if ('_id' in response.data) {
                return { success: true, data: response.data };
            } else if (response.data.data) {
                return { success: true, data: response.data.data };
            }
            return { success: false, message: 'Định dạng dữ liệu không hợp lệ', data: null };
        } catch (error) {
            console.error(`Error fetching doctor with ID ${id}:`, error);
            return { success: false, message: 'Không thể tải thông tin bác sĩ', data: null };
        }
    },

    // Lấy lịch trống của bác sĩ
    getDoctorAvailableSlots: async (doctorId: string, date: string) => {
        try {
            const response = await axiosInstance.get(`/doctors/${doctorId}/available-slots`, {
                params: { date }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching available slots for doctor ${doctorId}:`, error);
            throw error;
        }
    },
};

export default doctorApi; 