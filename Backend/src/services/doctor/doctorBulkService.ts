import DoctorSchedules from '../../models/DoctorSchedules';
import Doctor from '../../models/Doctor';
import User from '../../models/User';
import { getDayInfo, isWeekend } from './doctorValidationService';

/**
 * Doctor Bulk Service - Handles bulk operations for doctors
 * Extracted from doctorService.ts for better modularity
 */

// 8 slots cố định cho fulltime doctor
const FIXED_TIME_SLOTS = [
  "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00",
  "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
];

// POST /doctors/:id/schedules/bulk - Tạo lịch hàng loạt cho bác sĩ theo nhiều ngày
export const createBulkDoctorSchedules = async (doctorId: string, bulkData: { dates: string[] }) => {
  try {
    // Kiểm tra doctor có tồn tại không
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error('Không tìm thấy bác sĩ');
    }

    const { dates } = bulkData;
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      throw new Error('Vui lòng cung cấp danh sách ngày làm việc (dates array)');
    }

    // Tìm schedule hiện tại của doctor
    let doctorSchedule = await DoctorSchedules.findOne({ doctorId });

    const results = {
      success: [] as string[],
      failed: [] as { date: string; reason: string }[],
      weekend: [] as string[],
      existing: [] as string[]
    };

    for (const date of dates) {
      try {
        const dayInfo = getDayInfo(date);
        
        // Log timezone debug info cho từng ngày
        console.log(`[BULK] Processing date: ${date}`);
        console.log(`[BULK] Is Weekend? ${dayInfo.isWeekend} (dayOfWeek: ${dayInfo.dayOfWeek})`);
        
        if (dayInfo.isWeekend) {
          const dayType = dayInfo.dayOfWeek === 0 ? 'Chủ nhật' : 'Thứ 7';
          results.weekend.push(`${date} (${dayType})`);
          continue;
        }

        // Kiểm tra xem ngày này đã có lịch chưa
        if (doctorSchedule) {
          const existingDay = doctorSchedule.weekSchedule.find(ws => {
            const scheduleDate = new Date(ws.dayOfWeek);
            return scheduleDate.toDateString() === dayInfo.date.toDateString();
          });

          if (existingDay) {
            results.existing.push(date);
            continue;
          }
        }

        // Tạo 8 slots cố định với status: "Free"
        const newDaySchedule = {
          dayOfWeek: dayInfo.date,
          slots: FIXED_TIME_SLOTS.map(timeSlot => ({
            slotTime: timeSlot,
            status: "Free"
          }))
        };

        if (!doctorSchedule) {
          // Tạo mới schedule cho doctor
          doctorSchedule = await DoctorSchedules.create({
            doctorId,
            weekSchedule: [newDaySchedule]
          });
        } else {
          // Thêm ngày mới vào weekSchedule
          doctorSchedule.weekSchedule.push(newDaySchedule as any);
          await doctorSchedule.save();
        }

        results.success.push(date);
        console.log(`[BULK SUCCESS] Created schedule for ${dayInfo.dayName} (${date})`);

      } catch (error: any) {
        results.failed.push({
          date,
          reason: error.message
        });
        console.error(`[BULK ERROR] Failed to create schedule for ${date}:`, error.message);
      }
    }

    // Populate doctor info để trả về
    const updatedSchedule = await DoctorSchedules.findById(doctorSchedule?._id)
      .populate('doctorId', 'userId bio specialization');

    return {
      message: 'Bulk tạo lịch hoàn tất',
      results,
      summary: {
        total: dates.length,
        success: results.success.length,
        failed: results.failed.length,
        weekend: results.weekend.length,
        existing: results.existing.length
      },
      schedule: updatedSchedule
    };

  } catch (error: any) {
    throw new Error(error.message || 'Không thể tạo lịch hàng loạt');
  }
};

// PUT /doctors/:id/schedules/bulk-absent - Đánh dấu bác sĩ nghỉ hàng loạt theo nhiều ngày
export const setBulkDoctorAbsent = async (doctorId: string, bulkData: { dates: string[] }) => {
  try {
    const { dates } = bulkData;
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      throw new Error('Vui lòng cung cấp danh sách ngày nghỉ (dates array)');
    }

    const doctorSchedule = await DoctorSchedules.findOne({ doctorId });
    if (!doctorSchedule) {
      throw new Error('Không tìm thấy lịch làm việc của bác sĩ');
    }

    const results = {
      success: [] as string[],
      failed: [] as { date: string; reason: string }[]
    };

    for (const date of dates) {
      try {
        const workDate = new Date(date);
        
        // Tìm ngày cần update
        const daySchedule = doctorSchedule.weekSchedule.find(ws => {
          const scheduleDate = new Date(ws.dayOfWeek);
          return scheduleDate.toDateString() === workDate.toDateString();
        });

        if (!daySchedule) {
          results.failed.push({
            date,
            reason: 'Không tìm thấy lịch làm việc trong ngày này'
          });
          continue;
        }

        // Set tất cả slots trong ngày thành "Absent"
        daySchedule.slots.forEach((slot: any) => {
          slot.status = "Absent";
        });

        results.success.push(date);

      } catch (error: any) {
        results.failed.push({
          date,
          reason: error.message
        });
      }
    }

    // Lưu tất cả thay đổi
    await doctorSchedule.save();

    return {
      message: 'Bulk đánh dấu nghỉ hoàn tất',
      results,
      summary: {
        total: dates.length,
        success: results.success.length,
        failed: results.failed.length
      }
    };

  } catch (error: any) {
    throw new Error(error.message || 'Không thể đánh dấu nghỉ hàng loạt');
  }
};

// DELETE /doctors/bulk - Xóa hàng loạt bác sĩ (soft delete)
export const deleteBulkDoctors = async (doctorIds: string[], adminId: string, force: boolean = false) => {
  try {
    if (!doctorIds || !Array.isArray(doctorIds) || doctorIds.length === 0) {
      throw new Error('Vui lòng cung cấp danh sách ID bác sĩ');
    }

    const results = {
      success: [] as any[],
      failed: [] as { doctorId: string; reason: string }[]
    };

    for (const doctorId of doctorIds) {
      try {
        // Kiểm tra doctor có tồn tại và chưa bị xóa
        const doctor = await Doctor.findOne({ _id: doctorId, isDeleted: { $ne: true } }).populate('userId');
        if (!doctor) {
          results.failed.push({
            doctorId,
            reason: 'Không tìm thấy bác sĩ hoặc bác sĩ đã bị xóa'
          });
          continue;
        }

        // Business logic checks (chỉ khi không force)
        if (!force) {
          // TODO: Implement appointment and Q&A validation when models are ready
        }

        // Soft delete doctor record
        const deletedDoctor = await Doctor.findByIdAndUpdate(
          doctorId,
          {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: adminId
          },
          { new: true }
        ).populate('userId', 'fullName avatar gender address');

        // Vô hiệu hóa user account liên quan
        await User.findByIdAndUpdate(doctor.userId._id, { 
          isActive: false 
        });

        results.success.push({
          doctorId,
          doctorName: (doctor.userId as any).fullName,
          deletedDoctor
        });

        // Log audit trail
        console.log(`Bulk doctor deleted by admin:`, {
          doctorId,
          doctorName: (doctor.userId as any).fullName,
          adminId,
          force,
          timestamp: new Date()
        });

      } catch (error: any) {
        results.failed.push({
          doctorId,
          reason: error.message
        });
      }
    }

    return {
      message: force ? 'Bulk force xóa bác sĩ hoàn tất' : 'Bulk vô hiệu hóa bác sĩ hoàn tất',
      results,
      summary: {
        total: doctorIds.length,
        success: results.success.length,
        failed: results.failed.length
      }
    };

  } catch (error: any) {
    throw new Error(error.message || 'Không thể xóa hàng loạt bác sĩ');
  }
}; 