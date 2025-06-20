import { DatePicker, Empty, Input, message, Modal, Rate, Select, Timeline } from 'antd';
import type { Dayjs } from 'dayjs';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    Calendar,
    Clock,
    CloseCircle,
    DocumentText,
    Eye,
    Heart,
    Home,
    Location,
    MonitorMobbile,
    People,
    Refresh,
    SearchNormal1,
    Star,
    TickCircle,
    Timer,
    Trash,
    User
} from 'iconsax-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi } from '../../api/endpoints';
import { consultationApi } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import ModernButton from '../../components/ui/ModernButton';
import ModernCard from '../../components/ui/ModernCard';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  packageName?: string;
  doctorName?: string;
  doctorAvatar?: string;
  appointmentDate: string;
  appointmentTime: string;
  typeLocation: string; // Backend có thể trả về bất kỳ string nào
  status: string; // Backend có thể trả về bất kỳ status nào
  price: number;
  createdAt: string;
  description?: string;
  notes?: string;
  address?: string;
  canCancel: boolean;
  canReschedule: boolean;
  rating?: number;
  feedback?: string;
}

const BookingHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');



  const fetchAppointments = async () => {
    // Kiểm tra authentication trước khi gọi API
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Phân quyền: Admin/Staff/Manager có thể xem tất cả, Customer chỉ xem của mình
      const isManagementRole = ['admin', 'staff', 'manager'].includes(user.role);
      
      let response;
      if (isManagementRole) {
        // Lấy tất cả appointments không phân trang
        response = await appointmentApi.getAllAppointments({ limit: 100 });
      } else {
        response = await consultationApi.getUserAppointments({ createdByUserId: user._id });
      }
      
      // Handle different response structures for different APIs
      let appointmentsData = [];
      
      if (isManagementRole) {
        // appointmentApi.getAllAppointments() response structure: { success: true, data: { appointments, pagination } }
        appointmentsData = response.data?.appointments || [];
      } else {
        // consultationApi.getUserAppointments() response structure  
        appointmentsData = response.data?.data?.appointments || response.data?.appointments || [];
      }

      if (appointmentsData && appointmentsData.length >= 0) {
        const formattedAppointments = appointmentsData.map((apt: {
          _id: string;
          serviceId?: { _id: string; serviceName: string; price: number };
          packageId?: { name: string; price: number };
          doctorId?: { 
            _id: string;
            userId?: { fullName: string; avatar: string; email: string };
            fullName?: string; 
            avatar?: string; 
          };
          appointmentDate: string;
          appointmentTime: string;
          typeLocation: string;
          status: string;
          createdAt: string;
          description?: string;
          notes?: string;
          address?: string;
          rating?: number;
          feedback?: string;
        }) => ({
          id: apt._id,
          serviceId: apt.serviceId?._id || '',
          serviceName: apt.serviceId?.serviceName || apt.packageId?.name || 'Dịch vụ không xác định',
          packageName: apt.packageId?.name,
          doctorName: (() => {
            // Kiểm tra các trường hợp khác nhau
            if (!apt.doctorId) {
              return 'Chưa chỉ định bác sĩ';
            }
            
            // Trường hợp doctorId là string (chưa populate)
            if (typeof apt.doctorId === 'string') {
              return 'Chưa chỉ định bác sĩ';
            }
            
            // Trường hợp doctorId đã được populate
            if (apt.doctorId.userId?.fullName) {
              return apt.doctorId.userId.fullName;
            }
            
            // Trường hợp fallback với fullName trực tiếp
            if (apt.doctorId.fullName) {
              return apt.doctorId.fullName;
            }
            
            return 'Chưa chỉ định bác sĩ';
          })(),
          doctorAvatar: (() => {
              if (!apt.doctorId || typeof apt.doctorId === 'string') {
                return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150';
              }
              return apt.doctorId.userId?.avatar || apt.doctorId.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150';
            })(),
          appointmentDate: new Date(apt.appointmentDate).toISOString().split('T')[0],
          appointmentTime: apt.appointmentTime,
          typeLocation: apt.typeLocation as string,
          status: apt.status as string, // Giữ nguyên status từ database theo ERD
          price: apt.packageId?.price || apt.serviceId?.price || 0,
          createdAt: new Date(apt.createdAt).toISOString(),
          description: apt.description,
          notes: apt.notes,
          address: apt.address,
          canCancel: ['pending', 'confirmed'].includes(apt.status),
          canReschedule: ['pending', 'confirmed'].includes(apt.status),
          rating: apt.rating,
          feedback: apt.feedback
        }));

        setAppointments(formattedAppointments);
        setFilteredAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('❌ [Debug] Error fetching appointments:', error);
      
      // 🔥 HIỂN THỊ LỖI CHI TIẾT THAY VÌ FALLBACK TO MOCK DATA
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          navigate('/login');
          return;
        } else if (error.response?.status === 403) {
          message.error('Bạn không có quyền truy cập dữ liệu này.');
        } else if (error.response?.status === 404) {
          message.error('API endpoint không tồn tại.');
        } else if (error.response?.status >= 500) {
          message.error('Lỗi server. Vui lòng thử lại sau.');
        } else {
          message.error(`Lỗi API: ${error.response?.data?.message || error.message}`);
        }
      } else {
        message.error('Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng.');
      }
      
      // Set empty array when API error occurs
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Listen for focus event to refresh data when returning from payment page
  useEffect(() => {
    const handleFocus = () => {
      fetchAppointments();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    let filtered = appointments;

    // Filter by search term
    if (searchText) {
      filtered = filtered.filter(apt =>
        apt.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
        apt.doctorName?.toLowerCase().includes(searchText.toLowerCase()) ||
        apt.packageName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Filter by service
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(apt => apt.serviceId === serviceFilter);
    }

    // Filter by date range
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        const start = startDate.toDate();
        const end = endDate.toDate();
        return aptDate >= start && aptDate <= end;
      });
    }

    setFilteredAppointments(filtered);
  }, [searchText, statusFilter, serviceFilter, dateRange, appointments]);

  const statusConfig = {
    pending: { color: '#faad14', text: 'Chờ xác nhận', icon: <Timer size={16} /> },
    confirmed: { color: '#52c41a', text: 'Đã xác nhận', icon: <TickCircle size={16} /> },
    completed: { color: '#722ed1', text: 'Hoàn thành', icon: <TickCircle size={16} /> },
    cancelled: { color: '#f5222d', text: 'Đã hủy', icon: <Trash size={16} /> }
  };

  const locationConfig = {
    online: { icon: <MonitorMobbile size={16} />, text: 'Online' },
    Online: { icon: <MonitorMobbile size={16} />, text: 'Online' }, // Backend trả về "Online" với O hoa
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

  const handleCancel = async (appointment: Appointment) => {
    try {
      // Hiển thị loading message
      const loadingMessage = message.loading('Đang hủy lịch hẹn...', 0);
      

      
      // Gọi API hủy lịch - API mới đã được cập nhật để tự động trả lại slot trống
      const response = await appointmentApi.deleteAppointment(appointment.id);
      
      // Đóng loading message
      loadingMessage();
      
      if (response.success) {
        message.success({
          content: 'Hủy cuộc hẹn thành công! Lịch đã được trả lại.',
          icon: <TickCircle size={20} className="text-green-500" />,
          duration: 5
        });
        
        // Cập nhật UI - đánh dấu lịch hẹn đã hủy
        const updatedAppointments = appointments.map(apt => 
          apt.id === appointment.id ? { ...apt, status: 'cancelled' as const, canCancel: false, canReschedule: false } : apt
        );
        setAppointments(updatedAppointments);
        setFilteredAppointments(
          filteredAppointments.map(apt => 
            apt.id === appointment.id ? { ...apt, status: 'cancelled' as const, canCancel: false, canReschedule: false } : apt
          )
        );
      } else {
        // Xử lý trường hợp API trả về thành công nhưng không có success flag
        message.success({
          content: 'Hủy cuộc hẹn thành công! Lịch đã được trả lại.',
          icon: <TickCircle size={20} className="text-green-500" />,
          duration: 5
        });
        
        // Vẫn cập nhật UI
        const updatedAppointments = appointments.map(apt => 
          apt.id === appointment.id ? { ...apt, status: 'cancelled' as const, canCancel: false, canReschedule: false } : apt
        );
        setAppointments(updatedAppointments);
        setFilteredAppointments(
          filteredAppointments.map(apt => 
            apt.id === appointment.id ? { ...apt, status: 'cancelled' as const, canCancel: false, canReschedule: false } : apt
          )
        );
      }
    } catch (error) {
      console.error('❌ [Debug] Error cancelling appointment:', error);
      
      // Trích xuất thông báo lỗi chi tiết từ API response
      let errorMessage = 'Có lỗi xảy ra khi hủy cuộc hẹn. Vui lòng thử lại!';
      let errorType = 'general';
      
      if (axios.isAxiosError(error) && error.response?.data) {
        // Trường hợp lỗi validation từ backend (400)
        if (error.response.status === 400 && error.response.data.errors) {
          const errorObj = error.response.data.errors;
          // Lấy message lỗi đầu tiên tìm được
          const firstErrorKey = Object.keys(errorObj)[0];
          const firstErrorMessage = Object.values(errorObj)[0];
          if (firstErrorMessage) {
            errorMessage = firstErrorMessage as string;
            errorType = firstErrorKey;

          }
        } 
        // Trường hợp lỗi quyền truy cập (403)
        else if (error.response.status === 403) {
          errorMessage = 'Bạn không có quyền hủy lịch hẹn này';
          errorType = 'permission';
        }
        // Trường hợp có message lỗi trong response
        else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      // Hiển thị Modal thông báo thay vì message cho thông tin chi tiết hơn
      if (errorType === 'time') {
        Modal.error({
          title: 'Chưa thể hủy lịch',
          content: (
            <div>
              <p>{errorMessage}</p>
              <p className="mt-2">Bạn cần đợi đủ 10 phút sau khi đặt lịch mới có thể hủy.</p>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium">Lưu ý:</p>
                <p className="text-yellow-700">Quy định này nhằm đảm bảo bạn có đủ thời gian cân nhắc trước khi quyết định hủy lịch, giúp hệ thống hoạt động ổn định.</p>
              </div>
            </div>
          ),
          okText: 'Đã hiểu',
          className: 'custom-error-modal'
        });
      } 
      // Các lỗi khác hiển thị thông báo thông thường
      else {
        message.error({
          content: errorMessage,
          icon: <CloseCircle size={20} className="text-red-500" />,
          duration: 5
        });
      }
    } finally {
      // Đóng modal và reset selected appointment
      setShowDetailModal(false);
      setSelectedAppointment(null);
      
      // Làm mới danh sách lịch hẹn sau 1 giây
      setTimeout(() => {
        fetchAppointments();
      }, 1000);
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    navigate(`/booking?reschedule=${appointment.id}&service=${appointment.serviceId}`);
  };

  // const handleRebook = (appointment: Appointment) => {
  //   navigate(`/booking?service=${appointment.serviceId}`);
  // };

  // const confirmCancel = () => {
  //   // API call to cancel appointment
  //   console.log('Cancelling appointment:', selectedAppointment?.id);
  //   setShowDetailModal(false);
  //   setSelectedAppointment(null);
  // };

  const handleFeedback = (appointment: Appointment) => {
    navigate(`/feedback?appointment=${appointment.id}`);
  };

  const handlePayment = (appointment: Appointment) => {
    // Redirect đến trang thanh toán với thông tin appointment
    const paymentUrl = `/payment?appointmentId=${appointment.id}&amount=${appointment.price}&service=${encodeURIComponent(appointment.serviceName)}`;
    navigate(paymentUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" 
           style={{
             background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f0fdfa 50%, #ecfdf5 75%, #f0f9ff 100%)'
           }}>
        
        {/* Medical Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-teal-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center relative z-10"
        >
          {/* Medical Loading Animation */}
          <div className="relative mb-8">
            {/* Outer Ring - Pulse Effect */}
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 w-24 h-24 mx-auto border-4 border-teal-200 rounded-full"
            />
            
            {/* Middle Ring - Rotating */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute inset-2 w-20 h-20 mx-auto border-4 border-transparent border-t-[#006478] border-r-[#00A693] rounded-full"
            />
            
            {/* Inner Heart Icon with Heartbeat */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 1.2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-24 h-24 mx-auto flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-12 h-12 bg-gradient-to-br from-[#006478] to-[#00A693] rounded-full flex items-center justify-center shadow-lg"
              >
                <Heart size={24} className="text-white" variant="Bold" />
              </motion.div>
            </motion.div>
          </div>

          {/* Loading Text with Medical Theme */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-3"
          >
            <h3 className="text-2xl font-bold text-[#006478] mb-2">
              Đang tải thông tin y tế
            </h3>
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[#00A693] font-medium text-lg"
            >
              Lịch sử khám và tư vấn sức khỏe
            </motion.p>
            
            {/* Medical Progress Indicator */}
            <div className="mt-6 w-64 mx-auto">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    repeatType: "reverse"
                  }}
                  className="h-full w-1/3 bg-gradient-to-r from-[#006478] to-[#00A693] rounded-full"
                />
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Bảo mật thông tin y tế của bạn là ưu tiên hàng đầu
              </p>
            </div>

            {/* Medical Icons Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex justify-center items-center gap-6 mt-8"
            >
              {[
                { icon: Activity, delay: 0 },
                { icon: People, delay: 0.2 },
                { icon: MonitorMobbile, delay: 0.4 }
              ].map(({ icon: Icon, delay }, index) => (
                <motion.div
                  key={index}
                  animate={{ 
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    delay: delay,
                    ease: "easeInOut"
                  }}
                  className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
                >
                  <Icon size={20} className="text-[#006478]" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Lịch sử Đặt lịch
              </h1>
              <p className="text-xl text-gray-600">
                {user && ['admin', 'staff', 'manager'].includes(user.role) 
                  ? `Quản lý tất cả các lịch hẹn trong hệ thống (${user.role.toUpperCase()})`
                  : 'Quản lý và theo dõi tất cả các lịch hẹn của bạn'
                }
              </p>
              {user && ['admin', 'staff', 'manager'].includes(user.role) && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    🛡️ Quyền quản lý: {user.role.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Có thể xem và quản lý lịch hẹn của tất cả người dùng
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <ModernButton
                variant="primary"
                icon={<Calendar size={20} />}
                onClick={() => navigate('/booking')}
              >
                Đặt lịch mới
              </ModernButton>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col lg:flex-row gap-4 items-center"
          >
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Search
                placeholder="Tìm kiếm theo tên dịch vụ, bệnh nhân hoặc mã đặt lịch..."
                size="large"
                prefix={<SearchNormal1 size={20} className="text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              size="large"
              className="min-w-[150px]"
              placeholder="Trạng thái"
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>

            {/* Service Filter */}
            <Select
              value={serviceFilter}
              onChange={setServiceFilter}
              size="large"
              className="min-w-[150px]"
              placeholder="Dịch vụ"
            >
              <Option value="all">Tất cả dịch vụ</Option>
              <Option value="consultation">Tư vấn sức khỏe</Option>
              <Option value="sti-testing">Xét nghiệm STI/STD</Option>
              <Option value="health-checkup">Khám sức khỏe</Option>
              <Option value="cycle-tracking">Theo dõi chu kỳ</Option>
            </Select>

            {/* Date Range */}
            <RangePicker
              size="large"
              placeholder={['Từ ngày', 'Đến ngày']}
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                } else {
                  setDateRange(null);
                }
              }}
              format="DD/MM/YYYY"
            />

            {/* View Mode Toggle - Only show on desktop */}
            <div className="hidden lg:flex items-center gap-2 border rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded transition-colors ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                title="Xem dạng bảng"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded transition-colors ${viewMode === 'cards' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                title="Xem dạng thẻ"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"/>
                </svg>
              </button>
            </div>

            {/* Clear Filters */}
            {(searchText || statusFilter !== 'all' || serviceFilter !== 'all' || dateRange) && (
              <ModernButton
                variant="outline"
                icon={<CloseCircle size={20} />}
                onClick={() => {
                  setSearchText('');
                  setStatusFilter('all');
                  setServiceFilter('all');
                  setDateRange(null);
                }}
              >
                Xóa bộ lọc
              </ModernButton>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          {[
            {
              label: 'Tổng lịch hẹn',
              value: appointments.length,
              color: 'blue',
              icon: <Calendar size={24} />
            },
            {
              label: 'Hoàn thành',
              value: appointments.filter(a => a.status === 'completed').length,
              color: 'green',
              icon: <TickCircle size={24} />
            },
            {
              label: 'Đã xác nhận', 
              value: appointments.filter(a => a.status === 'confirmed').length,
              color: 'green',
              icon: <TickCircle size={24} />
            },
            {
              label: 'Đã hủy',
              value: appointments.filter(a => a.status === 'cancelled').length,
              color: 'red',
              icon: <Trash size={24} />
            }
          ].map((stat, index) => (
            <ModernCard key={index} variant="default" className="text-center">
              <div className={`text-${stat.color}-500 flex justify-center mb-3`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </ModernCard>
          ))}
        </motion.div>

        {/* Appointments List */}
        <AnimatePresence>
          {filteredAppointments.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {viewMode === 'table' ? (
                /* Table View - Desktop Only */
                <div className="hidden lg:block bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-semibold text-gray-900">Dịch vụ</th>
                          <th className="text-left p-4 font-semibold text-gray-900">Ngày & Giờ</th>
                          <th className="text-left p-4 font-semibold text-gray-900">Bác sĩ</th>
                          <th className="text-left p-4 font-semibold text-gray-900">Hình thức</th>
                          <th className="text-left p-4 font-semibold text-gray-900">Trạng thái</th>
                          <th className="text-left p-4 font-semibold text-gray-900">Chi phí</th>
                          <th className="text-right p-4 font-semibold text-gray-900">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((appointment, index) => (
                          <motion.tr
                            key={appointment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            {/* Service */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                  <Heart size={16} className="text-white" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 mb-1">
                                    {appointment.serviceName}
                                  </div>
                                  {appointment.packageName && (
                                    <div className="text-sm text-blue-600">
                                      {appointment.packageName}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 font-mono">
                                    ID: {appointment.id.slice(-8)}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Date & Time */}
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                  <Calendar size={14} />
                                  {formatDate(appointment.appointmentDate)}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock size={14} />
                                  {appointment.appointmentTime}
                                </div>
                              </div>
                            </td>

                            {/* Doctor */}
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  {appointment.doctorAvatar ? (
                                    <img 
                                      src={appointment.doctorAvatar} 
                                      alt={appointment.doctorName} 
                                      className="w-full h-full rounded-full object-cover"
                                    />
                                  ) : (
                                    <User size={14} className="text-gray-500" />
                                  )}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {appointment.doctorName}
                                </div>
                              </div>
                            </td>

                            {/* Location */}
                            <td className="p-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                {locationConfig[appointment.typeLocation]?.icon || <Location size={14} />}
                                <span>{locationConfig[appointment.typeLocation]?.text || appointment.typeLocation}</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-4">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${statusConfig[appointment.status]?.color}20`,
                                  color: statusConfig[appointment.status]?.color
                                }}
                              >
                                {statusConfig[appointment.status]?.icon}
                                {statusConfig[appointment.status]?.text}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="p-4">
                              <div className="text-right">
                                <div className="font-bold text-blue-600">
                                  {formatPrice(appointment.price)}
                                </div>
                                {appointment.rating && (
                                  <div className="flex items-center gap-1 justify-end mt-1">
                                    <Star size={12} className="text-yellow-400 fill-current" />
                                    <span className="text-xs text-gray-500">{appointment.rating}/5</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-4">
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={() => handleViewDetail(appointment)}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Xem chi tiết"
                                >
                                  <Eye size={16} />
                                </button>

                                {appointment.canReschedule && (
                                  <button
                                    onClick={() => handleReschedule(appointment)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Đổi lịch"
                                  >
                                    <Refresh size={16} />
                                  </button>
                                )}



                                {appointment.canCancel && (
                                  <button
                                    onClick={() => {
                                      Modal.confirm({
                                        title: 'Xác nhận hủy lịch',
                                        content: 'Bạn có chắc chắn muốn hủy lịch hẹn này?',
                                        okText: 'Đồng ý',
                                        okButtonProps: { danger: true },
                                        cancelText: 'Hủy',
                                        onOk: () => handleCancel(appointment)
                                      });
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hủy lịch"
                                  >
                                    <Trash size={16} />
                                  </button>
                                )}

                                {appointment.status === 'completed' && !appointment.rating && (
                                  <button
                                    onClick={() => handleFeedback(appointment)}
                                    className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                    title="Đánh giá"
                                  >
                                    <Star size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
              
              {/* Mobile/Tablet Cards View - Always show on smaller screens */}
              <div className="lg:hidden space-y-4">
                {filteredAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      {/* Mobile Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Heart size={16} className="text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-900 text-sm truncate">
                              {appointment.serviceName}
                            </h3>
                            {appointment.packageName && (
                              <p className="text-blue-600 text-xs font-medium truncate">
                                {appointment.packageName}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2"
                          style={{
                            backgroundColor: `${statusConfig[appointment.status]?.color}20`,
                            color: statusConfig[appointment.status]?.color
                          }}
                        >
                          {statusConfig[appointment.status]?.icon}
                          <span className="hidden sm:inline">{statusConfig[appointment.status]?.text}</span>
                        </span>
                      </div>

                      {/* Mobile Content - 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={12} />
                            <span className="text-xs">{formatDate(appointment.appointmentDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={12} />
                            <span className="text-xs">{appointment.appointmentTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User size={12} />
                            <span className="text-xs truncate">{appointment.doctorName}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {locationConfig[appointment.typeLocation]?.icon || <Location size={12} />}
                            <span className="text-xs">{locationConfig[appointment.typeLocation]?.text || appointment.typeLocation}</span>
                          </div>
                          <div className="text-right sm:text-left">
                            <div className="text-lg font-bold text-blue-600">
                              {formatPrice(appointment.price)}
                            </div>
                            {appointment.rating && (
                              <div className="flex items-center gap-1 justify-end sm:justify-start">
                                <Star size={12} className="text-yellow-400 fill-current" />
                                <span className="text-xs text-gray-500">{appointment.rating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t">
                        <button
                          onClick={() => handleViewDetail(appointment)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Eye size={12} />
                          <span>Chi tiết</span>
                        </button>

                        {appointment.canReschedule && (
                          <button
                            onClick={() => handleReschedule(appointment)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                          >
                            <Refresh size={12} />
                            <span>Đổi lịch</span>
                          </button>
                        )}



                        {appointment.canCancel && (
                          <button
                            onClick={() => {
                              Modal.confirm({
                                title: 'Xác nhận hủy lịch',
                                content: 'Bạn có chắc chắn muốn hủy lịch hẹn này?',
                                okText: 'Đồng ý',
                                okButtonProps: { danger: true },
                                cancelText: 'Hủy',
                                onOk: () => handleCancel(appointment)
                              });
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                          >
                            <Trash size={12} />
                            <span>Hủy</span>
                          </button>
                        )}

                        {appointment.status === 'completed' && !appointment.rating && (
                          <button
                            onClick={() => handleFeedback(appointment)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors"
                          >
                            <Star size={12} />
                            <span>Đánh giá</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Cards View - Only show when cards mode is selected */}
              {viewMode === 'cards' && (
                <div className="hidden lg:block space-y-4">
                  {filteredAppointments.map((appointment, index) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                              <Heart size={20} className="text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 mb-1">
                                {appointment.serviceName}
                              </h3>
                              {appointment.packageName && (
                                <p className="text-blue-600 text-sm font-medium">
                                  {appointment.packageName}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 font-mono">
                                ID: {appointment.id.slice(-8)}
                              </p>
                            </div>
                          </div>
                          <span
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: `${statusConfig[appointment.status]?.color}20`,
                              color: statusConfig[appointment.status]?.color
                            }}
                          >
                            {statusConfig[appointment.status]?.icon}
                            {statusConfig[appointment.status]?.text}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar size={14} />
                              <span>{formatDate(appointment.appointmentDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock size={14} />
                              <span>{appointment.appointmentTime}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User size={14} />
                              <span>{appointment.doctorName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {locationConfig[appointment.typeLocation]?.icon || <Location size={14} />}
                              <span>{locationConfig[appointment.typeLocation]?.text || appointment.typeLocation}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-600 mb-1">
                              {formatPrice(appointment.price)}
                            </div>
                            {appointment.rating && (
                              <div className="flex items-center gap-1 justify-end">
                                <Rate disabled defaultValue={appointment.rating} className="text-xs" />
                                <span className="text-xs text-gray-500">({appointment.rating}/5)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end pt-4 border-t">
                          <ModernButton
                            variant="outline"
                            className="text-sm"
                            icon={<Eye size={14} />}
                            onClick={() => handleViewDetail(appointment)}
                          >
                            Chi tiết
                          </ModernButton>

                          {appointment.canReschedule && (
                            <ModernButton
                              variant="outline"
                              className="text-sm"
                              icon={<Refresh size={14} />}
                              onClick={() => handleReschedule(appointment)}
                            >
                              Đổi lịch
                            </ModernButton>
                          )}



                          {appointment.canCancel && (
                            <ModernButton
                              variant="danger"
                              className="text-sm"
                              icon={<Trash size={14} />}
                              onClick={() => {
                                Modal.confirm({
                                  title: 'Xác nhận hủy lịch',
                                  content: 'Bạn có chắc chắn muốn hủy lịch hẹn này?',
                                  okText: 'Đồng ý',
                                  okButtonProps: { danger: true },
                                  cancelText: 'Hủy',
                                  onOk: () => handleCancel(appointment)
                                });
                              }}
                            >
                              Hủy lịch
                            </ModernButton>
                          )}

                          {appointment.status === 'completed' && !appointment.rating && (
                            <ModernButton
                              variant="primary"
                              className="text-sm"
                              icon={<Star size={14} />}
                              onClick={() => handleFeedback(appointment)}
                            >
                              Đánh giá
                            </ModernButton>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Empty
                description={
                  <div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Không tìm thấy lịch hẹn nào
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchText || statusFilter !== 'all' || serviceFilter !== 'all' || dateRange
                        ? 'Hãy thử thay đổi bộ lọc tìm kiếm'
                        : 'Bạn chưa có lịch hẹn nào. Hãy đặt lịch ngay!'
                      }
                    </p>
                    <ModernButton
                      variant="primary"
                      icon={<Calendar size={20} />}
                      onClick={() => navigate('/booking')}
                    >
                      Đặt lịch ngay
                    </ModernButton>
                  </div>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
            {/* Service Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Heart size={20} className="text-blue-500" />
                Thông tin dịch vụ
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dịch vụ:</span>
                  <span className="font-medium">{selectedAppointment.serviceName}</span>
                </div>
                {selectedAppointment.packageName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gói:</span>
                    <span className="font-medium">{selectedAppointment.packageName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày hẹn:</span>
                  <span className="font-medium">{formatDate(selectedAppointment.appointmentDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giờ hẹn:</span>
                  <span className="font-medium">{selectedAppointment.appointmentTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hình thức:</span>
                  <span className="font-medium">{locationConfig[selectedAppointment.typeLocation]?.text || selectedAppointment.typeLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chi phí:</span>
                  <span className="font-medium text-blue-600">{formatPrice(selectedAppointment.price)}</span>
                </div>
              </div>
            </div>

            {/* Doctor Info */}
            {selectedAppointment.doctorName && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User size={20} className="text-green-500" />
                  Bác sĩ phụ trách
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedAppointment.doctorAvatar ? (
                        <img
                          src={selectedAppointment.doctorAvatar}
                          alt={selectedAppointment.doctorName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        selectedAppointment.doctorName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedAppointment.doctorName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Bác sĩ chuyên khoa
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            {selectedAppointment.address && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Location size={20} className="text-orange-500" />
                  Địa chỉ
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedAppointment.address}</p>
                </div>
              </div>
            )}

            {/* Description & Notes */}
            {(selectedAppointment.description || selectedAppointment.notes) && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DocumentText size={20} className="text-purple-500" />
                  Ghi chú
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {selectedAppointment.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                      <p className="text-gray-700">{selectedAppointment.description}</p>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Ghi chú:</span>
                      <p className="text-gray-700">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity size={20} className="text-indigo-500" />
                Trạng thái
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <Timeline
                  items={[
                    {
                      color: 'green',
                      children: `Đặt lịch - ${formatDate(selectedAppointment.createdAt)}`
                    },
                    ...(selectedAppointment.status !== 'cancelled' ? [
                      {
                        color: selectedAppointment.status === 'pending' ? 'blue' : 'green',
                        children: selectedAppointment.status === 'pending' ? 'Chờ xác nhận' : 'Đã xác nhận'
                      }
                    ] : []),
                    ...(selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'in_progress' || selectedAppointment.status === 'completed' ? [
                      {
                        color: 'green',
                        children: 'Đã thanh toán & xác nhận'
                      }
                    ] : []),
                    ...(selectedAppointment.status === 'completed' ? [
                      {
                        color: 'green',
                        children: 'Hoàn thành'
                      }
                    ] : []),
                    ...(selectedAppointment.status === 'cancelled' ? [
                      {
                        color: 'red',
                        children: 'Đã hủy'
                      }
                    ] : [])
                  ]}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingHistory; 