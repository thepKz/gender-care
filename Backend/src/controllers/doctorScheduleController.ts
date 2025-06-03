import { Request, Response } from 'express';
import * as doctorService from '../services/doctorService';

// GET /doctors/:id/schedules - Xem lịch làm việc của bác sĩ (PUBLIC - chỉ Free)
export const getDoctorSchedules = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const schedules = await doctorService.getDoctorSchedules(id, false);
    
    if (!schedules) {
      return res.status(404).json({ message: 'Bác sĩ chưa có lịch làm việc nào' });
    }

    return res.status(200).json({ 
      message: 'Lấy lịch làm việc thành công (chỉ hiển thị slot trống)',
      data: schedules 
    });
  } catch (error: any) {
    console.log('Error in getDoctorSchedules:', error);
    return res.status(500).json({ 
      message: error.message || 'Đã xảy ra lỗi khi lấy lịch làm việc' 
    });
  }
};

// GET /doctors/:id/schedules/staff - Staff xem tất cả lịch làm việc của bác sĩ
export const getDoctorSchedulesForStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedules = await doctorService.getDoctorSchedulesForStaff(id);
    
    if (!schedules) {
      return res.status(404).json({ message: 'Bác sĩ chưa có lịch làm việc nào' });
    }

    return res.status(200).json({ 
      message: 'Lấy tất cả lịch làm việc thành công (tất cả status)',
      data: schedules 
    });
  } catch (error: any) {
    console.log('Error in getDoctorSchedulesForStaff:', error);
    return res.status(500).json({ 
      message: error.message || 'Đã xảy ra lỗi khi lấy lịch làm việc' 
    });
  }
};

// POST /doctors/:id/schedules - Staff tạo lịch cho bác sĩ (8 slots cố định theo ngày)
export const createDoctorSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ngày làm việc' });
    }

    const newSchedule = await doctorService.createDoctorSchedule(id, { date });

    return res.status(201).json({ 
      message: 'Tạo lịch làm việc thành công! Đã tạo 8 slots từ 7h-17h',
      data: newSchedule 
    });
  } catch (error: any) {
    console.log('Error in createDoctorSchedule:', error);
    return res.status(400).json({ 
      message: error.message || 'Đã xảy ra lỗi khi tạo lịch làm việc' 
    });
  }
};

// PUT /doctors/:id/schedules - Cập nhật trạng thái của slot
export const updateDoctorSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, slotId, status } = req.body;

    if (!date || !slotId || !status) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp đầy đủ: date, slotId, status' 
      });
    }

    // Validate status values
    const validStatuses = ["Free", "Booked", "Absent"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Status không hợp lệ. Chỉ chấp nhận: Free, Booked, Absent' 
      });
    }

    const updatedSchedule = await doctorService.updateDoctorSchedule(id, { date, slotId, status });

    // Dynamic message based on status
    let message = '';
    switch (status) {
      case 'Booked':
        message = 'Đặt lịch thành công';
        break;
      case 'Free':
        message = 'Hủy lịch thành công, slot đã được giải phóng';
        break;
      case 'Absent':
        message = 'Đã đánh dấu bác sĩ nghỉ trong slot này';
        break;
    }

    return res.status(200).json({ 
      message,
      data: updatedSchedule 
    });
  } catch (error: any) {
    console.log('Error in updateDoctorSchedule:', error);
    return res.status(400).json({ 
      message: error.message || 'Đã xảy ra lỗi khi cập nhật lịch làm việc' 
    });
  }
};

// DELETE /doctors/:id/schedules/:scheduleId - Xóa lịch của một ngày cụ thể (set thành Absent)
export const deleteDoctorSchedule = async (req: Request, res: Response) => {
  try {
    const { id, scheduleId } = req.params;

    const result = await doctorService.deleteDoctorSchedule(id, scheduleId);
    
    if (!result) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc để xóa' });
    }

    return res.status(200).json({ 
      message: 'Xóa lịch làm việc thành công - Đã đánh dấu bác sĩ nghỉ toàn bộ ngày (tất cả slots = Absent)',
      data: result 
    });
  } catch (error: any) {
    console.log('Error in deleteDoctorSchedule:', error);
    return res.status(400).json({ 
      message: error.message || 'Đã xảy ra lỗi khi xóa lịch làm việc' 
    });
  }
};

// GET /doctors/:id/available-slots?date=YYYY-MM-DD - Lấy các slot trống theo ngày
export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp ngày (date) để tìm slot trống' 
      });
    }

    const availableSlots = await doctorService.getAvailableSlots(id, date as string, false);
    
    return res.status(200).json({ 
      message: `Tìm thấy ${availableSlots.length} slot trống trong ngày ${date}`,
      data: availableSlots 
    });
  } catch (error: any) {
    console.log('Error in getAvailableSlots:', error);
    return res.status(500).json({ 
      message: error.message || 'Đã xảy ra lỗi khi lấy slot trống' 
    });
  }
};

// GET /doctors/available?date=YYYY-MM-DD&timeSlot=07:00-08:00 - Tìm tất cả bác sĩ có lịch trống
export const getAvailableDoctors = async (req: Request, res: Response) => {
  try {
    const { date, timeSlot } = req.query;

    if (!date) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp ngày (date) để tìm bác sĩ có lịch trống' 
      });
    }

    const availableDoctors = await doctorService.getAvailableDoctors(
      date as string, 
      timeSlot as string | undefined,
      false
    );
    
    const message = timeSlot 
      ? `Tìm thấy ${availableDoctors.length} bác sĩ có lịch trống trong khung giờ ${timeSlot} ngày ${date}`
      : `Tìm thấy ${availableDoctors.length} bác sĩ có lịch trống trong ngày ${date}`;

    return res.status(200).json({ 
      message,
      data: availableDoctors,
      searchCriteria: {
        date,
        timeSlot: timeSlot || 'Tất cả khung giờ',
        totalFound: availableDoctors.length
      }
    });
  } catch (error: any) {
    console.log('Error in getAvailableDoctors:', error);
    return res.status(500).json({ 
      message: error.message || 'Đã xảy ra lỗi khi tìm bác sĩ có lịch trống' 
    });
  }
};

// PUT /doctors/:id/absent/:date - Staff đánh dấu bác sĩ nghỉ toàn bộ ngày
export const setDoctorAbsent = async (req: Request, res: Response) => {
  try {
    const { id, date } = req.params;

    if (!date) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp ngày (date) để đánh dấu bác sĩ nghỉ' 
      });
    }

    const updatedSchedule = await doctorService.setDoctorAbsentForDay(id, date);

    return res.status(200).json({ 
      message: `Đã đánh dấu bác sĩ nghỉ toàn bộ ngày ${date}. Tất cả 8 slots đã được set thành "Absent"`,
      data: updatedSchedule 
    });
  } catch (error: any) {
    console.log('Error in setDoctorAbsent:', error);
    return res.status(400).json({ 
      message: error.message || 'Đã xảy ra lỗi khi đánh dấu bác sĩ nghỉ' 
    });
  }
};

// GET /doctors/:id/available-slots/staff?date=YYYY-MM-DD - Staff xem tất cả slots theo ngày
export const getAvailableSlotsForStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp ngày (date) để xem slots' 
      });
    }

    const allSlots = await doctorService.getAvailableSlotsForStaff(id, date as string);
    
    return res.status(200).json({ 
      message: `Tìm thấy ${allSlots.length} slots trong ngày ${date} (tất cả status)`,
      data: allSlots 
    });
  } catch (error: any) {
    console.log('Error in getAvailableSlotsForStaff:', error);
    return res.status(500).json({ 
      message: error.message || 'Đã xảy ra lỗi khi lấy slots' 
    });
  }
};

// GET /doctors/available/staff?date=YYYY-MM-DD&timeSlot=07:00-08:00 - Staff xem tất cả bác sĩ và slots
export const getAvailableDoctorsForStaff = async (req: Request, res: Response) => {
  try {
    const { date, timeSlot } = req.query;

    if (!date) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp ngày (date) để xem bác sĩ' 
      });
    }

    const allDoctors = await doctorService.getAvailableDoctorsForStaff(
      date as string, 
      timeSlot as string | undefined
    );
    
    const message = timeSlot 
      ? `Tìm thấy ${allDoctors.length} bác sĩ trong khung giờ ${timeSlot} ngày ${date} (tất cả status)`
      : `Tìm thấy ${allDoctors.length} bác sĩ trong ngày ${date} (tất cả status)`;

    return res.status(200).json({ 
      message,
      data: allDoctors,
      searchCriteria: {
        date,
        timeSlot: timeSlot || 'Tất cả khung giờ',
        totalFound: allDoctors.length,
        viewType: 'staff'
      }
    });
  } catch (error: any) {
    console.log('Error in getAvailableDoctorsForStaff:', error);
    return res.status(500).json({ 
      message: error.message || 'Đã xảy ra lỗi khi xem bác sĩ' 
    });
  }
};

// Lấy thống kê về bác sĩ: số slot booked, absent, và số ngày nghỉ
export const getDoctorStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: doctorId } = req.params;

    if (!doctorId) {
      res.status(400).json({ 
        message: 'Thiếu ID bác sĩ' 
      });
      return;
    }

    const statistics = await doctorService.getDoctorStatistics(doctorId);
    
    res.status(200).json({
      message: 'Lấy thống kê bác sĩ thành công',
      data: statistics
    });

  } catch (error) {
    console.error('Error getting doctor statistics:', error);
    res.status(500).json({ 
      message: 'Lỗi server khi lấy thống kê bác sĩ' 
    });
  }
};

// Lấy thống kê tất cả bác sĩ (STAFF ONLY)
export const getAllDoctorsStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const allStatistics = await doctorService.getAllDoctorsStatistics();
    
    res.status(200).json({
      message: `Lấy thống kê thành công cho ${allStatistics.length} bác sĩ`,
      data: allStatistics,
      summary: {
        totalDoctors: allStatistics.length,
        totalBookedSlots: allStatistics.reduce((sum, doc) => sum + doc.bookedSlots, 0),
        totalAbsentSlots: allStatistics.reduce((sum, doc) => sum + doc.absentSlots, 0),
        totalAbsentDays: allStatistics.reduce((sum, doc) => sum + doc.absentDays, 0)
      }
    });

  } catch (error) {
    console.error('Error getting all doctors statistics:', error);
    res.status(500).json({ 
      message: 'Lỗi server khi lấy thống kê tất cả bác sĩ' 
    });
  }
};

// Book slot cho customer (STAFF ONLY) - Khi customer gọi điện đặt lịch
export const bookSlotForCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: doctorId } = req.params;
    const { date, slotId } = req.body;

    if (!date || !slotId) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp đầy đủ: date, slotId' 
      });
      return;
    }

    // Sử dụng service có sẵn để update status thành "Booked"
    const updatedSchedule = await doctorService.updateDoctorSchedule(doctorId, { 
      date, 
      slotId, 
      status: 'Booked' 
    });

    res.status(200).json({ 
      message: 'Đặt lịch thành công cho customer!',
      data: updatedSchedule,
      bookingInfo: {
        doctorId,
        date,
        slotId,
        status: 'Booked'
      }
    });

  } catch (error: any) {
    console.error('Error booking slot for customer:', error);
    res.status(400).json({ 
      message: error.message || 'Đã xảy ra lỗi khi đặt lịch cho customer' 
    });
  }
};

// POST /doctors/:id/schedules/bulk-days - Staff tạo lịch cho nhiều ngày cụ thể
export const createBulkDoctorScheduleForDays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { dates } = req.body;

    // Validation
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp mảng dates (YYYY-MM-DD)' 
      });
      return;
    }

    if (dates.length > 31) {
      res.status(400).json({ 
        message: 'Không thể tạo lịch cho quá 31 ngày một lúc' 
      });
      return;
    }

    // Validate each date format
    const invalidDates = dates.filter((date: string) => {
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(date);
    });

    if (invalidDates.length > 0) {
      res.status(400).json({ 
        message: `Định dạng ngày không hợp lệ: ${invalidDates.join(', ')}. Vui lòng sử dụng YYYY-MM-DD` 
      });
      return;
    }

    const result = await doctorService.createBulkDoctorScheduleForDays(id, dates);

    if (result.success) {
      res.status(201).json({
        message: `Tạo lịch thành công cho ${result.successCount}/${result.totalRequested} ngày`,
        data: result
      });
    } else {
      res.status(400).json({
        message: 'Không thể tạo lịch cho bất kỳ ngày nào',
        data: result
      });
    }

  } catch (error: any) {
    console.log('Error in createBulkDoctorScheduleForDays:', error);
    res.status(400).json({ 
      message: error.message || 'Đã xảy ra lỗi khi tạo lịch cho nhiều ngày' 
    });
  }
};

// POST /doctors/:id/schedules/bulk-month - Staff tạo lịch cho cả tháng (trừ T7, CN)
export const createBulkDoctorScheduleForMonth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { month, year } = req.body;

    // Validation
    if (!month || !year) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp month (1-12) và year (2024-2030)' 
      });
      return;
    }

    if (typeof month !== 'number' || typeof year !== 'number') {
      res.status(400).json({ 
        message: 'Month và year phải là số' 
      });
      return;
    }

    if (month < 1 || month > 12) {
      res.status(400).json({ 
        message: 'Month phải từ 1-12' 
      });
      return;
    }

    if (year < 2024 || year > 2030) {
      res.status(400).json({ 
        message: 'Year phải từ 2024-2030' 
      });
      return;
    }

    const result = await doctorService.createBulkDoctorScheduleForMonth(id, month, year);

    if (result.success) {
      res.status(201).json({
        message: `Tạo lịch thành công cho tháng ${month}/${year}: ${result.successCount}/${result.totalWorkingDays} ngày làm việc (đã loại bỏ ${result.weekendsExcluded} ngày cuối tuần)`,
        data: result
      });
    } else {
      res.status(400).json({
        message: `Không thể tạo lịch cho tháng ${month}/${year}`,
        data: result
      });
    }

  } catch (error: any) {
    console.log('Error in createBulkDoctorScheduleForMonth:', error);
    res.status(400).json({ 
      message: error.message || 'Đã xảy ra lỗi khi tạo lịch cho cả tháng' 
    });
  }
}; 