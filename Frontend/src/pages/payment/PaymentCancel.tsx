import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Card, Typography, Space } from 'antd';
import { CloseCircleOutlined, HomeOutlined, ShoppingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface PaymentCancelProps {}

const PaymentCancel: React.FC<PaymentCancelProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    // Lấy thông tin từ PayOS callback
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const orderCode = searchParams.get('orderCode');
    const cancel = searchParams.get('cancel');



    setPaymentInfo({
      code,
      id, 
      status,
      orderCode,
      cancel: cancel === 'true'
    });
  }, [searchParams]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate('/services');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <Result
          status="warning"
          icon={<CloseCircleOutlined style={{ color: '#faad14' }} />}
          title="Thanh toán đã bị hủy"
          subTitle="Bạn đã hủy giao dịch thanh toán. Không có khoản tiền nào bị trừ từ tài khoản của bạn."
        />

        {paymentInfo?.orderCode && (
          <Card className="mt-4" size="small">
            <Title level={5}>Thông tin giao dịch</Title>
            <Space direction="vertical" className="w-full">
              <div className="flex justify-between">
                <Text type="secondary">Mã đơn hàng:</Text>
                <Text strong>{paymentInfo.orderCode}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Trạng thái:</Text>
                <Text strong style={{ color: '#faad14' }}>
                  ĐÃ HỦY
                </Text>
              </div>
            </Space>
          </Card>
        )}

        <div className="flex gap-3 mt-6">
          <Button 
            size="large" 
            onClick={handleGoHome}
            icon={<HomeOutlined />}
            className="flex-1"
          >
            Về trang chủ
          </Button>
          <Button 
            type="primary" 
            size="large" 
            onClick={handleTryAgain}
            icon={<ShoppingOutlined />}
            className="flex-1"
          >
            Thử lại
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel; 