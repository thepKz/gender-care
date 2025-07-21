import { Input, message, Modal, Pagination, Select, Tag, Form } from 'antd';
import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    CloseCircle,
    Location,
    MonitorMobbile,
    Refresh,
    SearchNormal1,
    TickCircle,
    Timer,
    Warning2
} from 'iconsax-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi } from '../../api/endpoints/appointment';
import consultationApi from '../../api/endpoints/consultation';
import { useAuth } from '../../hooks/useAuth';
import { safeCombineDateTime } from '../../utils/dateTimeUtils';

const { Search } = Input;
const { Option } = Select;

// ✅ FIX: Enhanced refund data interface to handle multiple data structures
interface RefundData {
  refundReason?: string;
  processingStatus?: 'pending' | 'completed' | 'rejected';
  refundInfo?: {
    accountNumber: string;
    accountHolderName: string;
    bankName: string;
    submittedAt: string;
  };
  processedBy?: string;
  processedAt?: string;
  processingNotes?: string;
  // ✅ Additional fields for legacy/alternative data structure
  accountNumber?: string;
  accountHolderName?: string;
  bankName?: string;
}

interface RawAppointmentData {
  _id: string;
  type?: string;
  serviceId?: string;
  serviceName?: string;
  packageName?: string;
  packageId?: string;
  packagePurchaseId?: string;
  doctorName?: string;
  doctorAvatar?: string;
  patientName?: string;
  fullName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentSlot?: string;
  typeLocation?: string;
  status: string;
  price?: number;
  createdAt: string;
  description?: string;
  question?: string;
  notes?: string;
  address?: string;
  canCancel?: boolean;
  canReschedule?: boolean;
  rating?: number;
  feedback?: string;
  phone?: string;
  age?: number;
  gender?: string;
  doctorNotes?: string;
  doctorMeetingNotes?: string; // Ghi chú của bác sĩ từ Meeting
  paymentStatus?: string;
  refund?: RefundData;
  // ✅ ADD: Package expiry info
  packageExpiryInfo?: {
    hasPackage: boolean;
    packageId?: string;
    packageName?: string;
    isExpired: boolean;
    expiryDate?: string;
    packageStatus: string;
  };
}

interface Appointment {
  id: string;
  type?: 'appointment' | 'consultation';
  serviceId: string;
  serviceName: string;
  packageName?: string;
  packageId?: string;
  packagePurchaseId?: string;
  doctorName?: string;
  doctorAvatar?: string;
  patientName?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentSlot?: string;
  typeLocation: string;
  status: string;
  price: number;
  createdAt: string;
  description?: string;
  notes?: string;
  address?: string;
  canCancel: boolean;
  canReschedule: boolean;
  rating?: number;
  feedback?: string;
  phone?: string;
  age?: number;
  gender?: string;
  question?: string;
  doctorNotes?: string;
  doctorMeetingNotes?: string; // Ghi chú của bác sĩ từ Meeting
  paymentStatus?: string;
  refund?: RefundData;
  // ✅ ADD: Package expiry info
  packageExpiryInfo?: {
    hasPackage: boolean;
    packageId?: string;
    packageName?: string;
    isExpired: boolean;
    expiryDate?: string;
    packageStatus: string;
  };
}

interface RefundInfo {
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  reason?: string;
}

const BookingHistoryOptimized: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [requestRefund, setRequestRefund] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [refundForm] = Form.useForm();
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);

  // Fetch appointments
  const fetchAppointments = async () => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      const isManagementRole = ['admin', 'staff', 'manager'].includes(user.role);
      let response;
      
      if (isManagementRole) {
        response = await appointmentApi.getAllAppointments({ limit: 100 });
      } else {
        response = await appointmentApi.getUserBookingHistory({ limit: 50 });
      }
      
      let appointmentsData = [];
      if (isManagementRole) {
        appointmentsData = response.data?.appointments || [];
      } else {
        appointmentsData = response.data?.data?.bookings || response.data?.bookings || [];
      }



      if (appointmentsData && appointmentsData.length >= 0) {
        const formattedAppointments = appointmentsData.map((apt: RawAppointmentData) => {
          // ✅ Infer paymentStatus từ status nếu không có sẵn
          let paymentStatus = apt.paymentStatus;
          
          if (!paymentStatus) {
            // Logic infer paymentStatus từ appointment status
            if (['confirmed', 'scheduled', 'consulting', 'completed', 'done_testResultItem', 'done_testResult'].includes(apt.status)) {
              paymentStatus = 'paid';
            } else if (apt.status === 'pending_payment') {
              paymentStatus = 'unpaid';
            } else if (apt.status === 'cancelled') {
              paymentStatus = 'refunded'; // Assume cancelled means refunded
            } else {
              paymentStatus = 'unpaid'; // Default fallback
            }
            

          }

          return {
          id: apt._id,
            type: (apt.type as 'appointment' | 'consultation') || 'appointment',
          serviceId: apt.serviceId || '',
          serviceName: apt.serviceName || 'Dịch vụ không xác định',
          packageName: apt.packageName,
          packageId: apt.packageId,
          packagePurchaseId: apt.packagePurchaseId,
          doctorName: apt.doctorName || 'Chưa chỉ định bác sĩ',
          doctorAvatar: apt.doctorAvatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
          patientName: apt.patientName || apt.fullName,
          appointmentDate: apt.appointmentDate ? new Date(apt.appointmentDate).toISOString().split('T')[0] : '',
          appointmentTime: apt.appointmentTime || apt.appointmentSlot || '',
          appointmentSlot: apt.appointmentSlot,
          typeLocation: apt.typeLocation || 'clinic',
          status: apt.status,
          price: apt.price || 0,
          createdAt: new Date(apt.createdAt).toISOString(),
          description: apt.description || apt.question,
          notes: apt.notes,
          address: apt.address,
          canCancel: apt.canCancel || false,
          canReschedule: apt.canReschedule || false,
          rating: apt.rating,
          feedback: apt.feedback,
          phone: apt.phone,
          age: apt.age,
          gender: apt.gender,
          question: apt.question,
            doctorNotes: apt.doctorNotes,
            doctorMeetingNotes: apt.doctorMeetingNotes, // Ghi chú của bác sĩ từ Meeting
            paymentStatus: paymentStatus,
            refund: apt.refund, // Include refund info từ raw data
            // ✅ ADD: Package expiry info
            packageExpiryInfo: apt.packageExpiryInfo
          };
        });



        setAppointments(formattedAppointments);
        setFilteredAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('❌ [BookingHistory] Error fetching appointments:', error);
      message.error('Không thể tải danh sách lịch hẹn');
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [isAuthenticated, user, navigate]);

  // Filter appointments
  useEffect(() => {
    let filtered = appointments;

    if (searchText) {
      filtered = filtered.filter(apt =>
        apt.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
        apt.doctorName?.toLowerCase().includes(searchText.toLowerCase()) ||
        apt.packageName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchText, statusFilter, appointments]);

  // Auto refresh for pending_payment appointments (no notifications to avoid spam)
  useEffect(() => {
    if (!appointments.length) return;

    // Check if there are any pending_payment appointments
    const pendingPayments = appointments.filter(apt => apt.status === 'pending_payment');
    
    if (pendingPayments.length === 0) return;

    // Set up interval to check and refresh every 30 seconds
    const interval = setInterval(() => {
      const now = new Date().getTime();
      let shouldRefresh = false;

      // Check if any pending_payment appointment has expired
      pendingPayments.forEach(appointment => {
        const createdTime = new Date(appointment.createdAt).getTime();
        const elapsedMinutes = Math.floor((now - createdTime) / (1000 * 60));
        
        // If more than 10 minutes have passed, refresh to get updated status
        if (elapsedMinutes >= 10) {
          shouldRefresh = true;
        }
      });

      if (shouldRefresh) {
        console.log('🔄 [Auto-Refresh] Pending payment appointments expired, refreshing...');
        fetchAppointments();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [appointments]);

  // Status configuration - ✅ Updated với consultation statuses
  const statusConfig = {
    pending: { color: '#faad14', text: 'Chờ xác nhận', icon: <Timer size={16} /> },
    pending_payment: { color: '#ff7f00', text: 'Chờ thanh toán', icon: <Clock size={16} /> },
    scheduled: { color: '#1890ff', text: 'Đã lên lịch', icon: <Calendar size={16} /> }, // ➕ Consultation status
    confirmed: { color: '#52c41a', text: 'Đã xác nhận', icon: <TickCircle size={16} /> },
    consulting: { color: '#a3e635', text: 'Đang tư vấn', icon: <MonitorMobbile size={16} /> }, // ✅ Updated text
    done_testResultItem: { color: '#2563eb', text: 'Hoàn thành kết quả', icon: <TickCircle size={16} /> },
    done_testResult: { color: '#06b6d4', text: 'Hoàn thành hồ sơ', icon: <TickCircle size={16} /> },
    completed: { color: '#22c55e', text: 'Hoàn thành', icon: <TickCircle size={16} /> },
    cancelled: { color: '#f5222d', text: 'Đã hủy', icon: <CloseCircle size={16} /> },
    payment_cancelled: { color: '#ff4d4f', text: 'Hủy thanh toán', icon: <CloseCircle size={16} /> },
    expired: { color: '#f5222d', text: 'Hết hạn', icon: <CloseCircle size={16} /> }
  };

  const locationConfig = {
    online: { icon: <MonitorMobbile size={16} />, text: 'Online' },
    Online: { icon: <MonitorMobbile size={16} />, text: 'Online' },
    clinic: { icon: <Location size={16} />, text: 'Phòng khám' },
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const handleViewDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  // Helper function to check if appointment can be cancelled (ALWAYS except cancelled/completed/expired)
  const canCancel = (appointment: Appointment): boolean => {
    return !['cancelled', 'completed', 'expired'].includes(appointment.status);
  };

  // Helper function to check if appointment can be cancelled with refund (24h rule)
  const canCancelWithRefund = (appointment: Appointment): boolean => {
    // Chỉ cho phép hoàn tiền nếu đã thanh toán
    if (appointment.paymentStatus !== 'paid') {
      return false;
    }

    // Không cho phép hủy nếu đã quá hạn
    if (appointment.status === 'expired') {
      return false;
    }

    if (!appointment.appointmentDate) {
      return false;
    }

    // Sử dụng appointmentTime hoặc appointmentSlot, fallback về "00:00" nếu không có
    const timeSlot = appointment.appointmentTime || appointment.appointmentSlot || "00:00";
    
    // Use safe datetime combination
    const appointmentDateTime = safeCombineDateTime(appointment.appointmentDate, timeSlot);
    
    // Check if appointment datetime is valid
    if (!appointmentDateTime) {
      console.warn('Invalid appointment datetime for refund check:', { 
        appointmentDate: appointment.appointmentDate, 
        timeSlot 
      });
      return false;
    }

    const currentTime = new Date();
    const hoursDifference = (appointmentDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

    // CHỈ cho phép hoàn tiền nếu còn hơn 24 giờ (không ảnh hưởng đến việc hủy)
    return hoursDifference > 24;
  };

  // Function to calculate hours remaining until appointment
  const getHoursUntilAppointment = (appointment: Appointment): number => {
    if (!appointment.appointmentDate) return 0;
    
    // Sử dụng appointmentTime hoặc appointmentSlot, fallback về "00:00" nếu không có
    const timeSlot = appointment.appointmentTime || appointment.appointmentSlot || "00:00";
    
    // Use safe datetime combination
    const appointmentDateTime = safeCombineDateTime(appointment.appointmentDate, timeSlot);
    
    // Check if appointment datetime is valid
    if (!appointmentDateTime) {
      console.warn('Invalid appointment datetime for hours calculation:', { 
        appointmentDate: appointment.appointmentDate, 
        timeSlot 
      });
      return 0;
    }
    
    const currentTime = new Date();
    return (appointmentDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
  };

  // Handle cancel appointment - show cancel modal first
  const handleCancelAppointment = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    
    // ✅ IMPROVED: Kiểm tra chính xác xem có phải appointment với gói hết hạn không
    const hasPackage = appointment.packageName && appointment.packageId;
    
    // ✅ FIX: Hiển thị cảnh báo chỉ khi gói thực sự hết hạn
    const hasPackageName = appointment.packageName;
    
    if (hasPackageName) {
      // ✅ IMPROVED: Kiểm tra expiry với validation chính xác
      const packageExpiryInfo = appointment.packageExpiryInfo;
      const isExpiredPackage = packageExpiryInfo?.isExpired || false;
      
      // ✅ FIX: Chỉ hiển thị cảnh báo khi gói thực sự hết hạn
      const shouldShowWarning = isExpiredPackage;
      
      if (shouldShowWarning) {
        // Hiển thị cảnh báo trước khi hủy (chỉ cho gói hết hạn)
        Modal.confirm({
          title: '⚠️ Cảnh báo: Gói dịch vụ đã hết hạn',
          content: (
            <div>
              <p>Lịch hẹn này sử dụng gói dịch vụ <strong>"{appointment.packageName}"</strong> đã hết hạn.</p>
              <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                <li>Lượt sử dụng sẽ được hoàn lại</li>
                <li>Bạn sẽ không thể đặt lịch mới với gói này</li>
                <li>Cần cân nhắc kỹ trước khi hủy</li>
              </ul>
              {packageExpiryInfo?.expiryDate && (
                <p style={{ marginTop: '8px', color: '#666', fontSize: '13px' }}>
                  <strong>Ngày hết hạn:</strong> {new Date(packageExpiryInfo.expiryDate).toLocaleDateString('vi-VN')}
                </p>
              )}
              <p style={{ marginTop: '12px', color: '#666', fontStyle: 'italic' }}>
                Bạn có chắc chắn muốn hủy lịch hẹn này không?
              </p>
            </div>
          ),
          okText: 'Vẫn hủy',
          cancelText: 'Để lại',
          onOk: () => {
            handleDirectCancel(appointment);
          }
        });
      } else {
        // Gói chưa hết hạn → Hủy thẳng (không cần form hoàn tiền)
        handleDirectCancel(appointment);
      }
    } else {
      // Không có gói, xử lý bình thường (có thể cần form hoàn tiền)
      handleNormalCancel(appointment);
    }
  };

  // ✅ NEW: Helper function để xử lý cancel bình thường
  const handleNormalCancel = (appointment: Appointment) => {
    // ✅ FIX: Nếu là appointment sử dụng gói đã mua → Hủy thẳng (không cần form hoàn tiền)
    if (appointment.packageName && appointment.packageId) {
      // Appointment sử dụng gói đã mua → Hủy thẳng vì đã có hoàn lượt sử dụng
      handleDirectCancel(appointment);
    } else if (appointment.paymentStatus === 'paid' && canCancelWithRefund(appointment)) {
      // Đã thanh toán + đủ điều kiện hoàn tiền → Show form
      setRequestRefund(true);
      setShowCancelModal(true);
    } else {
      // Các trường hợp khác → Hủy thẳng
      // - Chưa thanh toán 
      // - Đã thanh toán nhưng không đủ điều kiện hoàn tiền
      handleDirectCancel(appointment);
    }
  };

  // ✅ NEW: Function hủy thẳng cho lịch không cần form refund
  const handleDirectCancel = async (appointment: Appointment) => {
    try {
      setCancelLoading(true);
      let response: any;
      
      if (appointment.type === 'consultation') {
        response = await consultationApi.cancelConsultationByUser(
          appointment.id, 
          'Hủy bởi người dùng'
        );
      } else {
        // ✅ FIX: Dùng deleteAppointment (đã bỏ validation 10 phút ở backend)
        response = await appointmentApi.deleteAppointment(appointment.id);
      }
      
      // ✅ NEW: Kiểm tra package expiry warning
      if (response?.data?.packageRefund?.packageExpired) {
        Modal.warning({
          title: '⚠️ Gói dịch vụ đã hết hạn',
          content: (
            <div>
              <p>Gói dịch vụ của bạn đã hết hạn sử dụng. Lượt sử dụng đã được hoàn lại nhưng bạn sẽ không thể đặt lịch mới với gói này.</p>
              <p style={{ marginTop: '8px', color: '#666' }}>
                Ngày hết hạn: {new Date(response.data.packageRefund.expiryDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
          ),
          okText: 'Đã hiểu'
        });
      }
      
      message.success('Hủy lịch hẹn thành công!');
      
      // Refresh appointments list
      await fetchAppointments();
      
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.';
      message.error(errorMessage);
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle final cancellation
  const handleFinalCancel = async (refundInfo?: RefundInfo) => {
    if (!selectedAppointment) return;

    try {
      setCancelLoading(true);
      let response: any;
      
      if (selectedAppointment.type === 'consultation') {
        response = await consultationApi.cancelConsultationByUser(
          selectedAppointment.id, 
          `Hủy bởi người dùng. ${refundInfo?.reason || ''}`
        );
      } else {
        if (requestRefund && refundInfo) {
          response = await appointmentApi.cancelAppointmentWithRefund(
            selectedAppointment.id, 
            refundInfo.reason || 'Hủy bởi người dùng',
            refundInfo
          );
        } else {
          response = await appointmentApi.deleteAppointment(selectedAppointment.id);
        }
      }
      
      // ✅ NEW: Kiểm tra package expiry warning
      if (response?.data?.packageRefund?.packageExpired) {
        Modal.warning({
          title: '⚠️ Gói dịch vụ đã hết hạn',
          content: (
            <div>
              <p>Gói dịch vụ của bạn đã hết hạn sử dụng. Lượt sử dụng đã được hoàn lại nhưng bạn sẽ không thể đặt lịch mới với gói này.</p>
              <p style={{ marginTop: '8px', color: '#666' }}>
                Ngày hết hạn: {new Date(response.data.packageRefund.expiryDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
          ),
          okText: 'Đã hiểu'
        });
      }
      
      const successMessage = requestRefund 
        ? 'Hủy lịch hẹn thành công! Tiền sẽ được hoàn lại trong 3-5 ngày làm việc.'
        : 'Hủy lịch hẹn thành công!';
      
      message.success(successMessage);
      
      // Refresh appointments list instead of updating local state
      await fetchAppointments();
      
      setShowDetailModal(false);
      setShowCancelModal(false);
      setRequestRefund(false);
      refundForm.resetFields();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.';
      message.error(errorMessage);
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle refund form submission
  const handleRefundFormSubmit = async (refundInfo: RefundInfo) => {
    handleFinalCancel(refundInfo);
  };

  // ✅ NEW: Parse notes để tách ghi chú gốc và lý do hủy
  const parseNotes = (notes: string) => {
    if (!notes) return { originalNotes: '', cancellationReason: '' };
    
    // ✅ SIMPLE APPROACH: Tách bằng indexOf để đơn giản
    const cancelIndex = notes.indexOf('[Hủy]:');
    const doctorCancelIndex = notes.indexOf('[DOCTOR CANCELLED]');
    
    if (cancelIndex !== -1) {
      const originalNotes = notes.substring(0, cancelIndex).trim();
      const cancellationReason = notes.substring(cancelIndex + 6).trim(); // 6 = length of '[Hủy]:'
      return { originalNotes, cancellationReason };
    }
    
    if (doctorCancelIndex !== -1) {
      const originalNotes = notes.substring(0, doctorCancelIndex).trim();
      const cancellationReason = notes.substring(doctorCancelIndex + 18).trim(); // 18 = length of '[DOCTOR CANCELLED]'
      return { originalNotes, cancellationReason };
    }
    
    // Nếu không có pattern cancel nào, trả về toàn bộ làm originalNotes
    return { originalNotes: notes, cancellationReason: '' };
  };

  // Get current page appointments
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải lịch sử đặt lịch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch sử đặt lịch</h1>
          <p className="text-gray-600">Quản lý và theo dõi các lịch hẹn của bạn</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <Search
                placeholder="Tìm theo dịch vụ, bác sĩ..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchNormal1 size={16} className="text-gray-400" />}
                allowClear
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full"
                placeholder="Chọn trạng thái"
              >
                <Option value="all">Tất cả</Option>
                <Option value="pending">Chờ xác nhận</Option>
                <Option value="pending_payment">Chờ thanh toán</Option>
                <Option value="scheduled">Đã lên lịch</Option>
                <Option value="confirmed">Đã xác nhận</Option>
                <Option value="consulting">Đang tư vấn</Option>
                <Option value="completed">Hoàn thành</Option>
                <Option value="cancelled">Đã hủy</Option>
              </Select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchAppointments}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors h-fit"
              >
                <Refresh size={16} />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredAppointments.length)} trong {filteredAppointments.length} lịch hẹn
          </p>
        </div>

        {/* Appointments Grid */}
        {currentAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có lịch hẹn nào</h3>
            <p className="text-gray-600 mb-6">Bạn chưa có lịch hẹn nào. Hãy đặt lịch hẹn đầu tiên!</p>
            <button
              onClick={() => navigate('/booking')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đặt lịch ngay
            </button>
          </div>
        ) : (
          <motion.div 
            className="grid gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {currentAppointments.map((appointment) => (
              <motion.div
                key={appointment.id}
                variants={item}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.serviceName}
                        </h3>
                        
                        {/* ➕ Service Type Badge */}
                        <Tag 
                          color={appointment.type === 'consultation' ? '#1890ff' : '#52c41a'}
                          className="text-xs px-2 py-1"
                        >
                          {appointment.type === 'consultation' ? ' Tư vấn online' : ' Dịch vụ khám'}
                        </Tag>

                        <Tag
                          color={
                            (appointment.status === 'pending_payment' && (() => {
                              const createdTime = new Date(appointment.createdAt).getTime();
                              const currentTime = new Date().getTime();
                              const elapsedMinutes = Math.floor((currentTime - createdTime) / (1000 * 60));
                              const remainingMinutes = Math.max(0, 10 - elapsedMinutes);
                              return remainingMinutes <= 0;
                            })()) || (appointment.status === 'expired' && appointment.paymentStatus === 'expired')
                              ? '#f5222d'
                              : statusConfig[appointment.status as keyof typeof statusConfig]?.color
                          }
                          className="flex items-center gap-1 text-xs px-2 py-1"
                        >
                          {(appointment.status === 'pending_payment' && (() => {
                            const createdTime = new Date(appointment.createdAt).getTime();
                            const currentTime = new Date().getTime();
                            const elapsedMinutes = Math.floor((currentTime - createdTime) / (1000 * 60));
                            const remainingMinutes = Math.max(0, 10 - elapsedMinutes);
                            return remainingMinutes <= 0;
                          })()) ? (
                            <>
                              <CloseCircle size={16} /> Đã hủy lịch (quá hạn thanh toán)
                            </>
                          ) : (appointment.status === 'expired' && appointment.paymentStatus === 'expired') ? (
                            <>
                              <CloseCircle size={16} /> Đã quá hạn thanh toán
                            </>
                          ) : (
                            <>
                              {statusConfig[appointment.status as keyof typeof statusConfig]?.icon}
                              {statusConfig[appointment.status as keyof typeof statusConfig]?.text}
                            </>
                          )}
                        </Tag>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-blue-500" />
                          <span>
                            {appointment.appointmentDate ? formatDate(appointment.appointmentDate) : 'Chưa xác định'}
                            {appointment.appointmentTime && ` • ${appointment.appointmentTime}`}
                            {!appointment.appointmentTime && appointment.appointmentSlot && ` • ${appointment.appointmentSlot}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {locationConfig[appointment.typeLocation as keyof typeof locationConfig]?.icon}
                          <span>{locationConfig[appointment.typeLocation as keyof typeof locationConfig]?.text || appointment.typeLocation}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <img 
                            src={appointment.doctorAvatar} 
                            alt={appointment.doctorName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span>{appointment.doctorName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-600">
                            {formatPrice(appointment.price)}
                          </span>
                        </div>

                        {/* ➕ Hiển thị thông tin bệnh nhân cho consultations */}
                        {appointment.type === 'consultation' && appointment.patientName && (
                          <div className="flex items-center gap-2 col-span-2">
                            <span className="text-gray-500"> Bệnh nhân:</span>
                            <span>{appointment.patientName}</span>
                            {appointment.phone && <span className="text-gray-400">• {appointment.phone}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Nút feedback cho appointments đã hoàn thành */}
                      {appointment.status === 'completed' && !appointment.rating && (
                        <button
                          onClick={() => navigate(`/feedback?appointment=${appointment.id}`)}
                          className="flex items-center gap-1 px-3 py-2 text-sm bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors font-medium"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          Đánh giá
                        </button>
                      )}
                      
                      {appointment.status === 'completed' && appointment.rating && (
                        <div className="flex items-center gap-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg">
                          <svg className="w-4 h-4 fill-current text-yellow-400" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <span>Đã đánh giá {appointment.rating}/5</span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleViewDetail(appointment)}
                        className="px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>

                  {/* Quick actions for pending appointments */}
                  {appointment.status === 'pending_payment' && (() => {
                    const createdTime = new Date(appointment.createdAt).getTime();
                    const currentTime = new Date().getTime();
                    const elapsedMinutes = Math.floor((currentTime - createdTime) / (1000 * 60));
                    const remainingMinutes = Math.max(0, 10 - elapsedMinutes);
                    if (remainingMinutes <= 0) return null;
                    return (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm text-orange-600 font-medium">
                                Cần thanh toán để xác nhận lịch hẹn
                              </span>
                              <span className="text-xs text-gray-500">
                                Chỗ sẽ được giữ trong 10 phút. Sau đó, lịch sẽ tự động hủy.
                              </span>
                            </div>
                            <button
                              onClick={async () => {
                                if (appointment.type === 'consultation') {
                                  try {
                                    const res = await consultationApi.createConsultationPaymentLink(appointment.id);
                                    // Kiểm tra response structure
                                    const paymentUrl = res?.data?.data?.paymentUrl || res?.data?.paymentUrl;
                                    if (paymentUrl) {
                                      window.location.href = paymentUrl;
                                    } else {
                                      message.error('Không tạo được link thanh toán cho tư vấn');
                                    }
                                  } catch {
                                    message.error('Lỗi khi tạo link thanh toán cho tư vấn');
                                  }
                                } else {
                                  navigate(`/payment/process?appointmentId=${appointment.id}`);
                                }
                              }}
                              className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                            >
                              Thanh toán ngay
                            </button>
                          </div>
                          {(() => {
                            // Tính thời gian tạo lịch
                            const createdTime = new Date(appointment.createdAt).getTime();
                            const currentTime = new Date().getTime();
                            const elapsedMinutes = Math.floor((currentTime - createdTime) / (1000 * 60));
                            const remainingMinutes = Math.max(0, 10 - elapsedMinutes);
                            
                            if (remainingMinutes > 0) {
                              return (
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                  <div 
                                    className="bg-orange-500 h-2.5 rounded-full" 
                                    style={{ width: `${remainingMinutes * 10}%` }}
                                  ></div>
                                  <div className="text-xs text-gray-500 mt-1 text-right">
                                    Còn {remainingMinutes} phút để thanh toán
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div className="text-xs text-red-500 font-medium mt-2">
                                Hết thời gian giữ chỗ! Lịch có thể bị hủy bất kỳ lúc nào.
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {filteredAppointments.length > pageSize && (
          <div className="flex justify-center mt-8">
            <Pagination
              current={currentPage}
              total={filteredAppointments.length}
              pageSize={pageSize}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showQuickJumper={false}
              itemRender={(page, type, originalElement) => {
                if (type === 'prev') {
                  return (
                    <span className="px-3 py-2 text-gray-600 hover:text-blue-600 cursor-pointer">
                      Trước
                    </span>
                  );
                }
                if (type === 'next') {
                  return (
                    <span className="px-3 py-2 text-gray-600 hover:text-blue-600 cursor-pointer">
                      Sau
                    </span>
                  );
                }
                return originalElement;
              }}
            />
          </div>
        )}

        {/* Detail Modal */}
        <Modal
          title="Chi tiết lịch hẹn"
          open={showDetailModal}
          onCancel={() => setShowDetailModal(false)}
          footer={null}
          width={800}
        >
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Status and Service */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{selectedAppointment.serviceName}</h3>
                  <Tag
                    color={
                      (selectedAppointment.status === 'cancelled' && selectedAppointment.paymentStatus === 'unpaid') ||
                      (selectedAppointment.status === 'expired' && selectedAppointment.paymentStatus === 'expired')
                        ? '#f5222d'
                        : statusConfig[selectedAppointment.status as keyof typeof statusConfig]?.color
                    }
                    className="flex items-center gap-1"
                  >
                    {(selectedAppointment.status === 'cancelled' && selectedAppointment.paymentStatus === 'unpaid') ? (
                      <>
                        <CloseCircle size={16} /> Đã hủy lịch (quá hạn thanh toán)
                      </>
                    ) : (selectedAppointment.status === 'expired' && selectedAppointment.paymentStatus === 'expired') ? (
                      <>
                        <CloseCircle size={16} /> Đã quá hạn thanh toán
                      </>
                    ) : (
                      <>
                        {statusConfig[selectedAppointment.status as keyof typeof statusConfig]?.icon}
                        {statusConfig[selectedAppointment.status as keyof typeof statusConfig]?.text}
                      </>
                    )}
                  </Tag>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày đặt lịch</label>
                  <p className="text-gray-900">{formatDate(selectedAppointment.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày hẹn</label>
                  <p className="text-gray-900">{formatDate(selectedAppointment.appointmentDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Giờ hẹn</label>
                  <p className="text-gray-900">{selectedAppointment.appointmentTime}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Hình thức</label>
                  <p className="text-gray-900">
                    {locationConfig[selectedAppointment.typeLocation as keyof typeof locationConfig]?.text || selectedAppointment.typeLocation}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Chi phí</label>
                  <p className="text-gray-900 font-semibold">{formatPrice(selectedAppointment.price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái thanh toán</label>
                  <p className="text-gray-900">
                    {selectedAppointment.paymentStatus === 'expired' ? (
                      <span className="text-red-600 font-medium">Đã quá hạn thanh toán</span>
                    ) : (selectedAppointment.paymentStatus === 'paid' || selectedAppointment.paymentStatus === 'refunded') ? (
                      'Đã thanh toán'
                    ) : (
                      'Chưa thanh toán'
                    )}
                  </p>
                </div>
              </div>


              
              {/* Hiển thị trạng thái hoàn tiền nếu có - Full Width */}
              {(() => {
                // Check if this is a cancelled appointment that should show refund tracking
                const shouldShowRefundTracking = (
                  selectedAppointment.status === 'cancelled' && 
                  (selectedAppointment.paymentStatus === 'paid' || selectedAppointment.paymentStatus === 'refunded') && 
                  selectedAppointment.notes?.includes('[Hủy]')
                );
                
                return shouldShowRefundTracking;
              })() && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-amber-800">Trạng thái hoàn tiền</h4>
                    <div className="flex items-center gap-2">
                                                {(() => {
                            // Parse refund data nếu nó là string JSON
                            let refundData: RefundData | undefined = selectedAppointment.refund;
                            if (typeof refundData === 'string') {
                              try {
                                refundData = JSON.parse(refundData) as RefundData;
                              } catch {
                                // JSON parsing failed, use as is
                                refundData = undefined;
                              }
                            }
                            
                            
                            
                            const refundStatus = refundData?.processingStatus || 'pending';
                            switch (refundStatus) {
                              case 'pending':
                                return <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm rounded-full font-medium">Chờ xử lý</span>;
                              case 'completed':
                                return <span className="px-3 py-1 bg-green-200 text-green-800 text-sm rounded-full font-medium">Đã hoàn tiền</span>;
                              case 'rejected':
                                return <span className="px-3 py-1 bg-red-200 text-red-800 text-sm rounded-full font-medium">Từ chối hoàn tiền</span>;
                              default:
                                return <span className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-full font-medium">Không xác định</span>;
                            }
                          })()}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                                          {(() => {
                      // Parse refund data
                      let refundData: RefundData | undefined = selectedAppointment.refund;
                      if (typeof refundData === 'string') {
                        try {
                          refundData = JSON.parse(refundData) as RefundData;
                        } catch {
                          refundData = undefined;
                        }
                      }
                      
                      return (
                        <>
                          {refundData?.refundReason && (
                            <div className="bg-amber-100 p-3 rounded border">
                              <div className="text-sm">
                                <span className="font-medium text-amber-800">Lý do hủy:</span>
                                <div className="mt-1 text-amber-700">{refundData.refundReason}</div>
                              </div>
                            </div>
                          )}
                          

                          
                          {(refundData?.refundInfo || (refundData?.accountNumber && refundData?.bankName)) ? (
                            <div className="bg-amber-100 p-3 rounded border">
                              <div className="font-medium text-amber-800 mb-2">Thông tin tài khoản nhận hoàn tiền:</div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div className="text-sm">
                                  <span className="font-medium text-amber-700">Ngân hàng:</span>
                                  <div className="text-amber-600">
                                    {refundData?.refundInfo?.bankName || refundData?.bankName || 'Chưa có thông tin'}
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium text-amber-700">Số tài khoản:</span>
                                  <div className="text-amber-600">
                                    {refundData?.refundInfo?.accountNumber || refundData?.accountNumber || 'Chưa có thông tin'}
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium text-amber-700">Chủ tài khoản:</span>
                                  <div className="text-amber-600">
                                    {refundData?.refundInfo?.accountHolderName || refundData?.accountHolderName || 'Chưa có thông tin'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-amber-100 p-3 rounded border text-center">
                              <div className="text-sm text-amber-600">
                                Đang chờ xử lý yêu cầu hoàn tiền. Thông tin chi tiết sẽ được cập nhật sau.
                              </div>
                            </div>
                          )}
                          
                          {refundData?.processedAt && (
                            <div className="text-xs text-amber-600 text-center border-t border-amber-200 pt-2">
                              <span className="font-medium">Cập nhật lần cuối:</span> {formatDate(refundData.processedAt)}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}



              {/* Cancellation Info */}
              {canCancel(selectedAppointment) && (
                <div>
                  {canCancelWithRefund(selectedAppointment) ? (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <p className="text-sm text-green-700">
                        <TickCircle size={16} className="inline mr-1" />
                        Còn {Math.floor(getHoursUntilAppointment(selectedAppointment))} giờ. Bạn có thể hủy lịch hẹn và được hoàn tiền.
                      </p>
                    </div>
                  ) : (
                    // ✅ FIX BUG 1: Chỉ hiển thị warning hoàn tiền khi đã thanh toán
                    selectedAppointment.paymentStatus === 'paid' ? (
                      <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                        <p className="text-sm text-orange-700">
                          <Warning2 size={16} className="inline mr-1" />
                          Bạn có thể hủy lịch hẹn này, nhưng không được hoàn tiền (cần hủy trước 24 giờ để hoàn tiền).
                        </p>
                      </div>
                    ) : (
                      // Lịch chưa thanh toán - không hiển thị warning về hoàn tiền
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <TickCircle size={16} className="inline mr-1" />
                          Bạn có thể hủy lịch hẹn này mà không mất phí (chưa thanh toán).
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Doctor Info */}
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Bác sĩ phụ trách</label>
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedAppointment.doctorAvatar} 
                    alt={selectedAppointment.doctorName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{selectedAppointment.doctorName}</p>
                  </div>
                </div>
              </div>

              {/* Description/Question */}
              {selectedAppointment.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">
                    {selectedAppointment.type === 'consultation' ? 'Câu hỏi tư vấn' : 'Mô tả triệu chứng'}
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAppointment.description}</p>
                </div>
              )}

              {/* Notes - Only show original notes */}
              {selectedAppointment.notes && (() => {
                const { originalNotes } = parseNotes(selectedAppointment.notes);
                
                // Chỉ hiển thị ghi chú gốc (nếu có), lý do hủy đã hiển thị ở trên
                return originalNotes ? (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Ghi chú</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{originalNotes}</p>
                  </div>
                ) : null;
              })()}

              {/* ➕ Consultation-specific info */}
              {selectedAppointment.type === 'consultation' && (
                <>
                  {/* Patient Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tên bệnh nhân</label>
                      <p className="text-gray-900">{selectedAppointment.patientName || 'Không xác định'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                      <p className="text-gray-900">{selectedAppointment.phone || 'Không có'}</p>
                    </div>
                    {selectedAppointment.age && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tuổi</label>
                        <p className="text-gray-900">{selectedAppointment.age}</p>
                      </div>
                    )}
                    {selectedAppointment.gender && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Giới tính</label>
                        <p className="text-gray-900">{selectedAppointment.gender === 'male' ? 'Nam' : 'Nữ'}</p>
                      </div>
                    )}
                  </div>

                  {/* Doctor Notes */}
                  {selectedAppointment.doctorNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">Ghi chú của bác sĩ</label>
                      <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                        {selectedAppointment.doctorNotes}
                      </p>
                    </div>
                  )}

                  {/* Doctor Meeting Notes - Hiển thị ở cuối */}
                  {selectedAppointment.doctorMeetingNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">Ghi chú của bác sĩ</label>
                      <p className="text-gray-900 bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
                        {selectedAppointment.doctorMeetingNotes}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Feedback section - Hiển thị sau khi hoàn thành */}
              {selectedAppointment.status === 'completed' && (selectedAppointment.rating || selectedAppointment.feedback) && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Đánh giá dịch vụ
                  </h4>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    {selectedAppointment.rating && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Đánh giá:</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, index) => (
                            <svg 
                              key={index}
                              className={`w-4 h-4 ${index < selectedAppointment.rating! ? "text-yellow-400 fill-current" : "text-gray-300 fill-current"}`}
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                          <span className="text-sm font-medium text-gray-700 ml-1">
                            ({selectedAppointment.rating}/5)
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedAppointment.feedback && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">Nhận xét:</span>
                        <p className="text-sm text-gray-600 mt-1 italic">"{selectedAppointment.feedback}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
                
                <div className="flex gap-2">
                  {/* Nút feedback trong modal */}
                  {selectedAppointment.status === 'completed' && !selectedAppointment.rating && (
                    <button
                      onClick={() => {
                        navigate(`/feedback?appointment=${selectedAppointment.id}`);
                        setShowDetailModal(false);
                      }}
                      className="flex items-center gap-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Đánh giá
                    </button>
                  )}
                  
                  {/* Hiển thị button hủy cho tất cả appointment có thể hủy */}
                  {canCancel(selectedAppointment) && (
                  <button
                      onClick={() => handleCancelAppointment(selectedAppointment)}
                      disabled={cancelLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {cancelLoading ? 'Đang xử lý...' : 'Hủy lịch hẹn'}
                  </button>
                )}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Cancel Modal */}
        <Modal
          title="Hủy lịch hẹn"
          open={showCancelModal}
          onCancel={() => {
            setShowCancelModal(false);
            setRequestRefund(false);
            refundForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <div className="space-y-4">
            {/* ✅ FIX: Hiển thị thông tin phù hợp với từng trường hợp */}
            {selectedAppointment && canCancelWithRefund(selectedAppointment) ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                <p className="text-green-800 font-medium mb-2">
                  Hủy lịch hẹn và hoàn tiền
                </p>
                <p className="text-sm text-green-600">
                  Khi hủy lịch hẹn, tiền sẽ được hoàn lại vào tài khoản ngân hàng của bạn trong 3-5 ngày làm việc.
                </p>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                <p className="text-orange-800 font-medium mb-2">
                  Hủy lịch hẹn (không hoàn tiền)
                </p>
                <p className="text-sm text-orange-600">
                  Do hủy muộn (dưới 24 giờ), tiền sẽ không được hoàn lại nhưng vẫn cần thông tin tài khoản để xử lý.
                </p>
              </div>
            )}

            {/* Refund form - Show when payment exists */}
            {requestRefund && (
              <div>
                <h4 className="font-medium mb-3">Thông tin tài khoản nhận hoàn tiền</h4>
                <Form
                  form={refundForm}
                  layout="vertical"
                  onFinish={handleRefundFormSubmit}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label="Số tài khoản"
                      name="accountNumber"
                      rules={[
                        { required: true, message: 'Vui lòng nhập số tài khoản' }
                      ]}
                    >
                      <Input placeholder="Nhập số tài khoản" />
                    </Form.Item>

                    <Form.Item
                      label="Tên chủ tài khoản"
                      name="accountHolderName"
                      rules={[
                        { required: true, message: 'Vui lòng nhập tên chủ tài khoản' },
                        { min: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                      ]}
                    >
                      <Input placeholder="Nhập họ và tên người thụ hưởng" />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label="Ngân hàng"
                    name="bankName"
                    rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}
                  >
                    <Select placeholder="Chọn ngân hàng">
                      <Option value="VietinBank">VietinBank - Ngân hàng TMCP Công thương Việt Nam</Option>
                      <Option value="Vietcombank">Vietcombank - Ngân hàng TMCP Ngoại Thương Việt Nam</Option>
                      <Option value="BIDV">BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam</Option>
                      <Option value="Agribank">Agribank - Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam</Option>
                      <Option value="OCB">OCB - Ngân hàng TMCP Phương Đông</Option>
                      <Option value="MBBank">MBBank - Ngân hàng TMCP Quân đội</Option>
                      <Option value="Techcombank">Techcombank - Ngân hàng TMCP Kỹ thương Việt Nam</Option>
                      <Option value="ACB">ACB - Ngân hàng TMCP Á Châu</Option>
                      <Option value="VPBank">VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng</Option>
                      <Option value="TPBank">TPBank - Ngân hàng TMCP Tiên Phong</Option>
                      <Option value="Sacombank">Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín</Option>
                      <Option value="HDBank">HDBank - Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh</Option>
                      <Option value="VietCapitalBank">VietCapitalBank - Ngân hàng TMCP Bản Việt</Option>
                      <Option value="SCB">SCB - Ngân hàng TMCP Sài Gòn</Option>
                      <Option value="VIB">VIB - Ngân hàng TMCP Quốc tế Việt Nam</Option>
                      <Option value="SHB">SHB - Ngân hàng TMCP Sài Gòn - Hà Nội</Option>
                      <Option value="Eximbank">Eximbank - Ngân hàng TMCP Xuất Nhập khẩu Việt Nam</Option>
                      <Option value="MSB">MSB - Ngân hàng TMCP Hàng Hải</Option>
                      <Option value="CAKE">CAKE - TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank</Option>
                      <Option value="Ubank">Ubank - TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank</Option>
                      <Option value="Timo">Timo - Ngân hàng số Timo by Ban Viet Bank (Timo by Ban Viet Bank)</Option>
                      <Option value="SaigonBank">SaigonBank - Ngân hàng TMCP Sài Gòn Công Thương</Option>
                      <Option value="BacABank">BacABank - Ngân hàng TMCP Bắc Á</Option>
                      <Option value="PVcomBank">PVcomBank - Ngân hàng TMCP Đại Chúng Việt Nam</Option>
                      <Option value="Oceanbank">Oceanbank - Ngân hàng Thương mại TNHH MTV Đại Dương</Option>
                      <Option value="NCB">NCB - Ngân hàng TMCP Quốc Dân</Option>
                      <Option value="ShinhanBank">ShinhanBank - Ngân hàng TNHH MTV Shinhan Việt Nam</Option>
                      <Option value="ABBANK">ABBANK - Ngân hàng TMCP An Bình</Option>
                      <Option value="VietABank">VietABank - Ngân hàng TMCP Việt Á</Option>
                      <Option value="NamABank">NamABank - Ngân hàng TMCP Nam Á</Option>
                      <Option value="PGBank">PGBank - Ngân hàng TMCP Xăng dầu Petrolimex</Option>
                      <Option value="VietBank">VietBank - Ngân hàng TMCP Việt Nam Thương Tín</Option>
                      <Option value="BaoVietBank">BaoVietBank - Ngân hàng TMCP Bảo Việt</Option>
                      <Option value="SeABank">SeABank - Ngân hàng TMCP Đông Nam Á</Option>
                      <Option value="COOPBANK">COOPBANK - Ngân hàng Hợp tác xã Việt Nam</Option>
                      <Option value="LienVietPostBank">LienVietPostBank - Ngân hàng TMCP Bưu Điện Liên Việt</Option>
                      <Option value="KienLongBank">KienLongBank - Ngân hàng TMCP Kiên Long</Option>
                      <Option value="KBank">KBank - Ngân hàng Đại chúng TNHH Kasikornbank</Option>
                      <Option value="Woori">Woori - Ngân hàng TNHH MTV Woori Việt Nam</Option>
                      <Option value="CIMB">CIMB - Ngân hàng TNHH MTV CIMB Việt Nam</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Lý do hủy (tùy chọn)" name="reason">
                    <Input.TextArea 
                      placeholder="Ví dụ: Có việc đột xuất, thay đổi kế hoạch..."
                      rows={2}
                      maxLength={200}
                    />
                  </Form.Item>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCancelModal(false);
                        setRequestRefund(false);
                        refundForm.resetFields();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    
                    <button
                      type="submit"
                      disabled={cancelLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {cancelLoading ? 'Đang xử lý...' : 'Xác nhận hủy và hoàn tiền'}
                    </button>
                  </div>
                </Form>
              </div>
            )}

          </div>
        </Modal>
      </div>
    </div>
  );
};

export default BookingHistoryOptimized; 