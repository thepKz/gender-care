import React, { useEffect, useState } from 'react';
import { Card, Button, Typography, Tag, Divider, Space, message, Spin } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DollarOutlined,
  HomeOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { appointmentApi } from '../../api';

const { Title, Paragraph, Text } = Typography;

interface AppointmentDetail {
  id: string;
  serviceName: string;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  timeSlot: string;
  totalAmount: number;
  status: string;
  location: string;
}

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const appointmentId = searchParams.get('appointmentId');
  const orderCode = searchParams.get('orderCode');
  const status = searchParams.get('status');
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentData, setAppointmentData] = useState<AppointmentDetail | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    const confirmAndFetch = async () => {
      if (!appointmentId || !orderCode || !status) {
        message.error('Thiếu thông tin xác nhận thanh toán');
        navigate('/booking', { replace: true });
        return;
      }
      try {
        console.log('🚀 [PaymentSuccess] Fast confirming appointment payment...', { appointmentId, orderCode, status });
        
        // ✅ FIX: Gọi API xác nhận nhanh cho appointment (giống như consultation)
        const confirmResponse = await appointmentApi.fastConfirmPayment({ 
          appointmentId, 
          orderCode, 
          status 
        });
        
        if (confirmResponse.data.success) {
          console.log('✅ [PaymentSuccess] Appointment payment confirmed successfully');
          message.success('Thanh toán thành công! Lịch hẹn đã được xác nhận.');
        } else {
          throw new Error(confirmResponse.data.message || 'Không thể xác nhận thanh toán');
        }
        
        // Sau khi xác nhận, lấy chi tiết lịch hẹn
        const response = await appointmentApi.getAppointmentById(appointmentId);
        if (response.success && response.data) {
          const appointment = response.data;
          setAppointmentData({
            id: appointment.id || appointmentId,
            serviceName: appointment.serviceName || 'Dịch vụ khám bệnh',
            doctorName: appointment.doctorName || 'Bác sĩ',
            patientName: appointment.patientName || appointment.userProfile?.fullName || 'Bệnh nhân',
            appointmentDate: appointment.appointmentDate || 'Chưa xác định',
            timeSlot: appointment.timeSlot || 'Chưa xác định',
            totalAmount: appointment.totalAmount || 0,
            status: appointment.status || 'confirmed',
            location: appointment.location || appointment.typeLocation || 'Tại phòng khám'
          });
        } else {
          throw new Error('Không thể lấy thông tin lịch hẹn');
        }
      } catch (error: any) {
        console.error('❌ [PaymentSuccess] Error confirming appointment payment:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi khi xác nhận thanh toán';
        setConfirmError(errorMessage);
        message.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    confirmAndFetch();
  }, [appointmentId, orderCode, status, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text className="text-lg text-gray-600">Đang xác nhận thanh toán...</Text>
          </div>
        </div>
      </div>
    );
  }
  if (confirmError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <Title level={3} type="danger">Lỗi xác nhận thanh toán</Title>
          <Paragraph>{confirmError}</Paragraph>
          <Button type="primary" onClick={() => navigate('/')}>Về trang chủ</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        
        {/* Success Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircleOutlined style={{ fontSize: '40px', color: 'white' }} />
            </motion.div>
          </div>
          
          <Title level={2} className="text-green-600 mb-4">
            🎉 Đặt lịch thành công!
          </Title>
          <Paragraph className="text-lg text-gray-600">
            Lịch hẹn của bạn đã được xác nhận và thanh toán thành công.
          </Paragraph>
        </motion.div>

        {/* Appointment Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-lg rounded-lg mb-6">
            <div className="mb-4">
              <Title level={4} className="text-gray-800 mb-0">
                📋 Thông tin lịch hẹn
              </Title>
            </div>
            
            <div className="space-y-4">
              {/* Mã lịch hẹn */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <Text className="text-gray-600">Mã lịch hẹn:</Text>
                <Text className="font-mono text-sm font-bold">{appointmentData?.id}</Text>
              </div>

              {/* Dịch vụ */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-blue-500" />
                  <Text className="text-gray-600">Dịch vụ:</Text>
                </div>
                <Text className="font-semibold">{appointmentData?.serviceName}</Text>
              </div>

              {/* Bệnh nhân */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-purple-500" />
                  <Text className="text-gray-600">Bệnh nhân:</Text>
                </div>
                <Text className="font-semibold">{appointmentData?.patientName}</Text>
              </div>

              {/* Bác sĩ */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-green-500" />
                  <Text className="text-gray-600">Bác sĩ:</Text>
                </div>
                <Text className="font-semibold">{appointmentData?.doctorName}</Text>
              </div>

              {/* Ngày khám */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CalendarOutlined className="text-orange-500" />
                  <Text className="text-gray-600">Ngày khám:</Text>
                </div>
                <Text className="font-semibold">{formatDate(appointmentData?.appointmentDate || '')}</Text>
              </div>

              {/* Giờ khám */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-red-500" />
                  <Text className="text-gray-600">Giờ khám:</Text>
                </div>
                <Text className="font-semibold">{appointmentData?.timeSlot}</Text>
              </div>

              {/* Hình thức */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HomeOutlined className="text-indigo-500" />
                  <Text className="text-gray-600">Hình thức:</Text>
                </div>
                <Text className="font-semibold">{appointmentData?.location}</Text>
              </div>

              <Divider />

              {/* Tổng tiền */}
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <DollarOutlined className="text-green-600" />
                  <Text className="text-green-800 font-semibold">Tổng thanh toán:</Text>
                </div>
                <div className="text-right">
                  <Text className="text-green-600 text-xl font-bold">
                    {formatPrice(appointmentData?.totalAmount || 0)}
                  </Text>
                  <div>
                    <Tag color="green">Đã thanh toán</Tag>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="shadow-lg rounded-lg mb-6">
            <Title level={4} className="text-gray-800 mb-4">
              📞 Bước tiếp theo
            </Title>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <Text className="font-semibold text-blue-900">Chúng tôi sẽ liên hệ xác nhận</Text>
                  <div className="text-blue-700 text-sm">Trong vòng 2-4 giờ làm việc</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <Text className="font-semibold text-orange-900">Chuẩn bị khám bệnh</Text>
                  <div className="text-orange-700 text-sm">Mang theo CMND/CCCD và thẻ BHYT (nếu có)</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <Text className="font-semibold text-green-900">Đến khám đúng giờ</Text>
                  <div className="text-green-700 text-sm">Có mặt trước 15 phút để làm thủ tục</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Space direction="vertical" className="w-full" size="middle">
            <Button
              type="primary"
              size="large"
              icon={<HistoryOutlined />}
              className="w-full h-12 text-lg font-semibold"
              onClick={() => navigate('/booking-history')}
            >
              Xem lịch sử đặt hẹn
            </Button>
            
            <Button
              size="large"
              icon={<HomeOutlined />}
              className="w-full h-12 text-lg font-semibold"
              onClick={() => navigate('/')}
            >
              Về trang chủ
            </Button>
          </Space>
        </motion.div>

        {/* Support Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <Card className="shadow-lg rounded-lg bg-gradient-to-r from-blue-50 to-green-50">
            <Title level={5} className="text-gray-800 mb-3">
              💬 Cần hỗ trợ?
            </Title>
            <Text className="text-gray-600 block mb-4">
              Liên hệ với chúng tôi nếu có thắc mắc hoặc cần thay đổi lịch hẹn
            </Text>
            <Space size="large">
              <Text className="text-blue-600 font-semibold">📞 Hotline: 1900-1234</Text>
              <Text className="text-green-600 font-semibold">📧 Email: support@healthcare.com</Text>
            </Space>
          </Card>
        </motion.div>

      </div>
    </div>
  );
};

export default PaymentSuccessPage; 