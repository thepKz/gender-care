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

      // ✅ STRICT: Chỉ add doctors có slot status = 'Free'
      const slotInfo = daySchedule.slots.find(slot => 
        slot.slotTime === targetSlot && slot.status === 'Free'
      );
      
      if (slotInfo) {
        availableDoctors.push({
          doctorId: doctorId,
          doctorName: doctorDoc.name || 'Unknown Doctor',
          availability: 'free' // Chỉ add những doctor Free
        });

        console.log('🧑‍⚕️ [DEBUG] Found available doctor:', {
          doctorId,
          doctorName: doctorDoc.name,
          slot: targetSlot,
          status: slotInfo.status,
          slotId: slotInfo._id?.toString()
        });
      }
    }

    // 4. Tính toán kết quả
    const hasAvailableDoctors = availableDoctors.length > 0;

    const response = {
      available: hasAvailableDoctors,
      consultationId: id,
      currentSlot: {
        date: targetDateString,
        time: consultation.appointmentSlot,
        slotId: consultation.slotId?.toString() || 'unknown'
      },
      availableDoctors: availableDoctors,
      totalAvailable: availableDoctors.length,
      message: hasAvailableDoctors 
        ? `Có ${availableDoctors.length} bác sĩ khả dụng trong slot này`
        : 'Không có bác sĩ nào khả dụng trong slot này. Doctor hiện tại bắt buộc phải thực hiện consultation.'
    };

    console.log('✅ [DEBUG] Availability check result:', {
      available: hasAvailableDoctors,
      totalDoctors: availableDoctors.length,
      freeDoctors: availableDoctors.length // All are free now
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
  // ✅ FIX: Add MongoDB transaction support for atomicity
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { id } = req.params;
      const { newDoctorId, transferReason } = req.body;

      // Validation
      if (!transferReason) {
        throw new Error('transferReason là bắt buộc');
      }

      // 1. Lấy consultation hiện tại trong transaction
      const consultation = await DoctorQA.findById(id).session(session);
      if (!consultation) {
        throw new Error('Consultation không tồn tại');
      }

      // ✅ Type guards
      if (!consultation.doctorId) {
        throw new Error('Consultation chưa có doctor được assign');
      }

      if (!consultation.appointmentDate || !consultation.appointmentSlot) {
        throw new Error('Consultation chưa có thông tin lịch hẹn');
      }

      const oldDoctorId = consultation.doctorId;
      const oldSlotId = consultation.slotId; // ✅ FIX: Get old slotId
      const targetDate = consultation.appointmentDate;
      const targetSlot = consultation.appointmentSlot;
      const targetDateString = targetDate instanceof Date 
        ? targetDate.toISOString().split('T')[0] 
        : new Date(targetDate).toISOString().split('T')[0];

      console.log('🔄 [DEBUG] Transferring consultation:', {
        consultationId: id,
        from: oldDoctorId,
        to: newDoctorId,
        oldSlotId: oldSlotId?.toString(),
        reason: transferReason
      });

      // 2. ✅ ENHANCED: Find available doctor with strict slot filtering
      let selectedDoctor = null;
      let newSlotId = null;
      
      if (newDoctorId === 'auto' || !newDoctorId) {
        // Auto-select: Find doctor available trong cùng slot
        const doctorSchedules = await DoctorSchedules.find({
          'weekSchedule.dayOfWeek': {
            $gte: new Date(targetDateString + 'T00:00:00.000Z'),
            $lt: new Date(targetDateString + 'T23:59:59.999Z')
          }
        }).populate('doctorId', 'name').session(session);
        
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

          // ✅ STRICT: Chỉ check slot có status = 'Free'
          const daySchedule = schedule.weekSchedule.find(day => {
            const dayOfWeek = day.dayOfWeek instanceof Date 
              ? day.dayOfWeek.toISOString().split('T')[0]
              : new Date(day.dayOfWeek).toISOString().split('T')[0];
            return dayOfWeek === targetDateString;
          });
          if (!daySchedule) continue;

          const slotInfo = daySchedule.slots.find(slot => 
            slot.slotTime === targetSlot && slot.status === 'Free' // ✅ STRICT: Chỉ Free
          );
          
          if (slotInfo) {
            selectedDoctor = {
              doctorId: doctorId,
              doctorName: doctorDoc.name,
              slotId: slotInfo._id
            };
            newSlotId = slotInfo._id;
            break; // First available
          }
        }

        if (!selectedDoctor || !newSlotId) {
          throw new Error('Không có bác sĩ nào available với slot FREE trong thời gian này để thuyên chuyển');
        }

        console.log('🎯 [DEBUG] Auto-selected doctor:', selectedDoctor);
      } else {
        // Validate specific doctor availability với strict filtering
        const newDoctorSchedule = await DoctorSchedules.findOne({
          doctorId: new mongoose.Types.ObjectId(newDoctorId),
          'weekSchedule.dayOfWeek': {
            $gte: new Date(targetDateString + 'T00:00:00.000Z'),
            $lt: new Date(targetDateString + 'T23:59:59.999Z')
          }
        }).session(session);

        if (!newDoctorSchedule) {
          throw new Error('Bác sĩ được chỉ định không có lịch làm việc trong ngày này');
        }

        const daySchedule = newDoctorSchedule.weekSchedule.find(day => {
          const dayOfWeek = day.dayOfWeek instanceof Date 
            ? day.dayOfWeek.toISOString().split('T')[0]
            : new Date(day.dayOfWeek).toISOString().split('T')[0];
          return dayOfWeek === targetDateString;
        });
        
        const slotInfo = daySchedule?.slots.find(slot => 
          slot.slotTime === targetSlot && slot.status === 'Free' // ✅ STRICT: Chỉ Free
        );

        if (!slotInfo) {
          throw new Error('Bác sĩ được chỉ định không có slot FREE trong thời gian này');
        }

        selectedDoctor = {
          doctorId: newDoctorId,
          doctorName: 'Specified Doctor',
          slotId: slotInfo._id
        };
        newSlotId = slotInfo._id;
      }

      // 3. ✅ ATOMIC: Update all components trong transaction
      
      // 3a. Update DoctorQA với đầy đủ thông tin
      await DoctorQA.findByIdAndUpdate(
        id,
        {
          doctorId: new mongoose.Types.ObjectId(selectedDoctor.doctorId),
          slotId: newSlotId, // ✅ FIX: Update slotId mới
          transferredAt: new Date(),
          transferReason: transferReason,
          transferredFrom: oldDoctorId
        },
        { session }
      );

      // 3b. Set old doctor slot to Free (nếu có oldSlotId)
      if (oldSlotId) {
        await DoctorSchedules.updateOne(
          { 
            doctorId: oldDoctorId,
            'weekSchedule.dayOfWeek': {
              $gte: new Date(targetDateString + 'T00:00:00.000Z'),
              $lt: new Date(targetDateString + 'T23:59:59.999Z')
            },
            'weekSchedule.slots._id': oldSlotId // ✅ Use specific slotId
          },
          {
            $set: {
              'weekSchedule.$.slots.$[slot].status': 'Free',
              'weekSchedule.$.slots.$[slot].lastUpdated': new Date()
            }
          },
          {
            arrayFilters: [{ 'slot._id': oldSlotId }],
            session
          }
        );
      }

             // 3c. Set new doctor slot to Booked
       if (newSlotId) {
         await DoctorSchedules.updateOne(
           { 
             doctorId: new mongoose.Types.ObjectId(selectedDoctor.doctorId),
             'weekSchedule.dayOfWeek': {
               $gte: new Date(targetDateString + 'T00:00:00.000Z'),
               $lt: new Date(targetDateString + 'T23:59:59.999Z')
             },
             'weekSchedule.slots._id': newSlotId
           },
           {
             $set: {
               'weekSchedule.$.slots.$[slot].status': 'Booked',
               'weekSchedule.$.slots.$[slot].bookedAt': new Date(),
               'weekSchedule.$.slots.$[slot].lastUpdated': new Date()
             }
           },
           {
             arrayFilters: [{ 'slot._id': newSlotId }],
             session
           }
         );
       }

       console.log('✅ [SUCCESS] Consultation transferred successfully:', {
         consultationId: id,
         oldDoctorId: oldDoctorId.toString(),
         newDoctorId: selectedDoctor.doctorId,
         oldSlotId: oldSlotId?.toString(),
         newSlotId: newSlotId?.toString(),
         transferredAt: new Date().toISOString()
       });

       // Return success data from transaction
       return {
         consultationId: id,
         oldDoctorId: oldDoctorId.toString(),
         newDoctorId: selectedDoctor.doctorId,
         oldSlotId: oldSlotId?.toString(),
         newSlotId: newSlotId?.toString(),
         transferredAt: new Date().toISOString(),
         transferReason: transferReason
       };
     });

     // ✅ Transaction completed successfully
     res.json({
       success: true,
       message: 'Thuyên chuyển consultation thành công',
       data: {
         success: true,
         message: 'Transfer completed successfully'
       }
     });

  } catch (error) {
    console.error('❌ [ERROR] Transfer consultation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  } finally {
    await session.endSession();
  }
}; 