import mongoose from 'mongoose';
import MedicalRecords from '../models/MedicalRecords';
import TestResults from '../models/TestResults';
import TestResultItems from '../models/TestResultItems';

/**
 * Medical Record Sync Service
 * Tự động tạo medical record từ appointment "Hoàn thành kết quả"
 */
export class MedicalRecordSyncService {
  
  /**
   * Tự động tạo medical record từ appointment có kết quả xét nghiệm
   * @param appointmentId - ID của appointment
   */
  static async syncAppointmentToMedicalRecord(appointmentId: string) {
    try {
      console.log(`🔄 [MedicalRecordSync] Starting sync for appointment: ${appointmentId}`);
      
      // 1. Lấy thông tin appointment
      const Appointment = mongoose.model('Appointments');
      const appointment = await Appointment.findById(appointmentId)
        .populate('profileId', 'fullName gender phone')
        .populate('doctorId', 'userId')
        .populate({
          path: 'doctorId',
          populate: {
            path: 'userId',
            select: 'fullName email'
          }
        });

      if (!appointment) {
        throw new Error(`Không tìm thấy appointment với ID: ${appointmentId}`);
      }

      console.log(`✅ [MedicalRecordSync] Found appointment:`, {
        id: appointment._id,
        status: appointment.status,
        profileId: appointment.profileId?._id,
        doctorId: appointment.doctorId?._id
      });

      // 2. Kiểm tra appointment có trạng thái "done_testResult" hoặc tương tự
      const validStatuses = ['done_testResult', 'done_testResultItem', 'completed'];
      if (!validStatuses.includes(appointment.status)) {
        console.log(`⚠️ [MedicalRecordSync] Appointment status not valid for sync: ${appointment.status}`);
        return null;
      }

      // 3. Kiểm tra đã có medical record chưa
      const existingRecord = await MedicalRecords.findOne({ appointmentId });
      if (existingRecord) {
        console.log(`ℹ️ [MedicalRecordSync] Medical record already exists: ${existingRecord._id}`);
        return existingRecord;
      }

      // 4. Lấy kết quả xét nghiệm (nếu có)
      const testResults = await TestResults.findOne({ appointmentId });
      const testResultItems = await TestResultItems.findOne({ appointmentId });

      console.log(`🔍 [MedicalRecordSync] Test results found:`, {
        testResults: !!testResults,
        testResultItems: !!testResultItems
      });

      // 5. Tạo medical record với thông tin từ appointment và test results
      const medicalRecordData = {
        doctorId: appointment.doctorId?._id,
        profileId: appointment.profileId?._id,
        appointmentId: appointment._id,
        conclusion: this.generateConclusionFromTestResults(testResults, testResultItems),
        symptoms: appointment.description || 'Không có triệu chứng cụ thể',
        treatment: this.generateTreatmentFromTestResults(testResults, testResultItems),
        notes: `Tự động tạo từ appointment ${appointmentId} - ${new Date().toISOString()}`,
        status: 'completed'
      };

      const medicalRecord = new MedicalRecords(medicalRecordData);
      await medicalRecord.save();

      // 6. Populate thông tin để trả về
      await medicalRecord.populate([
        { path: 'doctorId', select: 'userId', populate: { path: 'userId', select: 'fullName email' } },
        { path: 'profileId', select: 'fullName gender phone' },
        { path: 'appointmentId', select: 'appointmentDate appointmentTime status' }
      ]);

      console.log(`✅ [MedicalRecordSync] Created medical record: ${medicalRecord._id}`);
      
      return medicalRecord;

    } catch (error) {
      console.error(`❌ [MedicalRecordSync] Error syncing appointment ${appointmentId}:`, error);
      throw error;
    }
  }

  /**
   * Tạo kết luận từ kết quả xét nghiệm
   */
  private static generateConclusionFromTestResults(testResults: any, testResultItems: any): string {
    if (testResults?.diagnosis) {
      return testResults.diagnosis;
    }
    
    if (testResultItems?.items?.length > 0) {
      const abnormalResults = testResultItems.items.filter((item: any) => 
        item.flag && item.flag !== 'normal'
      );
      
      if (abnormalResults.length > 0) {
        return `Phát hiện ${abnormalResults.length} chỉ số bất thường cần theo dõi`;
      } else {
        return 'Các chỉ số xét nghiệm trong giới hạn bình thường';
      }
    }
    
    return 'Đã hoàn thành khám và có kết quả';
  }

  /**
   * Tạo phương pháp điều trị từ kết quả xét nghiệm
   */
  private static generateTreatmentFromTestResults(testResults: any, testResultItems: any): string {
    if (testResults?.recommendations) {
      return testResults.recommendations;
    }
    
    if (testResultItems?.items?.length > 0) {
      const abnormalResults = testResultItems.items.filter((item: any) => 
        item.flag && item.flag !== 'normal'
      );
      
      if (abnormalResults.length > 0) {
        return 'Cần tái khám để theo dõi các chỉ số bất thường. Tuân thủ chế độ ăn uống và sinh hoạt lành mạnh.';
      } else {
        return 'Duy trì lối sống lành mạnh. Tái khám định kỳ theo lịch.';
      }
    }
    
    return 'Theo dõi sức khỏe định kỳ';
  }

  /**
   * Đồng bộ tất cả appointments có trạng thái "Hoàn thành kết quả" chưa có medical record
   */
  static async syncAllCompletedAppointments() {
    try {
      console.log(`🔄 [MedicalRecordSync] Starting bulk sync for all completed appointments`);
      
      const Appointment = mongoose.model('Appointments');
      const completedAppointments = await Appointment.find({
        status: { $in: ['done_testResult', 'done_testResultItem', 'completed'] }
      });

      console.log(`📊 [MedicalRecordSync] Found ${completedAppointments.length} completed appointments`);

      const results = [];
      for (const appointment of completedAppointments) {
        try {
          const medicalRecord = await this.syncAppointmentToMedicalRecord(appointment._id.toString());
          if (medicalRecord) {
            results.push({
              appointmentId: appointment._id,
              medicalRecordId: medicalRecord._id,
              status: 'success'
            });
          }
        } catch (error) {
          console.error(`❌ [MedicalRecordSync] Failed to sync appointment ${appointment._id}:`, error);
          results.push({
            appointmentId: appointment._id,
            status: 'error',
            error: (error as Error).message || 'Unknown error'
          });
        }
      }

      console.log(`✅ [MedicalRecordSync] Bulk sync completed. Results:`, {
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        errors: results.filter(r => r.status === 'error').length
      });

      return results;

    } catch (error) {
      console.error(`❌ [MedicalRecordSync] Error in bulk sync:`, error);
      throw error;
    }
  }
}

export default MedicalRecordSyncService;
