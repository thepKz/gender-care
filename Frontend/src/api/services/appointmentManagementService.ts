import { appointmentApi } from '../endpoints/appointment';
import consultationApi from '../endpoints/consultation';
import { 
  ApiAppointment, 
  ApiConsultation, 
  UnifiedAppointment, 
  AppointmentFilters,
  AppointmentListResponse,
  ConsultationListResponse
} from '../../types/appointment';

/**
 * Service để quản lý appointments của doctor
 * Kết hợp data từ cả appointments thông thường và consultation requests
 */
class AppointmentManagementService {
  
  /**
   * Lấy danh sách appointments của doctor hiện tại
   */
  async getDoctorAppointments(filters: AppointmentFilters = {}): Promise<UnifiedAppointment[]> {
    try {
      console.log('📋 [DEBUG] Fetching doctor appointments with filters:', filters);
      
      // Gọi API để lấy appointments
      const appointmentResponse = await appointmentApi.getMyAppointments(filters);
      console.log('📋 [DEBUG] Appointment API Response:', appointmentResponse);
      
      // Transform appointments data - handle both direct data and wrapped response
      const appointmentData = appointmentResponse.data?.appointments || appointmentResponse.data || [];
      const appointments = this.transformAppointments(appointmentData);
      
      return appointments;
    } catch (error) {
      console.error('❌ [ERROR] Failed to fetch doctor appointments:', error);
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  }

  /**
   * Lấy danh sách consultations của doctor hiện tại
   */
  async getDoctorConsultations(filters: AppointmentFilters = {}): Promise<UnifiedAppointment[]> {
    try {
      console.log('💬 [DEBUG] Fetching doctor consultations with filters:', filters);
      
      // Gọi API để lấy consultations
      const consultationResponse = await consultationApi.getMyConsultations(filters);
      console.log('💬 [DEBUG] Consultation API Response:', consultationResponse);
      
      // Transform consultations data - handle both direct data and wrapped response
      const consultationData = consultationResponse.data?.consultations || consultationResponse.data || [];
      const consultations = this.transformConsultations(consultationData);
      
      return consultations;
    } catch (error) {
      console.error('❌ [ERROR] Failed to fetch doctor consultations:', error);
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  }

  /**
   * Lấy tất cả appointments và consultations của doctor hiện tại
   */
  async getAllDoctorAppointments(filters: AppointmentFilters = {}): Promise<UnifiedAppointment[]> {
    try {
      console.log('🔄 [DEBUG] Fetching all doctor appointments and consultations');
      
      // Gọi parallel để lấy cả 2 loại data
      const [appointments, consultations] = await Promise.allSettled([
        this.getDoctorAppointments(filters),
        this.getDoctorConsultations(filters)
      ]);

      // Extract results, handle rejections gracefully
      const appointmentList = appointments.status === 'fulfilled' ? appointments.value : [];
      const consultationList = consultations.status === 'fulfilled' ? consultations.value : [];

      if (appointments.status === 'rejected') {
        console.warn('⚠️ [WARNING] Failed to fetch appointments:', appointments.reason);
      }
      if (consultations.status === 'rejected') {
        console.warn('⚠️ [WARNING] Failed to fetch consultations:', consultations.reason);
      }

      // Kết hợp và sắp xếp theo thời gian
      const allAppointments = [...appointmentList, ...consultationList];
      
      // Sort by appointment date and time (newest first)
      allAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime}`);
        const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime}`);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('✅ [DEBUG] Combined appointments:', {
        total: allAppointments.length,
        appointments: appointmentList.length,
        consultations: consultationList.length
      });

      return allAppointments;
    } catch (error) {
      console.error('❌ [ERROR] Failed to fetch all doctor appointments:', error);
      return [];
    }
  }

  /**
   * Transform API appointments to unified format
   */
  private transformAppointments(appointments: ApiAppointment[]): UnifiedAppointment[] {
    return appointments.map(appointment => ({
      key: appointment._id,
      _id: appointment._id,
      patientName: appointment.profileId?.fullName || 'Chưa có tên',
      patientPhone: appointment.profileId?.phone || 'Chưa có SĐT',
      serviceName: appointment.serviceId?.serviceName || appointment.packageId?.name || 'Dịch vụ không xác định',
      serviceType: appointment.serviceId?.serviceType || 'other',
      doctorName: 'Bạn', // Current doctor
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      appointmentType: appointment.appointmentType,
      typeLocation: appointment.typeLocation,
      address: appointment.address,
      description: appointment.description || '',
      notes: appointment.notes,
      status: this.mapAppointmentStatus(appointment.status),
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      type: 'appointment',
      originalData: appointment
    }));
  }

  /**
   * Transform API consultations to unified format
   */
  private transformConsultations(consultations: ApiConsultation[]): UnifiedAppointment[] {
    return consultations.map(consultation => ({
      key: consultation._id,
      _id: consultation._id,
      patientName: consultation.fullName,
      patientPhone: consultation.phone,
      serviceName: 'Tư vấn trực tuyến',
      serviceType: 'tu-van-online',
      doctorName: 'Bạn', // Current doctor
      appointmentDate: consultation.appointmentDate || '2025-01-30', // Default if not scheduled yet
      appointmentTime: consultation.appointmentSlot || '15:00', // Default if not scheduled yet
      appointmentType: 'online-consultation' as any,
      typeLocation: 'Online',
      address: undefined,
      description: consultation.question,
      notes: consultation.notes || consultation.doctorNotes,
      status: this.mapConsultationStatus(consultation.status),
      createdAt: consultation.createdAt,
      updatedAt: consultation.updatedAt,
      type: 'consultation',
      originalData: consultation
    }));
  }

  /**
   * Map backend appointment status to UI status
   */
  private mapAppointmentStatus(status: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' {
    switch (status) {
      case 'pending':
      case 'pending_payment':
        return 'pending';
      case 'confirmed':
        return 'confirmed';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Map backend consultation status to UI status
   */
  private mapConsultationStatus(status: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' {
    switch (status) {
      case 'pending_payment':
      case 'paid':
      case 'doctor_confirmed':
        return 'pending';
      case 'scheduled':
      case 'consulting':
        return 'confirmed';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Lấy chi tiết appointment theo ID
   */
  async getAppointmentDetail(id: string, type: 'appointment' | 'consultation'): Promise<ApiAppointment | ApiConsultation | null> {
    try {
      if (type === 'appointment') {
        const response = await appointmentApi.getAppointmentById(id);
        return response.data;
      } else {
        const response = await consultationApi.getConsultationById(id);
        return response.data;
      }
    } catch (error) {
      console.error(`❌ [ERROR] Failed to fetch ${type} detail:`, error);
      return null;
    }
  }

  /**
   * Cập nhật trạng thái appointment
   */
  async updateAppointmentStatus(
    id: string, 
    status: 'confirmed' | 'completed' | 'cancelled',
    type: 'appointment' | 'consultation'
  ): Promise<boolean> {
    try {
      if (type === 'appointment') {
        await appointmentApi.updateAppointmentStatus(id, status as any);
      } else {
        // Map UI status to consultation status
        let consultationStatus: string = status;
        if (status === 'confirmed') consultationStatus = 'scheduled';
        await consultationApi.updateConsultationStatus(id, consultationStatus);
      }
      return true;
    } catch (error) {
      console.error(`❌ [ERROR] Failed to update ${type} status:`, error);
      return false;
    }
  }

  /**
   * Hủy appointment
   */
  async cancelAppointment(id: string, type: 'appointment' | 'consultation'): Promise<boolean> {
    try {
      if (type === 'appointment') {
        await appointmentApi.deleteAppointment(id);
      } else {
        await consultationApi.updateConsultationStatus(id, 'cancelled');
      }
      return true;
    } catch (error) {
      console.error(`❌ [ERROR] Failed to cancel ${type}:`, error);
      return false;
    }
  }
}

export const appointmentManagementService = new AppointmentManagementService();
export default appointmentManagementService; 