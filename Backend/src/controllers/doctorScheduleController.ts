import { Request, Response } from 'express';
import * as doctorScheduleService from '../services/doctorScheduleService';
import * as doctorService from '../services/doctorService';

// GET /doctors/:id/schedules - Xem lịch làm việc của bác sĩ (PUBLIC - chỉ Free)
export const getDoctorSchedules = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const schedules = await doctorScheduleService.getDoctorSchedules(id, false);
    
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
    const schedules = await doctorScheduleService.getDoctorSchedulesForStaff(id);
    
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

    const newSchedule = await doctorScheduleService.createDoctorSchedule(id, { date });

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

    const updatedSchedule = await doctorScheduleService.updateDoctorSchedule(id, { date, slotId, status });

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

    const result = await doctorScheduleService.deleteDoctorSchedule(id, scheduleId);
    
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

    const availableSlots = await doctorScheduleService.getAvailableSlots(id, date as string, false);
    
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

    const availableDoctors = await doctorScheduleService.getAvailableDoctors(
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

    const updatedSchedule = await doctorScheduleService.setDoctorAbsentForDay(id, date);

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

    const allSlots = await doctorScheduleService.getAvailableSlotsForStaff(id, date as string);
    
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

    const allDoctors = await doctorScheduleService.getAvailableDoctorsForStaff(
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
    const updatedSchedule = await doctorScheduleService.updateDoctorSchedule(doctorId, { 
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

    const result = await doctorScheduleService.createBulkDoctorScheduleForDays(id, dates);

    const successCount = result.successCount;
    const totalRequested = result.totalRequested;
    const weekendCount = result.weekendCount;
    const weekendDates = result.weekendDates;

    let message = `Tạo lịch thành công cho ${successCount}/${totalRequested} ngày`;
    
    if (weekendCount > 0) {
      message += `. Đã bỏ qua ${weekendCount} ngày cuối tuần: ${weekendDates.join(', ')}`;
    }

    if (successCount > 0) {
      res.status(201).json({
        message,
        data: result,
        summary: {
          totalRequested,
          successful: successCount,
          errors: result.errorCount,
          weekendsSkipped: weekendCount
        }
      });
    } else {
      res.status(400).json({
        message: weekendCount > 0 
          ? `Không thể tạo lịch cho bất kỳ ngày nào. Đã bỏ qua ${weekendCount} ngày cuối tuần`
          : 'Không thể tạo lịch cho bất kỳ ngày nào',
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

    const result = await doctorScheduleService.createBulkDoctorScheduleForMonth(id, month, year);

    const successCount = result.successCount;
    const totalWorkingDays = result.totalWorkingDays;
    const weekendsExcluded = result.weekendsExcluded;

    if (successCount > 0) {
      res.status(201).json({
        message: `Tạo lịch thành công cho tháng ${month}/${year}: ${successCount}/${totalWorkingDays} ngày làm việc (đã loại bỏ ${weekendsExcluded} ngày cuối tuần)`,
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

// POST /doctors/:id/schedules/bulk - Staff tạo lịch hàng loạt cho bác sĩ (nhiều ngày cùng lúc)
export const createBulkDoctorSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { dates } = req.body;

    if (!dates || !Array.isArray(dates)) {
      res.status(400).json({ 
        message: 'Vui lòng cung cấp danh sách ngày làm việc (dates array)' 
      });
      return;
    }

    const result = await doctorScheduleService.createBulkDoctorSchedule(id, { dates });

    const successCount = result.results.successful;
    const failedCount = result.results.failed;
    const weekendCount = result.results.weekendSkipped;

    let message = `Hoàn thành! Tạo thành công ${successCount} ngày, bỏ qua ${failedCount} ngày.`;
    
    if (weekendCount > 0) {
      message += ` Đã loại bỏ ${weekendCount} ngày cuối tuần: ${result.results.details.weekendDates.join(', ')}.`;
    }
    
    if (result.results.details.created.length > 0) {
      message += ` Ngày đã tạo: ${result.results.details.created.join(', ')}.`;
    }
    
    if (result.results.details.skipped.length > 0) {
      message += ` Ngày đã tồn tại: ${result.results.details.skipped.join(', ')}.`;
    }

    if (result.results.details.errors.length > 0) {
      message += ` Lỗi: ${result.results.details.errors.map((e: any) => e.date + ' (' + e.reason + ')').join(', ')}.`;
    }

    res.status(201).json({ 
      message,
      data: result,
      summary: {
        totalRequested: dates.length,
        successful: successCount,
        failed: failedCount,
        weekendsSkipped: weekendCount
      }
    });
  } catch (error: any) {
    console.log('Error in createBulkDoctorSchedule:', error);
    res.status(400).json({ 
      message: error.message || 'Đã xảy ra lỗi khi tạo lịch làm việc hàng loạt' 
    });
  }
};

// GET /doctors/schedules/all - Lấy tất cả lịch làm việc của tất cả bác sĩ (PUBLIC - chỉ Free)
export const getAllDoctorsSchedules = async (req: Request, res: Response) => {
  try {
    const allSchedules = await doctorScheduleService.getAllDoctorsSchedules(false);
    
    return res.status(200).json({ 
      message: `Lấy tất cả lịch làm việc thành công (chỉ hiển thị slot trống) - Tìm thấy ${allSchedules.length} bác sĩ có lịch làm việc`,
      data: allSchedules,
      totalDoctorsWithSchedules: allSchedules.length
    });
  } catch (error: any) {
    console.log('Error in getAllDoctorsSchedules:', error);
    return res.status(500).json({ 
      message: error.message || 'Đã xảy ra lỗi khi lấy tất cả lịch làm việc' 
    });
  }
};

// GET /doctors/schedules/all/staff - Staff xem tất cả lịch làm việc của tất cả bác sĩ (tất cả status)
export const getAllDoctorsSchedulesForStaff = async (req: Request, res: Response) => {
  try {
    const allSchedules = await doctorScheduleService.getAllDoctorsSchedulesForStaff();
    
    return res.status(200).json({ 
      message: `Lấy tất cả lịch làm việc thành công (tất cả status) - Tìm thấy ${allSchedules.length} bác sĩ có lịch làm việc`,
      data: allSchedules,
      totalDoctorsWithSchedules: allSchedules.length
    });
  } catch (error: any) {
    console.log('Error in getAllDoctorsSchedulesForStaff:', error);
    return res.status(500).json({ 
      message: error.message || 'Đã xảy ra lỗi khi lấy tất cả lịch làm việc' 
    });
  }
};

// DEBUG ENDPOINT - Test schedule creation logic với timezone fix
export const debugScheduleCreation = async (req: Request, res: Response) => {
  try {
    const { testMonth = 6, testYear = 2025 } = req.query;
    const month = parseInt(testMonth as string);
    const year = parseInt(testYear as string);
    
    const debugInfo = {
      month,
      year,
      testResults: [] as any[],
      summary: {
        totalDays: 0,
        mondayToFriday: 0,
        fridayCount: 0, // Đếm riêng thứ 6
        saturdays: 0,
        sundays: 0,
        shouldCreateCount: 0
      },
      timezoneInfo: {
        systemTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        utcOffset: new Date().getTimezoneOffset()
      }
    };

    // Generate all days in month and test logic
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      // FIX: Dùng string để tránh timezone issue
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      
      // UPDATED: Test logic mới - chỉ loại bỏ Chủ nhật
      const isSunday = dayOfWeek === 0;
      const shouldCreate = !isSunday; // T2-T7 đều được tạo
      
      const result = {
        date: dateStr,
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        isSunday,
        shouldCreate,
        isFriday: dayOfWeek === 5,
        isSaturday: dayOfWeek === 6, // Đánh dấu thứ 7 mới được thêm
        reason: isSunday 
          ? `Bị loại bỏ - Chủ nhật`
          : `Được phép tạo lịch - ${dayNames[dayOfWeek]} (T2-T7)`
      };
      
      debugInfo.testResults.push(result);
      debugInfo.summary.totalDays++;
      
      if (dayOfWeek >= 1 && dayOfWeek <= 5) debugInfo.summary.mondayToFriday++;
      if (dayOfWeek === 5) debugInfo.summary.fridayCount++; // Đếm riêng thứ 6
      if (dayOfWeek === 6) debugInfo.summary.saturdays++;
      if (dayOfWeek === 0) debugInfo.summary.sundays++;
      if (shouldCreate) debugInfo.summary.shouldCreateCount++;
    }

    // Thống kê thứ 6 cụ thể
    const fridaysInMonth = debugInfo.testResults.filter(r => r.isFriday);

    // Thống kê thứ 7 cũng
    const saturdaysInMonth = debugInfo.testResults.filter(r => r.isSaturday);

    return res.status(200).json({
      message: `🔄 REVERTED: Debug test cho tháng ${month}/${year} - Logic: T2-T6 (Monday-Friday)`,
      data: debugInfo,
      fridaysAnalysis: {
        totalFridays: fridaysInMonth.length,
        fridayDates: fridaysInMonth.map(f => f.date),
        allShouldBeCreated: fridaysInMonth.every(f => f.shouldCreate)
      },
      saturdaysAnalysis: {
        totalSaturdays: saturdaysInMonth.length,
        saturdayDates: saturdaysInMonth.map(s => s.date),
        allShouldBeCreated: saturdaysInMonth.every(s => s.shouldCreate),
        note: "🚫 Thứ 7 bây giờ BỊ LOẠI BỎ (không tạo lịch)"
      },
      expectedBehavior: {
        description: "🔄 BACK TO NORMAL: Chỉ tạo lịch từ thứ 2 (Monday=1) đến thứ 6 (Friday=5)",
        shouldExclude: ["Thứ 7 (Saturday=6)", "Chủ nhật (Sunday=0)"],
        shouldInclude: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"]
      },
      conclusion: `✅ Logic chuẩn: Làm việc T2-T6 (${debugInfo.summary.mondayToFriday} ngày), nghỉ cuối tuần (${debugInfo.summary.saturdays + debugInfo.summary.sundays} ngày)`
    });
    
  } catch (error: any) {
    console.log('Error in debugScheduleCreation:', error);
    return res.status(500).json({ 
      message: error.message || 'Lỗi debug' 
    });
  }
};

// 🔥 UPDATED: Real test endpoint - tạo lịch thật để verify T6 & T7 
export const realTestFridaySchedule = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Cần doctorId để test' });
    }

    // 🔥 UPDATED: Test cả thứ 6 và thứ 7
    const testDays = [
      '2025-06-06', // Thứ 6 đầu tiên của tháng 6
      '2025-06-07', // Thứ 7 đầu tiên (MỚI THÊM)
      '2025-06-13', // Thứ 6 thứ 2
      '2025-06-14', // Thứ 7 thứ 2 (MỚI THÊM)
      '2025-06-20', // Thứ 6 thứ 3
      '2025-06-21', // Thứ 7 thứ 3 (MỚI THÊM)
      '2025-06-27', // Thứ 6 cuối tháng
      '2025-06-28'  // Thứ 7 cuối tháng (MỚI THÊM)
    ];

    const results = [];
    
    for (const testDate of testDays) {
      try {
        // Import service function
        const doctorService = await import('../services/doctorService');
        
        const result = await doctorScheduleService.createDoctorSchedule(doctorId, { date: testDate });
        
        const dateObj = new Date(testDate);
        const dayOfWeek = dateObj.getDay();
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        
        results.push({
          date: testDate,
          dayName: dayNames[dayOfWeek],
          success: true,
          message: `✅ Tạo lịch thành công cho ${dayNames[dayOfWeek]}: ${testDate}`,
          scheduleId: result?._id || 'N/A'
        });
        
      } catch (error: any) {
        const dateObj = new Date(testDate);
        const dayOfWeek = dateObj.getDay();
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        
        results.push({
          date: testDate,
          dayName: dayNames[dayOfWeek],
          success: false,
          message: `❌ Lỗi cho ${dayNames[dayOfWeek]}: ${error.message}`,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    const fridayResults = results.filter(r => r.dayName === 'T6');
    const saturdayResults = results.filter(r => r.dayName === 'T7');
    const fridaySuccess = fridayResults.filter(r => r.success).length;
    const saturdaySuccess = saturdayResults.filter(r => r.success).length;

    return res.status(200).json({
      message: `🔥 Test tạo lịch T6 & T7 hoàn tất: ${successCount}/${testDays.length} thành công`,
      testTarget: "🔥 UPDATED: Thứ 6 & Thứ 7 trong tháng 6/2025 (logic mới T2-T7)",
      results,
      summary: {
        totalTested: testDays.length,
        successful: successCount,
        failed: errorCount,
        fridaysTest: {
          total: fridayResults.length,
          successful: fridaySuccess,
          conclusion: fridaySuccess === fridayResults.length ? "✅ Thứ 6 OK" : "❌ Thứ 6 có lỗi"
        },
        saturdaysTest: {
          total: saturdayResults.length,
          successful: saturdaySuccess,
          conclusion: saturdaySuccess === saturdayResults.length ? "✅ Thứ 7 OK (MỚI THÊM)" : "❌ Thứ 7 có lỗi"
        },
        overallConclusion: successCount === testDays.length 
          ? "🎉 HOÀN HẢO! Cả T6 & T7 đều hoạt động!" 
          : "⚠️ Có vấn đề với logic tạo lịch"
      },
      recommendation: errorCount > 0 
        ? "Kiểm tra lỗi chi tiết và database state. Có thể lịch đã tồn tại hoặc doctor không hợp lệ."
        : "🔥 Logic T2-T7 hoạt động đúng! Giờ bạn có thể tạo lịch cả thứ 7."
    });

  } catch (error: any) {
    console.log('Error in realTestFridaySchedule:', error);
    return res.status(500).json({ 
      message: error.message || 'Lỗi test thứ 6' 
    });
  }
};

// 🔥 TIMEZONE FIX: Test logic với local time cho Việt Nam
export const testSingleDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Cần parameter ?date=YYYY-MM-DD để test' });
    }

    // Sử dụng local time cho Việt Nam
    const [year, month, day] = (date as string).split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    
    // Method 1: getDay() với local time
    const dayOfWeek = localDate.getDay();
    
    // Method 2: toLocaleDateString cho VN
    const dayName = localDate.toLocaleDateString('vi-VN', { 
      weekday: 'long',
      timeZone: 'Asia/Ho_Chi_Minh' 
    });
    
    // Method 3: UTC check để so sánh
    const utcDate = new Date(date + 'T00:00:00.000Z');
    const dayOfWeekUTC = utcDate.getDay();
    
    // Method 4: VN timezone explicit
    const vnDate = new Date(date + 'T00:00:00.000+07:00');
    const dayOfWeekVN = vnDate.getDay();
    
    // 🔄 DECISION LOGIC: T2-T6 only (Monday-Friday)
    const isWeekend = (dayOfWeek === 0) || (dayOfWeek === 6) || (dayName.includes('Chủ nhật')) || (dayName.includes('Thứ Bảy'));
    const shouldCreate = !isWeekend;

    return res.status(200).json({
      message: `🔥 Timezone Fix Test cho ngày: ${date}`,
      input: { date, timezone: 'Asia/Ho_Chi_Minh (UTC+7)' },
      results: {
        localTime: { 
          dayOfWeek, 
          dayName,
          meaning: `${dayOfWeek} (0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7)` 
        },
        utcTime: { 
          dayOfWeek: dayOfWeekUTC, 
          difference: dayOfWeekUTC !== dayOfWeek ? '⚠️ Khác với local time!' : '✅ Giống local time'
        },
        vnTimezone: { 
          dayOfWeek: dayOfWeekVN,
          difference: dayOfWeekVN !== dayOfWeek ? '⚠️ Khác với local time!' : '✅ Giống local time'
        },
        decision: {
          isWeekend,
          shouldCreate,
          reason: isWeekend ? '🚫 Weekend (T7/CN) - Không tạo lịch' : '✅ Working day (T2-T6) - Tạo lịch được',
          method: 'Local Time (UTC+7)'
        }
      },
      conclusion: shouldCreate ? 
        `✅ PASS: Ngày ${date} (${dayName}) có thể tạo lịch` : 
        `🚫 FAIL: Ngày ${date} (${dayName}) là cuối tuần - không tạo lịch`
    });

  } catch (error: any) {
    console.log('Error in testSingleDate:', error);
    return res.status(500).json({ 
      message: error.message || 'Lỗi test ngày' 
    });
  }
};

 
