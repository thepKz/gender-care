import { Request, Response } from 'express';
import { DoctorQA } from '../models';
import { DoctorSchedules } from '../models';
import mongoose from 'mongoose';

// Interface cho check available doctors response
interface AvailableDoctorInfo {
  doctorId: string;
  doctorName: string;
  availability: 'free' | 'busy';
}

interface CheckAvailabilityResponse {
  available: boolean;
  consultationId: string;
  currentSlot: {
    date: string;
    time: string;
    slotId: string;
  };
  availableDoctors: AvailableDoctorInfo[];
}

/**
 * GET /api/consultations/:id/check-available-doctors
 * Kiểm tra các bác sĩ available trong cùng slot với consultation hiện tại
 */
export const checkAvailableDoctors = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Lấy thông tin consultation hiện tại
    const consultation = await DoctorQA.findById(id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation không tồn tại'
      });
    }

    // ✅ Type guards cho required fields
    if (!consultation.doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Consultation chưa có doctor được assign'
      });
    }

    if (!consultation.appointmentDate || !consultation.appointmentSlot) {
      return res.status(400).json({
        success: false,
        message: 'Consultation chưa có thông tin lịch hẹn'
      });
    }

    console.log('🔍 [DEBUG] Checking availability for consultation:', {
      consultationId: id,
      currentDoctor: consultation.doctorId,
      date: consultation.appointmentDate,
      slot: consultation.appointmentSlot
    });

    // 2. Tìm tất cả doctors có schedule trong cùng ngày/slot
    const targetDate = consultation.appointmentDate;
    const targetSlot = consultation.appointmentSlot;

    // ✅ Convert Date to string format để so sánh
    const targetDateString = targetDate instanceof Date 
      ? targetDate.toISOString().split('T')[0] 
      : new Date(targetDate).toISOString().split('T')[0];

    // Query tất cả doctors có schedule trong ngày này
    const doctorSchedules = await DoctorSchedules.find({
      'weekSchedule.dayOfWeek': {
        $gte: new Date(targetDateString + 'T00:00:00.000Z'),
        $lt: new Date(targetDateString + 'T23:59:59.999Z')
      }
    }).populate('doctorId', 'name');

    const availableDoctors: AvailableDoctorInfo[] = [];

    // 3. Kiểm tra từng doctor xem có free trong slot này không
    for (const schedule of doctorSchedules) {
      // ✅ Type guard và cast để access name
      if (!schedule.doctorId || typeof schedule.doctorId === 'string') {
        continue;
      }
      
      const doctorDoc = schedule.doctorId as any; // Cast to populated doc
      const doctorId = doctorDoc._id.toString();
      
      // Bỏ qua doctor hiện tại
      if (doctorId === consultation.doctorId.toString()) {
        continue;
      }

      // Tìm slot cụ thể trong schedule
      const daySchedule = schedule.weekSchedule.find(day => {
        const dayOfWeek = day.dayOfWeek instanceof Date 
          ? day.dayOfWeek.toISOString().split('T')[0]
          : new Date(day.dayOfWeek).toISOString().split('T')[0];
        return dayOfWeek === targetDateString;
      });
      
      if (!daySchedule) continue;

      const slotInfo = daySchedule.slots.find(slot => slot.slotTime === targetSlot);
      if (!slotInfo) continue;

      // Kiểm tra status của slot
      const availability = slotInfo.status === 'Free' ? 'free' : 'busy';
      
      availableDoctors.push({
        doctorId: doctorId,
        doctorName: doctorDoc.name || 'Unknown Doctor',
        availability: availability
      });

      console.log('🧑‍⚕️ [DEBUG] Doctor availability check:', {
        doctorId,
        doctorName: doctorDoc.name,
        slot: targetSlot,
        status: slotInfo.status,
        availability
      });
    }

    // 4. Tính toán kết quả
    const freeDoctors = availableDoctors.filter(d => d.availability === 'free');
    const hasAvailableDoctors = freeDoctors.length > 0;

    const response: CheckAvailabilityResponse = {
      available: hasAvailableDoctors,
      consultationId: id,
      currentSlot: {
        date: targetDateString,
        time: consultation.appointmentSlot,
        slotId: consultation.slotId?.toString() || 'unknown'
      },
      availableDoctors: availableDoctors
    };

    console.log('✅ [DEBUG] Availability check result:', {
      available: hasAvailableDoctors,
      totalDoctors: availableDoctors.length,
      freeDoctors: freeDoctors.length
    });

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ [ERROR] Check available doctors failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra availability',
      error: errorMessage
    });
  }
};

/**
 * POST /api/consultations/:id/transfer
 * Transfer consultation sang bác sĩ khác trong cùng slot
 */
export const transferConsultation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newDoctorId, transferReason } = req.body;

    // Validation
    if (!transferReason) {
      return res.status(400).json({
        success: false,
        message: 'transferReason là bắt buộc'
      });
    }

    // 1. Lấy consultation hiện tại
    const consultation = await DoctorQA.findById(id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation không tồn tại'
      });
    }

    // ✅ Type guards
    if (!consultation.doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Consultation chưa có doctor được assign'
      });
    }

    if (!consultation.appointmentDate || !consultation.appointmentSlot) {
      return res.status(400).json({
        success: false,
        message: 'Consultation chưa có thông tin lịch hẹn'
      });
    }

    const oldDoctorId = consultation.doctorId;
    const targetDate = consultation.appointmentDate;
    const targetSlot = consultation.appointmentSlot;
    const targetDateString = targetDate instanceof Date 
      ? targetDate.toISOString().split('T')[0] 
      : new Date(targetDate).toISOString().split('T')[0];

    console.log('🔄 [DEBUG] Transferring consultation:', {
      consultationId: id,
      from: oldDoctorId,
      to: newDoctorId,
      reason: transferReason
    });

    // 2. Auto-select available doctor nếu newDoctorId = 'auto'
    let selectedDoctorId = newDoctorId;
    
    if (newDoctorId === 'auto' || !newDoctorId) {
      // Tìm doctor available trong cùng slot
      const doctorSchedules = await DoctorSchedules.find({
        'weekSchedule.dayOfWeek': {
          $gte: new Date(targetDateString + 'T00:00:00.000Z'),
          $lt: new Date(targetDateString + 'T23:59:59.999Z')
        }
      }).populate('doctorId', 'name');

      let availableDoctor = null;
      
      for (const schedule of doctorSchedules) {
        if (!schedule.doctorId || typeof schedule.doctorId === 'string') {
          continue;
        }
        
        const doctorDoc = schedule.doctorId as any;
        const doctorId = doctorDoc._id.toString();
        
        // Bỏ qua doctor hiện tại
        if (doctorId === consultation.doctorId.toString()) {
          continue;
        }

        // Kiểm tra slot availability
        const daySchedule = schedule.weekSchedule.find(day => {
          const dayOfWeek = day.dayOfWeek instanceof Date 
            ? day.dayOfWeek.toISOString().split('T')[0]
            : new Date(day.dayOfWeek).toISOString().split('T')[0];
          return dayOfWeek === targetDateString;
        });
        if (!daySchedule) continue;

        const slotInfo = daySchedule.slots.find(slot => slot.slotTime === targetSlot);
        if (slotInfo && slotInfo.status === 'Free') {
          availableDoctor = {
            doctorId: doctorId,
            doctorName: doctorDoc.name,
            slotId: slotInfo._id
          };
          break; // Chọn doctor đầu tiên available
        }
      }

      if (!availableDoctor) {
        return res.status(400).json({
          success: false,
          message: 'Không có bác sĩ nào available trong slot này để thuyên chuyển'
        });
      }

      selectedDoctorId = availableDoctor.doctorId;
      console.log('🎯 [DEBUG] Auto-selected doctor:', availableDoctor);
    } else {
      // Validate specific doctor availability
      const newDoctorSchedule = await DoctorSchedules.findOne({
        doctorId: new mongoose.Types.ObjectId(newDoctorId),
        'weekSchedule.dayOfWeek': {
          $gte: new Date(targetDateString + 'T00:00:00.000Z'),
          $lt: new Date(targetDateString + 'T23:59:59.999Z')
        }
      });

      if (!newDoctorSchedule) {
        return res.status(400).json({
          success: false,
          message: 'Bác sĩ được chỉ định không có lịch làm việc trong ngày này'
        });
      }

      const daySchedule = newDoctorSchedule.weekSchedule.find(day => {
        const dayOfWeek = day.dayOfWeek instanceof Date 
          ? day.dayOfWeek.toISOString().split('T')[0]
          : new Date(day.dayOfWeek).toISOString().split('T')[0];
        return dayOfWeek === targetDateString;
      });
      const slotInfo = daySchedule?.slots.find(slot => slot.slotTime === targetSlot);

      if (!slotInfo || slotInfo.status !== 'Free') {
        return res.status(400).json({
          success: false,
          message: 'Bác sĩ được chỉ định không available trong slot này'
        });
      }
    }

    // 3. Update consultation với doctor được chọn
    const updatedConsultation = await DoctorQA.findByIdAndUpdate(
      id,
      {
        doctorId: new mongoose.Types.ObjectId(selectedDoctorId),
        transferredAt: new Date(),
        transferReason: transferReason,
        transferredFrom: oldDoctorId
      },
      { new: true }
    );

    // 4. Update slot statuses
    // Set old doctor slot to Free
    await DoctorSchedules.updateOne(
      { 
        doctorId: oldDoctorId,
        'weekSchedule.dayOfWeek': {
          $gte: new Date(targetDateString + 'T00:00:00.000Z'),
          $lt: new Date(targetDateString + 'T23:59:59.999Z')
        },
        'weekSchedule.slots.slotTime': targetSlot
      },
      {
        $set: {
          'weekSchedule.$.slots.$[slot].status': 'Free',
          'weekSchedule.$.slots.$[slot].lastUpdated': new Date()
        }
      },
      {
        arrayFilters: [{ 'slot.slotTime': targetSlot }]
      }
    );

    // Set new doctor slot to Booked
    await DoctorSchedules.updateOne(
      { 
        doctorId: new mongoose.Types.ObjectId(selectedDoctorId),
        'weekSchedule.dayOfWeek': {
          $gte: new Date(targetDateString + 'T00:00:00.000Z'),
          $lt: new Date(targetDateString + 'T23:59:59.999Z')
        },
        'weekSchedule.slots.slotTime': targetSlot
      },
      {
        $set: {
          'weekSchedule.$.slots.$[slot].status': 'Booked',
          'weekSchedule.$.slots.$[slot].bookedAt': new Date(),
          'weekSchedule.$.slots.$[slot].lastUpdated': new Date()
        }
      },
      {
        arrayFilters: [{ 'slot.slotTime': targetSlot }]
      }
    );

    console.log('✅ [SUCCESS] Consultation transferred successfully:', {
      consultationId: id,
      oldDoctorId: oldDoctorId.toString(),
      newDoctorId: selectedDoctorId,
      transferredAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Thuyên chuyển consultation thành công',
      data: {
        consultationId: id,
        oldDoctorId: oldDoctorId.toString(),
        newDoctorId: selectedDoctorId,
        transferredAt: new Date().toISOString(),
        transferReason: transferReason
      }
    });

  } catch (error) {
    console.error('❌ [ERROR] Transfer consultation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi transfer consultation',
      error: errorMessage
    });
  }
}; 