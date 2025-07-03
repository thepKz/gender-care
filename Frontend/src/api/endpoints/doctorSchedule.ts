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

    const response = await axiosInstance.get('doctors/schedules/all/staff');

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
    try {
      console.log('🔍 [API] Getting schedules for month:', { month, year });
      
      // Backend không có endpoint này, chúng ta sẽ lấy tất cả rồi filter
      const allSchedules = await doctorScheduleApi.getAll();
      
      console.log('📊 [API] Total schedules received:', allSchedules.length);
      
      // Filter schedules by month/year
      const filteredSchedules = allSchedules.filter(schedule => {
        return schedule.weekSchedule.some(week => {
          const weekDate = new Date(week.dayOfWeek);
          const scheduleMonth = weekDate.getMonth() + 1;
          const scheduleYear = weekDate.getFullYear();
          
          return scheduleMonth === month && scheduleYear === year;
        });
      });
      
      console.log('✅ [API] Filtered schedules for target month:', filteredSchedules.length);
      return filteredSchedules;
      
    } catch (error: unknown) {
      console.error('❌ [API] Error in getSchedulesByMonth:', error);
      
      // Return empty array instead of throwing to prevent UI crashes
      if (error instanceof Error) {
        console.error('❌ [API] Error details:', error.message);
        // Still throw the error so UI can handle it properly
        throw new Error(`Không thể tải lịch làm việc tháng ${month}/${year}: ${error.message}`);
      } else {
        throw new Error(`Không thể tải lịch làm việc tháng ${month}/${year}. Vui lòng thử lại sau.`);
      }
    }
  },

  // Lấy lịch làm việc theo ID (không có trong backend routes - sẽ implement sau)
  getById: async (id: string): Promise<IDoctorSchedule> => {
    throw new Error('API getById chưa được implement trong backend');
  },

  // Tạo lịch theo ngày cụ thể - gửi array dates trực tiếp
  createScheduleByDates: async (data: CreateScheduleByDatesRequest): Promise<IDoctorSchedule> => {
    const { doctorId, dates, timeSlots } = data;

    // ✅ CHO PHÉP TẤT CẢ NGÀY TRONG TUẦN - KHÔNG FILTER WEEKEND NỮA
    const requestData = {
      dates, // Gửi array dates trực tiếp, không filter
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