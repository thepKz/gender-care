import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import MedicalRecordSyncService from '../services/medicalRecordSyncService';

/**
 * Controller cho Medical Record Sync Service
 */
export class MedicalRecordSyncController {

  /**
   * POST /api/medical-records/sync/:appointmentId
   * Đồng bộ một appointment cụ thể thành medical record
   */
  static async syncSingleAppointment(req: AuthRequest, res: Response) {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: 'Appointment ID is required'
        });
      }

      console.log(`🔄 [MedicalRecordSyncController] Syncing appointment: ${appointmentId}`);

      const medicalRecord = await MedicalRecordSyncService.syncAppointmentToMedicalRecord(appointmentId);

      if (!medicalRecord) {
        return res.status(400).json({
          success: false,
          message: 'Appointment không đủ điều kiện để tạo medical record hoặc đã tồn tại'
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Đồng bộ medical record thành công',
        data: medicalRecord
      });

    } catch (error: any) {
      console.error(`❌ [MedicalRecordSyncController] Error syncing appointment:`, error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server khi đồng bộ medical record'
      });
    }
  }

  /**
   * POST /api/medical-records/sync/bulk
   * Đồng bộ tất cả appointments "Hoàn thành kết quả" thành medical records
   */
  static async syncAllCompletedAppointments(req: AuthRequest, res: Response) {
    try {
      console.log(`🔄 [MedicalRecordSyncController] Starting bulk sync`);

      const results = await MedicalRecordSyncService.syncAllCompletedAppointments();

      const summary = {
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        errors: results.filter(r => r.status === 'error').length,
        details: results
      };

      return res.status(200).json({
        success: true,
        message: `Đồng bộ hoàn tất. Thành công: ${summary.success}/${summary.total}`,
        data: summary
      });

    } catch (error: any) {
      console.error(`❌ [MedicalRecordSyncController] Error in bulk sync:`, error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server khi đồng bộ bulk medical records'
      });
    }
  }

  /**
   * GET /api/medical-records/sync/status/:appointmentId
   * Kiểm tra trạng thái sync của một appointment
   */
  static async checkSyncStatus(req: AuthRequest, res: Response) {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: 'Appointment ID is required'
        });
      }

      // Kiểm tra appointment tồn tại
      const mongoose = require('mongoose');
      const Appointment = mongoose.model('Appointments');
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy appointment'
        });
      }

      // Kiểm tra medical record đã tồn tại
      const MedicalRecords = mongoose.model('MedicalRecords');
      const medicalRecord = await MedicalRecords.findOne({ appointmentId });

      const status = {
        appointmentId,
        appointmentStatus: appointment.status,
        hasMedicalRecord: !!medicalRecord,
        medicalRecordId: medicalRecord?._id || null,
        canSync: ['done_testResult', 'done_testResultItem', 'completed'].includes(appointment.status),
        syncRequired: ['done_testResult', 'done_testResultItem', 'completed'].includes(appointment.status) && !medicalRecord
      };

      return res.status(200).json({
        success: true,
        message: 'Trạng thái sync appointment',
        data: status
      });

    } catch (error: any) {
      console.error(`❌ [MedicalRecordSyncController] Error checking sync status:`, error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server khi kiểm tra trạng thái sync'
      });
    }
  }

  /**
   * GET /api/medical-records/sync/pending
   * Lấy danh sách appointments cần sync (chưa có medical record)
   */
  static async getPendingSyncAppointments(req: AuthRequest, res: Response) {
    try {
      const mongoose = require('mongoose');
      const Appointment = mongoose.model('Appointments');
      const MedicalRecords = mongoose.model('MedicalRecords');

      // Lấy tất cả appointments hoàn thành
      const completedAppointments = await Appointment.find({
        status: { $in: ['done_testResult', 'done_testResultItem', 'completed'] }
      }).populate('profileId', 'fullName').populate('doctorId', 'userId');

      // Lấy danh sách appointmentIds đã có medical record
      const existingMedicalRecords = await MedicalRecords.find({
        appointmentId: { $in: completedAppointments.map((a: any) => a._id) }
      }).select('appointmentId');

      const existingAppointmentIds = new Set(
        existingMedicalRecords.map((mr: any) => mr.appointmentId.toString())
      );

      // Filter appointments chưa có medical record
      const pendingAppointments = completedAppointments.filter(
        (appointment: any) => !existingAppointmentIds.has(appointment._id.toString())
      );

      return res.status(200).json({
        success: true,
        message: `Tìm thấy ${pendingAppointments.length} appointments cần sync`,
        data: {
          total: pendingAppointments.length,
          appointments: pendingAppointments.map((apt: any) => ({
            _id: apt._id,
            appointmentDate: apt.appointmentDate,
            appointmentTime: apt.appointmentTime,
            status: apt.status,
            profileName: apt.profileId?.fullName,
            doctorName: apt.doctorId?.userId?.fullName
          }))
        }
      });

    } catch (error: any) {
      console.error(`❌ [MedicalRecordSyncController] Error getting pending appointments:`, error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server khi lấy danh sách appointments cần sync'
      });
    }
  }
}

export default MedicalRecordSyncController;
