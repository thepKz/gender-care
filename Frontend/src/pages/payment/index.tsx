import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Progress, message } from 'antd';
import { 
  Card as CardIcon, 
  Shield, 
  TickCircle, 
  Wallet, 
  Bank,
  Clock,
  SecuritySafe
} from 'iconsax-react';
import { appointmentApi } from '../../api/endpoints';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const amount = searchParams.get('amount') || '800000';
  const serviceName = searchParams.get('service') || 'Dịch vụ y tế';

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState('vnpay');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(price));
  };

  const paymentMethods = [
    {
      id: 'vnpay',
      name: 'VNPay',
      icon: <CardIcon size={24} />,
      description: 'Thanh toán qua VNPay',
      color: 'bg-blue-500'
    },
    {
      id: 'momo',
      name: 'MoMo',
      icon: <Wallet size={24} />,
      description: 'Ví điện tử MoMo',
      color: 'bg-pink-500'
    },
    {
      id: 'banking',
      name: 'Internet Banking',
      icon: <Bank size={24} />,
      description: 'Chuyển khoản ngân hàng',
      color: 'bg-green-500'
    }
  ];

  const processPayment = async () => {
    setProcessing(true);
    setCurrentStep(1);

    // Simulate payment processing with progress
    const interval = setInterval(async () => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          handlePaymentSuccess();
          return 100;
        }
        return prev + Math.random() * 25;
      });
    }, 200);
  };

  const handlePaymentSuccess = async () => {
    try {
      // Cập nhật trạng thái thanh toán
      if (appointmentId) {
        console.log('Đang cập nhật trạng thái thanh toán cho appointment:', appointmentId);
        
        // Kiểm tra trạng thái hiện tại của appointment trước khi update
        try {
          const currentAppointment = await appointmentApi.getAppointmentById(appointmentId);
          const currentStatus = currentAppointment?.data?.status;
          console.log('Trạng thái hiện tại của appointment:', currentStatus);
          console.log('Chi tiết appointment hiện tại:', currentAppointment?.data);
          
          // Nếu đã confirmed rồi thì không cần update nữa
          if (currentStatus === 'confirmed') {
            console.log('Appointment đã được xác nhận rồi, không cần update');
            message.success('Thanh toán thành công! Lịch hẹn đã được xác nhận.');
            return; // Exit early, không cần gọi API update
          }
          
          // Nếu không phải pending_payment thì không thể thanh toán
          if (currentStatus !== 'pending_payment') {
            console.warn('Appointment không ở trạng thái chờ thanh toán:', currentStatus);
            message.warning(`Lịch hẹn đang ở trạng thái "${currentStatus}". Vui lòng kiểm tra lại.`);
            return;
          }
        } catch (checkError) {
          console.error('Không thể kiểm tra trạng thái appointment:', checkError);
          // Tiếp tục thử update payment nếu không check được
        }
        
        await appointmentApi.updatePaymentStatus(appointmentId, 'confirmed');
        console.log('Cập nhật trạng thái thanh toán thành công!');
        message.success('Thanh toán thành công! Lịch hẹn đã được xác nhận.');
      }
      
      setSuccess(true);
      setCurrentStep(2);
      
      // Auto redirect after success
      setTimeout(() => {
        navigate('/booking-history');
      }, 2000);
      
    } catch (error: any) {
      console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
      console.error('Chi tiết error response:', error?.response?.data);
      console.error('Status code:', error?.response?.status);
      console.error('Error message:', error?.message);
      
      // Hiển thị chi tiết lỗi cho debugging
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi không xác định';
      const errorDetails = error?.response?.data?.errors || {};
      console.error('Error details:', errorDetails);
      
      message.warning(`Thanh toán thành công nhưng có lỗi khi cập nhật trạng thái: ${errorMessage}`);
      
      setSuccess(true);
      setCurrentStep(2);
      
      setTimeout(() => {
        navigate('/booking-history');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full mb-4">
            <Wallet size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thanh toán</h1>
          <p className="text-gray-600">Hoàn tất thanh toán để xác nhận lịch hẹn của bạn</p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between items-center mb-8"
        >
          {['Chọn phương thức', 'Đang xử lý', 'Hoàn thành'].map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {index < currentStep ? <TickCircle size={20} /> : index + 1}
              </div>
              <span className={`text-sm ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {!processing && !success && (
            <motion.div
              key="payment-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Order Summary */}
              <Card className="mb-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Chi tiết thanh toán</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dịch vụ:</span>
                    <span className="font-medium">{serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã đặt lịch:</span>
                    <span className="font-mono text-sm">{appointmentId?.slice(0, 8)}...</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold text-blue-600">
                    <span>Tổng cần thanh toán:</span>
                    <span>{formatPrice(amount)}</span>
                  </div>
                </div>
              </Card>

              {/* Payment Methods */}
              <Card className="mb-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Chọn phương thức thanh toán</h3>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <motion.div
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg text-white ${method.color}`}>
                            {method.icon}
                          </div>
                          <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm text-gray-500">{method.description}</div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedMethod === method.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedMethod === method.id && (
                            <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Security Notice */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-6"
              >
                <Shield size={24} className="text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Bảo mật tuyệt đối</div>
                  <div className="text-sm text-green-600">
                    Thông tin thanh toán được mã hóa và bảo vệ an toàn
                  </div>
                </div>
              </motion.div>

              {/* Payment Button */}
              <Button
                type="primary"
                size="large"
                className="w-full h-12 text-lg font-semibold"
                onClick={processPayment}
                icon={<CardIcon size={20} />}
              >
                Thanh toán {formatPrice(amount)}
              </Button>
            </motion.div>
          )}

          {processing && !success && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <Card className="shadow-lg">
                <div className="py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full mb-6"
                  >
                    <SecuritySafe size={32} />
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold mb-4">Đang xử lý thanh toán...</h3>
                  <p className="text-gray-600 mb-6">
                    Vui lòng không tắt trình duyệt trong quá trình xử lý
                  </p>
                  
                  <Progress
                    percent={Math.round(progress)}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    className="mb-4"
                  />
                  
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <Clock size={16} />
                    <span>Thời gian xử lý: 2-5 giây</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <Card className="shadow-lg">
                <div className="py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-green-500 text-white rounded-full mb-6"
                  >
                    <TickCircle size={40} />
                  </motion.div>
                  
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-green-600 mb-4"
                  >
                    Thanh toán thành công!
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 mb-6"
                  >
                    Lịch hẹn của bạn đã được xác nhận. Chúng tôi sẽ liên hệ với bạn sớm nhất.
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Số tiền đã thanh toán</div>
                      <div className="text-lg font-bold text-green-600">{formatPrice(amount)}</div>
                    </div>
                    
                    <Button
                      type="primary"
                      size="large"
                      className="w-full"
                      onClick={() => navigate('/booking-history')}
                    >
                      Xem lịch sử đặt lịch
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PaymentPage; 