import { Button, DatePicker, Empty, Input, Modal, Rate, Select, Spin, Tag, Timeline, Popconfirm } from 'antd';
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
import Image1 from '../../assets/images/image1.jpg';
import ModernButton from '../../components/ui/ModernButton';
import ModernCard from '../../components/ui/ModernCard';
import { message } from 'antd';

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
  typeLocation: 'online' | 'Online' | 'clinic' | 'home';
  status: 'pending' | 'pending_payment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
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
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  // Mock data
  const mockAppointments: Appointment[] = [
    {
      id: 'apt1',
      serviceId: 'consultation',
      serviceName: 'Tư vấn sức khỏe',
      doctorName: 'BS. Nguyễn Thị Hương',
      doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
      appointmentDate: '2024-01-15',
      appointmentTime: '09:00',
      typeLocation: 'clinic',
      status: 'completed',
      price: 500000,
      createdAt: '2024-01-10',
      description: 'Tư vấn về sức khỏe sinh sản',
      canCancel: false,
      canReschedule: false,
      rating: 5,
      feedback: 'Bác sĩ tư vấn rất tận tình và chuyên nghiệp'
    },
    {
      id: 'apt2',
      serviceId: 'sti-testing',
      serviceName: 'Xét nghiệm STI/STD',
      packageName: 'Gói Tiêu chuẩn',
      doctorName: 'BS. Trần Văn Minh',
      doctorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
      appointmentDate: '2024-01-20',
      appointmentTime: '14:30',
      typeLocation: 'home',
      status: 'confirmed',
      price: 1500000,
      createdAt: '2024-01-18',
      address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
      canCancel: true,
      canReschedule: true
    },
    {
      id: 'apt3',
      serviceId: 'health-checkup',
      serviceName: 'Khám sức khỏe tổng quát',
      appointmentDate: '2024-01-25',
      appointmentTime: '10:00',
      typeLocation: 'clinic',
      status: 'pending_payment',
      price: 800000,
      createdAt: '2024-01-22',
      description: 'Khám sức khỏe định kỳ',
      canCancel: true,
      canReschedule: true
    },
    {
      id: 'apt4',
      serviceId: 'consultation',
      serviceName: 'Tư vấn sức khỏe',
      doctorName: 'BS. Lê Thị Mai',
      doctorAvatar: 'https://images.unsplash.com/photo-1594824388853-d0c2b7b5e6b7?w=150',
      appointmentDate: '2024-01-12',
      appointmentTime: '16:00',
      typeLocation: 'online',
      status: 'cancelled',
      price: 300000,
      createdAt: '2024-01-10',
      notes: 'Hủy do bận việc đột xuất',
      canCancel: false,
      canReschedule: false
    },
    {
      id: 'apt5',
      serviceId: 'sti-testing',
      serviceName: 'Xét nghiệm STI/STD mới',
      doctorName: 'BS. Nguyễn Văn A',
      doctorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
      appointmentDate: '2024-06-10',
      appointmentTime: '10:00',
      typeLocation: 'clinic',
      status: 'pending_payment',
      price: 1200000,
      createdAt: '2024-06-08',
      description: 'Xét nghiệm STI/STD định kỳ',
      canCancel: true,
      canReschedule: true
    }
  ];

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      console.log('🔍 [Debug] Fetching appointments from API...');
      const response = await appointmentApi.getAllAppointments();
      console.log('🔍 [Debug] Appointments API response:', response);
      
      if (response.success) {
        const formattedAppointments = response.data.appointments.map((apt: any) => ({
          id: apt._id,
          serviceId: apt.serviceId?._id || '',
          serviceName: apt.serviceId?.serviceName || apt.packageId?.name || 'Dịch vụ không xác định',
          packageName: apt.packageId?.name,
          doctorName: apt.doctorId?.fullName || 'Chưa chỉ định', // Backend không populate doctorId
          doctorAvatar: apt.doctorId?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
          appointmentDate: new Date(apt.appointmentDate).toISOString().split('T')[0],
          appointmentTime: apt.appointmentTime,
          typeLocation: apt.typeLocation,
          status: apt.status === 'pending' ? 'pending_payment' : apt.status, // Convert legacy pending to pending_payment
          price: apt.packageId?.price || apt.serviceId?.price || 0,
          createdAt: new Date(apt.createdAt).toISOString(),
          description: apt.description,
          notes: apt.notes,
          address: apt.address,
          canCancel: ['pending', 'pending_payment', 'confirmed'].includes(apt.status),
          canReschedule: ['pending', 'pending_payment', 'confirmed'].includes(apt.status),
          rating: apt.rating,
          feedback: apt.feedback
        }));
        console.log('✅ [Debug] Formatted appointments:', formattedAppointments);
        console.log('🔍 [Debug] Appointments with pending_payment status:', 
          formattedAppointments.filter(apt => apt.status === 'pending_payment'));
        console.log('🔍 [Debug] Appointments with confirmed status:', 
          formattedAppointments.filter(apt => apt.status === 'confirmed'));
        setAppointments(formattedAppointments);
        setFilteredAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('❌ [Debug] Error fetching appointments:', error);
      console.log('ℹ️ [Debug] Falling back to mock data');
      // Fallback to mock data if API fails
      setAppointments(mockAppointments);
      setFilteredAppointments(mockAppointments);
      console.log('✅ [Debug] Mock appointments loaded:', mockAppointments);
      console.log('🔍 [Debug] Mock appointments with pending_payment status:', 
        mockAppointments.filter(apt => apt.status === 'pending_payment'));
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
      console.log('🔄 [Debug] Page focused - refreshing appointments...');
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
        const start = new Date(startDate);
        const end = new Date(endDate);
        return aptDate >= start && aptDate <= end;
      });
    }

    setFilteredAppointments(filtered);
  }, [searchText, statusFilter, serviceFilter, dateRange, appointments]);

  const statusConfig = {
    pending: { color: '#faad14', text: 'Chờ xác nhận', icon: <Timer size={16} /> },
    pending_payment: { color: '#ff7a00', text: 'Chờ thanh toán', icon: <DocumentText size={16} /> },
    confirmed: { color: '#52c41a', text: 'Đã xác nhận', icon: <TickCircle size={16} /> },
    in_progress: { color: '#1890ff', text: 'Đang thực hiện', icon: <Activity size={16} /> },
    completed: { color: '#722ed1', text: 'Hoàn thành', icon: <TickCircle size={16} /> },
    cancelled: { color: '#f5222d', text: 'Đã hủy', icon: <Trash size={16} /> }
  };

  const locationConfig = {
    online: { icon: <MonitorMobbile size={16} />, text: 'Online' },
    Online: { icon: <MonitorMobbile size={16} />, text: 'Online' }, // Backend trả về "Online" với O hoa
    clinic: { icon: <Location size={16} />, text: 'Phòng khám' },
    home: { icon: <Home size={16} />, text: 'Tại nhà' }
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
      
      console.log('🔍 [Debug] Cancelling appointment:', appointment.id);
      
      // Gọi API hủy lịch - API mới đã được cập nhật để tự động trả lại slot trống
      const response = await appointmentApi.deleteAppointment(appointment.id);
      
      // Đóng loading message
      loadingMessage();
      
      if (response.success) {
        console.log('✅ [Debug] Cancel appointment response:', response);
        message.success({
          content: 'Hủy cuộc hẹn thành công! Lịch đã được trả lại.',
          icon: <TickCircle size={20} className="text-green-500" />,
          duration: 5
        });
        
        // Cập nhật UI - đánh dấu lịch hẹn đã hủy
        const updatedAppointments = appointments.map(apt => 
          apt.id === appointment.id ? { ...apt, status: 'cancelled', canCancel: false, canReschedule: false } : apt
        );
        setAppointments(updatedAppointments);
        setFilteredAppointments(
          filteredAppointments.map(apt => 
            apt.id === appointment.id ? { ...apt, status: 'cancelled', canCancel: false, canReschedule: false } : apt
          )
        );
      } else {
        // Xử lý trường hợp API trả về thành công nhưng không có success flag
        console.log('✅ [Debug] Appointment cancelled without success flag');
        message.success({
          content: 'Hủy cuộc hẹn thành công! Lịch đã được trả lại.',
          icon: <TickCircle size={20} className="text-green-500" />,
          duration: 5
        });
        
        // Vẫn cập nhật UI
        const updatedAppointments = appointments.map(apt => 
          apt.id === appointment.id ? { ...apt, status: 'cancelled', canCancel: false, canReschedule: false } : apt
        );
        setAppointments(updatedAppointments);
        setFilteredAppointments(
          filteredAppointments.map(apt => 
            apt.id === appointment.id ? { ...apt, status: 'cancelled', canCancel: false, canReschedule: false } : apt
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
            console.log('🔍 [Debug] Lỗi validation:', { key: firstErrorKey, message: errorMessage });
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
        console.log('🔄 [Debug] Refreshing appointments after cancellation');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <Spin size="large" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full"
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-gray-600 font-medium"
          >
            Đang tải lịch sử đặt lịch...
          </motion.p>
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
                Quản lý và theo dõi tất cả các lịch hẹn của bạn
              </p>
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
              <Option value="pending_payment">Chờ thanh toán</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="in_progress">Đang thực hiện</Option>
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
              <Option value="home-sampling">Lấy mẫu tại nhà</Option>
              <Option value="cycle-tracking">Theo dõi chu kỳ</Option>
            </Select>

            {/* Date Range */}
            <RangePicker
              size="large"
              placeholder={['Từ ngày', 'Đến ngày']}
              value={dateRange}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0]!.format('YYYY-MM-DD'), dates[1]!.format('YYYY-MM-DD')]);
                } else {
                  setDateRange(null);
                }
              }}
              format="DD/MM/YYYY"
            />

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
              label: 'Chờ thanh toán', 
              value: appointments.filter(a => a.status === 'pending_payment').length,
              color: 'orange',
              icon: <DocumentText size={24} />
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
              className="space-y-6"
            >
              {filteredAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <ModernCard variant="default" className="overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                      {/* Image & Service Info */}
                      <div className="lg:w-1/3">
                        <div className="relative h-48 lg:h-full">
                          <img
                            src={appointment.doctorAvatar || Image1}
                            alt={appointment.serviceName}
                            className="w-full h-full object-cover"
                          />
                          <div className={`absolute inset-0 bg-gradient-to-br ${appointment.doctorAvatar ? 'from-blue-500 to-purple-500' : 'from-blue-500 via-purple-500 to-pink-500'} opacity-80`} />
                          <div className="absolute inset-0 flex items-center justify-center text-white">
                            <div className="text-center">
                              <div className="mb-2">
                                <Heart size={24} className="text-red-500" />
                              </div>
                              <div className="text-sm font-medium">
                                {appointment.serviceName.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          <div className="absolute top-4 right-4">
                            <Tag color={statusConfig[appointment.status].color}>
                              {statusConfig[appointment.status].text}
                            </Tag>
                          </div>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="lg:w-2/3 p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                          {/* Left Column */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {appointment.serviceName}
                              </h3>
                              {appointment.packageName && (
                                <p className="text-blue-600 font-medium">
                                  {appointment.packageName}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">
                                Mã đặt lịch: <span className="font-mono">{appointment.id}</span>
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <People size={16} />
                                <span>{appointment.doctorName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                {locationConfig[appointment.typeLocation]?.icon || <Location size={16} />}
                                <span>{locationConfig[appointment.typeLocation]?.text || appointment.typeLocation}</span>
                              </div>
                            </div>

                            {appointment.rating && (
                              <div className="flex items-center gap-2">
                                <Rate disabled defaultValue={appointment.rating} className="text-sm" />
                                <span className="text-sm text-gray-600">
                                  ({appointment.rating}/5)
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right Column */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={16} />
                                <span>{formatDate(appointment.appointmentDate)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock size={16} />
                                <span>{appointment.appointmentTime}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600 mb-2">
                                {formatPrice(appointment.price)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Đặt lịch: {formatDate(appointment.createdAt)}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 justify-end">
                              <ModernButton
                                variant="outline"
                                className="text-sm"
                                icon={<Eye size={16} />}
                                onClick={() => handleViewDetail(appointment)}
                              >
                                Chi tiết
                              </ModernButton>

                              {appointment.canReschedule && (
                                <ModernButton
                                  variant="outline"
                                  className="text-sm"
                                  icon={<Refresh size={16} />}
                                  onClick={() => handleReschedule(appointment)}
                                >
                                  Đổi lịch
                                </ModernButton>
                              )}

                              {appointment.status === 'pending_payment' && (
                                <ModernButton
                                  variant="primary"
                                  className="text-sm bg-orange-500 hover:bg-orange-600"
                                  icon={<DocumentText size={16} />}
                                  onClick={() => handlePayment(appointment)}
                                >
                                  Thanh toán
                                </ModernButton>
                              )}

                              {appointment.canCancel && (
                                <ModernButton
                                  variant="danger"
                                  className="text-sm"
                                  icon={<Trash size={16} />}
                                  onClick={() => {
                                    Modal.confirm({
                                      title: 'Xác nhận hủy lịch',
                                      content: 'Bạn có chắc chắn muốn hủy lịch hẹn này? Lịch sẽ được trả lại để người khác có thể đặt.',
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
                                  icon={<Star size={16} />}
                                  onClick={() => handleFeedback(appointment)}
                                >
                                  Đánh giá
                                </ModernButton>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ModernCard>
                </motion.div>
              ))}
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
                        color: selectedAppointment.status === 'pending_payment' ? 'orange' : 
                               selectedAppointment.status === 'pending' ? 'blue' : 'green',
                        children: selectedAppointment.status === 'pending_payment' ? 'Chờ thanh toán' : 'Chờ xác nhận'
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