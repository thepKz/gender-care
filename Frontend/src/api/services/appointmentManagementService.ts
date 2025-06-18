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
import axiosInstance from '../axiosConfig';

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
      
      // 🔧 Thử multiple endpoints để tránh lỗi role
      let consultationResponse;
      let consultationData: any[] = [];
      
      try {
        // Try endpoint for doctors first
        consultationResponse = await consultationApi.getMyConsultations(filters);
        console.log('💬 [DEBUG] Doctor consultation API Response:', consultationResponse);
        
        // Handle multiple response formats from backend
        if (consultationResponse.data) {
          if (Array.isArray(consultationResponse.data)) {
            // Direct array format
            consultationData = consultationResponse.data;
          } else if (consultationResponse.data.consultations && Array.isArray(consultationResponse.data.consultations)) {
            // Wrapped in consultations field
            consultationData = consultationResponse.data.consultations;
          } else if (consultationResponse.data.data && Array.isArray(consultationResponse.data.data)) {
            // Nested data field
            consultationData = consultationResponse.data.data;
          } else {
            console.warn('⚠️ [WARNING] Unexpected response format:', consultationResponse.data);
            consultationData = [];
          }
        }
        
      } catch (doctorError: any) {
        console.warn('⚠️ [WARNING] Doctor endpoint failed, trying all consultations:', doctorError.response?.status);
        
        // Fallback: get all consultations if doctor endpoint fails (403 forbidden etc)
        if (doctorError.response?.status === 403 || doctorError.response?.status === 401) {
          try {
            consultationResponse = await consultationApi.getAllConsultations(filters);
            console.log('💬 [DEBUG] All consultations API Response:', consultationResponse);
            
            // Handle response format for getAllConsultations  
            if (consultationResponse.data) {
              if (Array.isArray(consultationResponse.data)) {
                consultationData = consultationResponse.data;
              } else if (consultationResponse.data.data && Array.isArray(consultationResponse.data.data)) {
                consultationData = consultationResponse.data.data;
              } else {
                console.warn('⚠️ [WARNING] Unexpected all consultations format:', consultationResponse.data);
                consultationData = [];
              }
            }
            
          } catch (allError) {
            console.error('❌ [ERROR] Both endpoints failed:', allError);
            throw allError;
          }
        } else {
          throw doctorError;
        }
      }
      
      // Validate consultationData is array before transform
      if (!Array.isArray(consultationData)) {
        console.warn('⚠️ [WARNING] consultationData is not array:', consultationData);
        consultationData = [];
      }
      
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
    // Validate input is array
    if (!Array.isArray(consultations)) {
      console.warn('⚠️ [WARNING] transformConsultations received non-array:', consultations);
      return [];
    }
    
    return consultations
      .filter(consultation => {
        // 🔧 Validate consultation object exists and has required fields
        if (!consultation || typeof consultation !== 'object') {
          console.warn('⚠️ [WARNING] Invalid consultation object:', consultation);
          return false;
        }
        
        // 🔧 Chỉ hiển thị consultation có appointmentDate và appointmentSlot
        const hasValidDate = consultation.appointmentDate && consultation.appointmentSlot;
        if (!hasValidDate) {
          console.log('🔍 [DEBUG] Skipping consultation without valid date/slot:', {
            id: consultation._id,
            hasDate: !!consultation.appointmentDate,
            hasSlot: !!consultation.appointmentSlot
          });
        }
        return hasValidDate;
      })
      .map(consultation => {
        try {
          return {
            key: consultation._id || `consultation-${Date.now()}`,
            _id: consultation._id || '',
            patientName: consultation.fullName || 'Chưa có tên',
            patientPhone: consultation.phone || 'Chưa có SĐT',
            serviceName: 'Tư vấn trực tuyến',
            serviceType: 'consultation',
            // Handle doctorId safely - could be ObjectId string or populated object
            doctorName: this.extractDoctorName(consultation.doctorId) || 'Bạn',
            appointmentDate: consultation.appointmentDate!,
            appointmentTime: consultation.appointmentSlot!,
            appointmentType: 'online-consultation' as any,
            typeLocation: 'Online',
            address: undefined,
            description: consultation.question || '',
            notes: consultation.notes || consultation.doctorNotes || '',
            status: this.mapConsultationStatus(consultation.status),
            createdAt: consultation.createdAt,
            updatedAt: consultation.updatedAt,
            type: 'consultation',
            originalData: consultation
          };
        } catch (transformError) {
          console.error('❌ [ERROR] Failed to transform consultation:', consultation, transformError);
          // Return minimal valid object instead of crashing
          return {
            key: consultation._id || `error-${Date.now()}`,
            _id: consultation._id || '',
            patientName: 'Lỗi dữ liệu',
            patientPhone: '',
            serviceName: 'Tư vấn trực tuyến',
            serviceType: 'consultation',
            doctorName: 'Bạn',
            appointmentDate: new Date().toISOString().split('T')[0],
            appointmentTime: '09:00',
            appointmentType: 'online-consultation' as any,
            typeLocation: 'Online',
            address: undefined,
            description: 'Dữ liệu không hợp lệ',
            notes: '',
            status: 'pending_payment' as any,
            createdAt: consultation.createdAt || new Date().toISOString(),
            updatedAt: consultation.updatedAt || new Date().toISOString(),
            type: 'consultation',
            originalData: consultation
          };
        }
      });
  }

  /**
   * Safely extract doctor name from doctorId field (could be string or populated object)
   */
  private extractDoctorName(doctorId: any): string {
    if (!doctorId) return '';
    
    // If doctorId is populated object with nested userId
    if (typeof doctorId === 'object' && doctorId.userId?.fullName) {
      return doctorId.userId.fullName;
    }
    
    // If doctorId is populated object with direct fullName
    if (typeof doctorId === 'object' && doctorId.fullName) {
      return doctorId.fullName;
    }
    
    // If doctorId is just ObjectId string
    if (typeof doctorId === 'string') {
      return ''; // Can't get name from ObjectId string
    }
    
    return '';
  }

  /**
   * Map backend appointment status to UI status
   */
  private mapAppointmentStatus(status: string): 'pending_payment' | 'scheduled' | 'completed' | 'cancelled' {
    switch (status) {
      case 'pending_payment':
        return 'pending_payment';
      case 'paid':        // ✅ LEGACY: Map old 'paid' to 'scheduled'
      case 'confirmed':   // ✅ LEGACY: Map old 'confirmed' to 'scheduled'  
      case 'scheduled':
        return 'scheduled';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      // ✅ LEGACY: Handle old statuses during transition
      case 'pending':
        return 'pending_payment'; // Map old 'pending' to 'pending_payment'
      default:
        console.warn(`⚠️ [WARNING] Unknown appointment status: ${status}`);
        return 'pending_payment'; // Safe fallback
    }
  }

  /**
   * Map backend consultation status to UI status
   */
  private mapConsultationStatus(status: string): 'pending_payment' | 'scheduled' | 'consulting' | 'completed' | 'cancelled' {
    switch (status) {
      case 'pending_payment':
        return 'pending_payment';
      case 'paid':        // ✅ LEGACY: Map old 'paid' to 'scheduled'
      case 'confirmed':   // ✅ LEGACY: Map old 'confirmed' to 'scheduled'
      case 'scheduled':
        return 'scheduled';
      case 'consulting':
        return 'consulting';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      // ✅ LEGACY: Handle old statuses during transition
      case 'pending':
        return 'pending_payment'; // Map old 'pending' to 'pending_payment'
      default:
        console.warn(`⚠️ [WARNING] Unknown consultation status: ${status}`);
        return 'pending_payment'; // Safe fallback
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
   * ✅ SIMPLIFIED: Chỉ allow completed | cancelled (scheduled được set tự động sau payment)
   */
  async updateAppointmentStatus(
    id: string, 
    status: 'completed' | 'cancelled',
    type: 'appointment' | 'consultation'
  ): Promise<boolean> {
    try {
      if (type === 'appointment') {
        await appointmentApi.updateAppointmentStatus(id, status as any);
      } else {
        // For consultations, use direct status mapping
        await consultationApi.updateConsultationStatus(id, status);
      }
      return true;
    } catch (error) {
      console.error(`❌ [ERROR] Failed to update ${type} status:`, error);
      return false;
    }
  }

  /**
   * ✅ DEPRECATED: Confirm step removed from workflow
   * Payment success now automatically sets status to 'scheduled'
   * Keeping for backward compatibility only
   */
  async confirmAppointment(id: string, type: 'appointment' | 'consultation'): Promise<boolean> {
    console.warn('⚠️ [DEPRECATED] confirmAppointment() is deprecated. Payment now auto-schedules appointments.');
    try {
      // For legacy support, try to set status to 'scheduled' directly
      return await this.updateAppointmentStatus(id, 'completed', type); // Fallback to completed
    } catch (error) {
      console.error(`❌ [ERROR] Failed to confirm ${type}:`, error);
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

  /**
   * Hủy lịch hẹn bởi bác sĩ với lý do
   */
  async cancelByDoctor(id: string, type: 'appointment' | 'consultation', reason: string): Promise<boolean> {
    try {
      console.log(`🚫 [SERVICE] Cancelling ${type} ${id} by doctor with reason: ${reason}`);
      
      if (type === 'appointment') {
        const response = await appointmentApi.cancelAppointmentByDoctor(id, reason);
        return response.success === true;
      } else {
        // DoctorQA cancellation with reason
        const response = await axiosInstance.put(`/doctor-qa/${id}/cancel-by-doctor`, { reason });
        return response.status === 200;
      }
    } catch (error) {
      console.error(`❌ [ERROR] Failed to cancel ${type} by doctor:`, error);
      return false;
    }
  }
}

export const appointmentManagementService = new AppointmentManagementService();
export default appointmentManagementService; 