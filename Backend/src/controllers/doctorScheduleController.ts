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