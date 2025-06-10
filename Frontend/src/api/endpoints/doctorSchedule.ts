import axiosInstance from '../axiosConfig';

// Types matching ERD structure
export interface ITimeSlot {
  _id: string;
  slotTime: string; // "07:00-08:00", "08:00-09:00", etc.
  status: 'Free' | 'Booked' | 'Absent';
}

export interface IWeekScheduleObject {
  _id: string;
  dayOfWeek: string; // ISO date string "2025-01-15T00:00:00.000Z" hoac date string "2025-01-15"
  slots: ITimeSlot[];
}

export interface IDoctorSchedule {
  _id: string;
  doctorId: {
    _id: string;
    userId: {
      _id: string;
      fullName: string;
      email: string;
    };
    specialization?: string;
    bio?: string;
  };
  weekSchedule: IWeekScheduleObject[];
  createdAt: string;
  updatedAt: string;
}

// Tạo lịch theo ngày cụ thể
export interface CreateScheduleByDatesRequest {
  doctorId: string;
  dates: string[]; // ["2025-01-15", "2025-01-16", ...] - Chỉ thứ 2-6
  timeSlots?: string[]; // ["07:00-08:00", "08:00-09:00", ...] - optional, sẽ dùng default nếu không có
}

// Response khi có ngày cuối tuần
export interface WeekendErrorResponse {
  success: false;
  message: string;
  weekendDates: string[]; // Các ngày thứ 7, CN bị reject
}

// Tạo lịch theo tháng
export interface CreateScheduleByMonthRequest {
  doctorId: string;
  month: number; // 1-12
  year: number;  // 2025
  timeSlots?: string[]; // optional, sẽ dùng default nếu không có
  excludeWeekends?: boolean; // default: true
  overwrite?: boolean; // default: false
}

export interface UpdateScheduleRequest {
  dayOfWeek?: string;
  slots?: {
    slotTime: string;
    status?: 'Free' | 'Booked' | 'Absent';
  }[];
}

// Doctor Schedule API - Updated to match backend routes
const doctorScheduleApi = {
  // Lấy tất cả lịch làm việc của tất cả bác sĩ (Staff/Manager/Admin only)
  getAll: async (): Promise<IDoctorSchedule[]> => {
    const response = await axiosInstance.get('/doctors/schedules/all');
    // Backend trả về {message: string, data: IDoctorSchedule[]}
    return response.data.data || response.data;
  },

  // Lấy lịch làm việc theo doctor ID (Public - chỉ Free status)
  getDoctorSchedules: async (doctorId: string): Promise<IDoctorSchedule[]> => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/schedules`);
    return response.data.data || response.data;
  },

  // Lấy lịch làm việc theo doctor ID (Staff/Manager/Admin - tất cả status)
  getDoctorSchedulesForStaff: async (doctorId: string): Promise<IDoctorSchedule[]> => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/schedules/staff`);
    return response.data.data || response.data;
  },

  // Lấy lịch làm việc theo tháng - CUSTOM IMPLEMENTATION
  getSchedulesByMonth: async (month: number, year: number): Promise<IDoctorSchedule[]> => {
    // Backend không có endpoint này, chúng ta sẽ lấy tất cả rồi filter
    const allSchedules = await doctorScheduleApi.getAll();
    return allSchedules.filter(schedule => {
      return schedule.weekSchedule.some(week => {
        const weekDate = new Date(week.dayOfWeek);
        return weekDate.getMonth() + 1 === month && weekDate.getFullYear() === year;
      });
    });
  },

  // Lấy lịch làm việc theo ID (không có trong backend routes - sẽ implement sau)
  getById: async (id: string): Promise<IDoctorSchedule> => {
    throw new Error('API getById chưa được implement trong backend');
  },

  // Tạo lịch theo ngày cụ thể - gửi array dates trực tiếp
  createScheduleByDates: async (data: CreateScheduleByDatesRequest): Promise<IDoctorSchedule> => {
    const { doctorId, dates, timeSlots } = data;

    // Validate chỉ cho phép thứ 2-6 (1-5, Monday = 1, Sunday = 0)
    const weekendDates: string[] = [];
    const validDates: string[] = [];

    dates.forEach(dateStr => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Thứ 7 (6) hoặc Chủ nhật (0)
        weekendDates.push(dateStr);
      } else {
        // Thứ 2-6 (1-5)
        validDates.push(dateStr);
      }
    });

    // Nếu có ngày cuối tuần, throw error
    if (weekendDates.length > 0) {
      const weekendNames = weekendDates.map(dateStr => {
        const date = new Date(dateStr);
        const dayName = date.getDay() === 0 ? 'Chủ nhật' : 'Thứ 7';
        return `${dayName} (${dateStr})`;
      });

      throw new Error(`Không thể tạo lịch cho các ngày cuối tuần: ${weekendNames.join(', ')}. Chỉ cho phép tạo lịch từ thứ 2 đến thứ 6.`);
    }

    // Nếu không có ngày hợp lệ nào
    if (validDates.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một ngày từ thứ 2 đến thứ 6.');
    }

    // Gửi object chứa array dates
    const requestData = {
      dates: validDates, // Gửi array dates trực tiếp
      timeSlots: timeSlots || []
    };

    console.log('📤 Sending request to API:', {
      url: `/doctors/${doctorId}/schedules/bulk-days`,
      method: 'POST',
      data: requestData
    });

    const response = await axiosInstance.post(`/doctors/${doctorId}/schedules/bulk-days`, requestData);
    return response.data.data || response.data;
  },

  // Tạo lịch theo tháng - sử dụng bulk-month endpoint
  createScheduleByMonth: async (data: CreateScheduleByMonthRequest): Promise<IDoctorSchedule> => {
    const { doctorId, month, year, timeSlots, excludeWeekends, overwrite } = data;

    const bulkData = {
      year,
      month,
      timeSlots: timeSlots || [],
      overwrite: overwrite || false
    };

    const response = await axiosInstance.post(`/doctors/${doctorId}/schedules/bulk-month`, bulkData);
    return response.data.data || response.data;
  },

  // Cập nhật lịch làm việc
  updateDoctorSchedule: async (id: string, data: UpdateScheduleRequest): Promise<IDoctorSchedule> => {
    // Backend có endpoint PUT /doctors/:id/schedules nhưng cần scheduleId và slotId
    throw new Error('API updateDoctorSchedule cần được cập nhật để phù hợp với backend');
  },

  // Xóa lịch làm việc - sử dụng DELETE /doctors/:id/schedules/:scheduleId
  deleteDoctorSchedule: async (scheduleId: string): Promise<void> => {
    // Cần doctorId để gọi API này, tạm thời throw error
    throw new Error('deleteDoctorSchedule cần doctorId. Sẽ cập nhật sau.');
  },

  // Xóa lịch làm việc với doctorId
  deleteDoctorScheduleWithDoctorId: async (doctorId: string, scheduleId: string): Promise<void> => {
    await axiosInstance.delete(`/doctors/${doctorId}/schedules/${scheduleId}`);
  },

  // Cập nhật trạng thái slot (không có trong backend routes - sẽ implement sau)
  updateSlotStatus: async (scheduleId: string, slotId: string, status: 'Free' | 'Booked' | 'Absent'): Promise<IDoctorSchedule> => {
    throw new Error('API updateSlotStatus chưa được implement trong backend');
  },

  // Lấy thống kê lịch làm việc của doctor
  getDoctorStatistics: async (doctorId: string, startDate?: string, endDate?: string): Promise<any> => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/statistics`);
    return response.data.data || response.data;
  },

  // Lấy thống kê của tất cả bác sĩ
  getAllDoctorsStatistics: async (): Promise<any[]> => {
    const response = await axiosInstance.get('/doctors/statistics/all');
    return response.data.data || response.data;
  },

  // Lấy lịch available cho booking (public) - chỉ Free status
  getAvailableSlots: async (doctorId: string, date: string): Promise<ITimeSlot[]> => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/available-slots?date=${date}`);
    return response.data.data || response.data;
  },

  // Lấy lịch available cho staff (tất cả status)
  getAvailableSlotsForStaff: async (doctorId: string, date: string): Promise<ITimeSlot[]> => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/available-slots/staff?date=${date}`);
    return response.data.data || response.data;
  },

  // Tìm tất cả bác sĩ có lịch trống theo ngày/timeSlot (public)
  getAvailableDoctors: async (date?: string, timeSlot?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (timeSlot) params.append('timeSlot', timeSlot);

    const endpoint = `/doctors/available${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axiosInstance.get(endpoint);
    return response.data.data || response.data;
  },

  // Tìm tất cả bác sĩ và slots theo ngày (staff/manager/admin)
  getAvailableDoctorsForStaff: async (date?: string, timeSlot?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (timeSlot) params.append('timeSlot', timeSlot);

    const endpoint = `/doctors/available/staff${params.toString() ? '?' + params.toString() : ''}`;
    const response = await axiosInstance.get(endpoint);
    return response.data.data || response.data;
  },

  // Book slot cho customer (Manager only)
  bookSlotForCustomer: async (doctorId: string, bookingData: any): Promise<IDoctorSchedule> => {
    const response = await axiosInstance.post(`/doctors/${doctorId}/book-slot`, bookingData);
    return response.data.data || response.data;
  }
};

export default doctorScheduleApi; 