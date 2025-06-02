import { Request, Response } from 'express';
import * as doctorService from '../services/doctorService';

// GET /doctors/:id/schedules - Xem tất cả lịch làm việc của bác sĩ
export const getDoctorSchedules = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const schedules = await doctorService.getDoctorSchedules(id);
    
    if (!schedules) {
      return res.status(404).json({ message: 'Bác sĩ chưa có lịch làm việc nào' });
    }

    return res.status(200).json({ 
      message: 'Lấy lịch làm việc thành công',
      data: schedules 
    });
  } catch (error: any) {
    console.log('Error in getDoctorSchedules:', error);
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

// PUT /doctors/:id/schedules - Cập nhật trạng thái booking của slot
export const updateDoctorSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, slotId, isBooked } = req.body;

    if (!date || !slotId || isBooked === undefined) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp đầy đủ: date, slotId, isBooked' 
      });
    }

    const updatedSchedule = await doctorService.updateDoctorSchedule(id, { date, slotId, isBooked });

    return res.status(200).json({ 
      message: `${isBooked ? 'Đặt lịch' : 'Hủy lịch'} thành công`,
      data: updatedSchedule 
    });
  } catch (error: any) {
    console.log('Error in updateDoctorSchedule:', error);
    return res.status(400).json({ 
      message: error.message || 'Đã xảy ra lỗi khi cập nhật lịch làm việc' 
    });
  }
};

// DELETE /doctors/:id/schedules/:scheduleId - Xóa lịch của một ngày cụ thể
export const deleteDoctorSchedule = async (req: Request, res: Response) => {
  try {
    const { id, scheduleId } = req.params;

    const result = await doctorService.deleteDoctorSchedule(id, scheduleId);
    
    if (!result) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc để xóa' });
    }

    return res.status(200).json({ 
      message: 'Xóa lịch làm việc thành công',
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

    const availableSlots = await doctorService.getAvailableSlots(id, date as string);
    
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
      timeSlot as string | undefined
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