import { Input, message, Modal, Pagination, Select, Tag, Form, Checkbox } from 'antd';
import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    CloseCircle,
    Eye,
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
import { consultationApi } from '../../api';
import { appointmentApi } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';

const { Search } = Input;
const { Option } = Select;

interface RawAppointmentData {
  _id: string;
  type?: string;
  serviceId?: string;
  serviceName?: string;
  packageName?: string;
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
  paymentStatus?: string;
}

interface Appointment {
  id: string;
  type?: 'appointment' | 'consultation';
  serviceId: string;
  serviceName: string;
  packageName?: string;
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
  paymentStatus?: string;
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
  const [showRefundForm, setShowRefundForm] = useState(false);
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

      console.log('📋 [BookingHistory] Fetched data:', { 
        isManagementRole, 
        dataLength: appointmentsData.length,
        responseStructure: Object.keys(response.data || {}),
        sampleItem: appointmentsData[0] 
      });

      if (appointmentsData && appointmentsData.length >= 0) {
        const formattedAppointments = appointmentsData.map((apt: RawAppointmentData) => {
          // ✅ Infer paymentStatus từ status nếu không có sẵn
          let paymentStatus = apt.paymentStatus;
          const originalPaymentStatus = apt.paymentStatus;
          
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
            
            console.log('💰 [PaymentStatus Inferred]:', {
              appointmentId: apt._id,
              serviceName: apt.serviceName,
              status: apt.status,
              originalPaymentStatus: originalPaymentStatus,
              inferredPaymentStatus: paymentStatus
            });
          }

          return {
            id: apt._id,
            type: (apt.type as 'appointment' | 'consultation') || 'appointment',
            serviceId: apt.serviceId || '',
            serviceName: apt.serviceName || 'Dịch vụ không xác định',
            packageName: apt.packageName,
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
            paymentStatus: paymentStatus
          };
        });

        console.log('✅ [BookingHistory] Formatted appointments:', {
          total: formattedAppointments.length,
          appointments: formattedAppointments.filter(a => a.type === 'appointment').length,
          consultations: formattedAppointments.filter(a => a.type === 'consultation').length,
          sampleFormatted: formattedAppointments[0]
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
    payment_cancelled: { color: '#ff4d4f', text: 'Hủy thanh toán', icon: <CloseCircle size={16} /> }
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

  // Helper function to check if appointment can be cancelled (ALWAYS except cancelled/completed)
  const canCancel = (appointment: Appointment): boolean => {
    return !['cancelled', 'completed'].includes(appointment.status);
  };

  // Helper function to check if appointment can be cancelled with refund (24h rule)
  const canCancelWithRefund = (appointment: Appointment): boolean => {
    // Chỉ cho phép hoàn tiền nếu đã thanh toán
    if (appointment.paymentStatus !== 'paid') {
      return false;
    }

    if (!appointment.appointmentDate) {
      return false;
    }

    // Sử dụng appointmentTime hoặc appointmentSlot, fallback về "00:00" nếu không có
    const timeSlot = appointment.appointmentTime || appointment.appointmentSlot || "00:00";
    
    // Parse date more robustly
    let appointmentDateTime: Date;
    try {
      // Nếu appointmentDate đã là ISO string, parse trực tiếp
      if (appointment.appointmentDate.includes('T')) {
        appointmentDateTime = new Date(appointment.appointmentDate);
      } else {
        // Nếu là date string đơn giản, nối với time
        const dateTimeString = appointment.appointmentDate + 'T' + timeSlot;
        appointmentDateTime = new Date(dateTimeString);
      }
    } catch {
      return false;
    }
    
    // Kiểm tra xem date có hợp lệ không
    if (isNaN(appointmentDateTime.getTime())) {
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
    
    // Parse date more robustly
    let appointmentDateTime: Date;
    try {
      // Nếu appointmentDate đã là ISO string, parse trực tiếp
      if (appointment.appointmentDate.includes('T')) {
        appointmentDateTime = new Date(appointment.appointmentDate);
      } else {
        // Nếu là date string đơn giản, nối với time
        appointmentDateTime = new Date(appointment.appointmentDate + 'T' + timeSlot);
      }
    } catch {
      return 0;
    }
    
    // Kiểm tra xem date có hợp lệ không
    if (isNaN(appointmentDateTime.getTime())) {
      return 0;
    }
    
    const currentTime = new Date();
    return (appointmentDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
  };

  // Handle cancel appointment - show cancel modal first
  const handleCancelAppointment = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRequestRefund(false);
    setShowRefundForm(false);
    setShowCancelModal(true);
  };

  // Handle refund checkbox change
  const handleRefundCheckboxChange = (checked: boolean) => {
    setRequestRefund(checked);
    setShowRefundForm(checked);
    if (!checked) {
      refundForm.resetFields();
    }
  };

  // Handle final cancellation
  const handleFinalCancel = async (refundInfo?: RefundInfo) => {
    if (!selectedAppointment) return;

    try {
      setCancelLoading(true);
      
      if (selectedAppointment.type === 'consultation') {
        await consultationApi.cancelConsultationByUser(
          selectedAppointment.id, 
          `Hủy bởi người dùng. ${refundInfo?.reason || ''}`
        );
      } else {
        if (requestRefund && refundInfo) {
          // Call API with refund information
          await appointmentApi.cancelAppointmentWithRefund(
            selectedAppointment.id, 
            refundInfo.reason || 'Hủy bởi người dùng',
            refundInfo
          );
        } else {
          // Call regular cancel API (no refund)
          await appointmentApi.deleteAppointment(selectedAppointment.id);
        }
      }
      
      const successMessage = requestRefund 
        ? 'Hủy lịch hẹn thành công! Tiền sẽ được hoàn lại trong 3-5 ngày làm việc.'
        : 'Hủy lịch hẹn thành công!';
      
      message.success(successMessage);
      
      // Update local state
      const updatedAppointments = appointments.map(apt => 
        apt.id === selectedAppointment.id 
          ? { 
              ...apt, 
              status: 'cancelled', 
              canCancel: false, 
              canReschedule: false, 
              paymentStatus: requestRefund ? 'refunded' : apt.paymentStatus
            } 
          : apt
      );
      setAppointments(updatedAppointments);
      setFilteredAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { 
              ...apt, 
              status: 'cancelled', 
              canCancel: false, 
              canReschedule: false, 
              paymentStatus: requestRefund ? 'refunded' : apt.paymentStatus
            } 
          : apt
      ));
      
      setShowDetailModal(false);
      setShowCancelModal(false);
      setShowRefundForm(false);
      setRequestRefund(false);
      refundForm.resetFields();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      message.error('Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle refund form submission
  const handleRefundFormSubmit = async (refundInfo: RefundInfo) => {
    handleFinalCancel(refundInfo);
  };

  // Handle cancel without refund
  const handleCancelWithoutRefund = () => {
    handleFinalCancel();
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
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.serviceName}
                        </h3>
                        
                        {/* ➕ Service Type Badge */}
                        <Tag 
                          color={appointment.type === 'consultation' ? '#1890ff' : '#52c41a'}
                          className="text-xs"
                        >
                          {appointment.type === 'consultation' ? ' Tư vấn online' : ' Dịch vụ khám'}
                        </Tag>

                        <Tag
                          color={statusConfig[appointment.status as keyof typeof statusConfig]?.color}
                          className="flex items-center gap-1"
                        >
                          {statusConfig[appointment.status as keyof typeof statusConfig]?.icon}
                          {statusConfig[appointment.status as keyof typeof statusConfig]?.text}
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
                      <button
                        onClick={() => handleViewDetail(appointment)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Quick actions for pending appointments */}
                  {appointment.status === 'pending_payment' && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-orange-600 font-medium">
                           Cần thanh toán để xác nhận lịch hẹn
                        </span>
                        <button
                          onClick={() => navigate(`/payment/process?appointmentId=${appointment.id}`)}
                          className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          Thanh toán ngay
                        </button>
                      </div>
                    </div>
                  )}
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
              showQuickJumper
              showTotal={(total, range) => 
                `${range[0]}-${range[1]} trong ${total} lịch hẹn`
              }
            />
          </div>
        )}

        {/* Detail Modal */}
        <Modal
          title="Chi tiết lịch hẹn"
          open={showDetailModal}
          onCancel={() => setShowDetailModal(false)}
          footer={null}
          width={600}
        >
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Status and Service */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{selectedAppointment.serviceName}</h3>
                  <Tag
                    color={statusConfig[selectedAppointment.status as keyof typeof statusConfig]?.color}
                    className="flex items-center gap-1"
                  >
                    {statusConfig[selectedAppointment.status as keyof typeof statusConfig]?.icon}
                    {statusConfig[selectedAppointment.status as keyof typeof statusConfig]?.text}
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
                    {selectedAppointment.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                     selectedAppointment.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 
                     'Chưa thanh toán'}
                  </p>
                </div>
              </div>

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
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                      <p className="text-sm text-orange-700">
                        <Warning2 size={16} className="inline mr-1" />
                        Bạn có thể hủy lịch hẹn này, nhưng không được hoàn tiền (cần hủy trước 24 giờ để hoàn tiền).
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!canCancel(selectedAppointment) && (
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <Warning2 size={16} className="inline mr-1" />
                    Không thể hủy lịch hẹn này (đã hoàn thành hoặc đã bị hủy).
                  </p>
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
                </>
              )}

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Ghi chú</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAppointment.notes}</p>
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
            setShowRefundForm(false);
            setRequestRefund(false);
            refundForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Bạn có chắc chắn muốn hủy lịch hẹn này không?
            </p>

            {/* Refund option for eligible appointments */}
            {selectedAppointment && canCancelWithRefund(selectedAppointment) && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <Checkbox
                  checked={requestRefund}
                  onChange={(e) => handleRefundCheckboxChange(e.target.checked)}
                  className="mb-3"
                >
                  <span className="text-green-700 font-medium">
                    Yêu cầu hoàn tiền (còn {Math.floor(getHoursUntilAppointment(selectedAppointment))} giờ)
                  </span>
                </Checkbox>
                <p className="text-sm text-green-600 ml-6">
                  Lịch hẹn này đủ điều kiện hoàn tiền vì được hủy trước 24 giờ.
                </p>
              </div>
            )}

            {/* Refund form */}
            {showRefundForm && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Thông tin hoàn tiền</h4>
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
                      <Option value="Vietcombank">Vietcombank</Option>
                      <Option value="BIDV">BIDV</Option>
                      <Option value="VietinBank">VietinBank</Option>
                      <Option value="Agribank">Agribank</Option>
                      <Option value="ACB">ACB</Option>
                      <Option value="Techcombank">Techcombank</Option>
                      <Option value="MB Bank">MB Bank</Option>
                      <Option value="VPBank">VPBank</Option>
                      <Option value="Sacombank">Sacombank</Option>
                      <Option value="Khác">Khác</Option>
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
                        setShowRefundForm(false);
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

            {/* Action buttons when no refund form */}
            {!showRefundForm && (
              <div className="flex justify-between pt-4 border-t">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setRequestRefund(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                
                <button
                  onClick={handleCancelWithoutRefund}
                  disabled={cancelLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {cancelLoading ? 'Đang xử lý...' : 'Xác nhận hủy lịch hẹn'}
                </button>
              </div>
            )}


          </div>
        </Modal>
      </div>
    </div>
  );
};

export default BookingHistoryOptimized; 