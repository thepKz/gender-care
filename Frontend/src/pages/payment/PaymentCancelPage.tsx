import React from 'react';
import { Card, Button, Typography, Alert, Divider, Space } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  HomeOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get('appointmentId');

  const retryPayment = () => {
    if (appointmentId) {
      navigate(`/payment/process?appointmentId=${appointmentId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        
        {/* Error Header */}
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
              className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CloseCircleOutlined style={{ fontSize: '40px', color: 'white' }} />
            </motion.div>
          </div>
          
          <Title level={2} className="text-red-600 mb-4">
            ❌ Thanh toán đã bị hủy
          </Title>
          <Paragraph className="text-lg text-gray-600">
            Giao dịch của bạn đã bị hủy hoặc không thể hoàn thành.
          </Paragraph>
        </motion.div>

        {/* Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-lg rounded-lg mb-6">
            <div className="mb-4">
              <Title level={4} className="text-gray-800 mb-0">
                ℹ️ Trạng thái giao dịch
              </Title>
            </div>
            
            <div className="space-y-4">
              <Paragraph className="text-gray-600">
                Thanh toán của bạn đã bị hủy hoặc không thể hoàn thành. Lịch hẹn vẫn đang chờ thanh toán.
              </Paragraph>
              
              <Alert
                message="Lưu ý quan trọng"
                description="Lịch hẹn của bạn sẽ bị hủy tự động nếu không thanh toán trong thời gian quy định."
                type="warning"
                icon={<ExclamationCircleOutlined />}
                showIcon
                className="mb-4"
              />
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="shadow-lg rounded-lg">
            <div className="mb-4">
              <Title level={4} className="text-gray-800 mb-0">
                🎯 Bước tiếp theo
              </Title>
            </div>
            
            <Space direction="vertical" size="middle" className="w-full">
              {appointmentId && (
                <Button 
                  type="primary"
                  size="large"
                  block
                  icon={<CreditCardOutlined />}
                  onClick={retryPayment}
                  style={{
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff',
                    height: '48px',
                    fontSize: '16px'
                  }}
                >
                  Thử thanh toán lại
                </Button>
              )}
              
              <Button 
                size="large"
                block
                icon={<HistoryOutlined />}
                onClick={() => navigate('/booking-history')}
                style={{
                  height: '48px',
                  fontSize: '16px'
                }}
              >
                Xem lịch sử đặt hẹn
              </Button>
              
              <Button 
                size="large"
                block
                icon={<HomeOutlined />}
                onClick={() => navigate('/')}
                style={{
                  height: '48px',
                  fontSize: '16px'
                }}
              >
                Về trang chủ
              </Button>
            </Space>

            <Divider />
            
            <div className="text-center">
              <Text type="secondary" className="text-sm">
                Cần hỗ trợ? Liên hệ hotline: <Text strong>1900-xxxx</Text>
              </Text>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentCancelPage; 