import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Card, Typography, Space, message } from 'antd';
import { CheckCircleOutlined, HomeOutlined, ShoppingOutlined } from '@ant-design/icons';
import packagePurchaseApi from '../../api/endpoints/packagePurchaseApi';

const { Title, Text } = Typography;

interface PaymentInfo {
  code: string | null;
  id: string | null;
  status: string | null;
  orderCode: string | null;
  cancel: boolean;
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);


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

    // Simulate processing time
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, [searchParams]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewPackages = () => {
    navigate('/booking-history');
  };

  const handleCheckPurchases = async () => {
    try {
      const response = await packagePurchaseApi.getUserPurchasedPackages({ isActive: true });
  
      
      if (response.success && response.data?.packagePurchases?.length > 0) {
        message.success(`Tìm thấy ${response.data.packagePurchases.length} gói đã mua!`);
        setTimeout(() => {
          navigate('/booking');
        }, 1000);
      } else {
        message.warning('Chưa tìm thấy gói đã mua. Vui lòng chờ một chút và thử lại.');
      }
    } catch (error) {
      console.error('❌ [PaymentSuccess] Error checking purchases:', error);
      message.error('Có lỗi khi kiểm tra gói đã mua.');
    } 
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="text-center p-8">
          <Spin size="large" />
          <div className="mt-4">
            <Title level={4}>Đang xử lý thanh toán...</Title>
            <Text type="secondary">Vui lòng chờ trong giây lát</Text>
          </div>
        </Card>
      </div>
    );
  }

  const isSuccess = paymentInfo?.status === 'PAID' && paymentInfo?.code === '00';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <Result
          status={isSuccess ? "success" : "error"}
          icon={isSuccess ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : undefined}
          title={isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
          subTitle={
            isSuccess 
              ? "Gói dịch vụ đã được mua thành công. Bạn có thể sử dụng ngay bây giờ."
              : "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại."
          }
        />

        {paymentInfo && (
          <Card className="mt-4" size="small">
            <Title level={5}>Thông tin thanh toán</Title>
            <Space direction="vertical" className="w-full">
              <div className="flex justify-between">
                <Text type="secondary">Mã đơn hàng:</Text>
                <Text strong>{paymentInfo.orderCode}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Trạng thái:</Text>
                <Text strong style={{ color: isSuccess ? '#52c41a' : '#ff4d4f' }}>
                  {paymentInfo.status}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Mã giao dịch:</Text>
                <Text>{paymentInfo.id}</Text>
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
            onClick={handleViewPackages}
            icon={<ShoppingOutlined />}
            className="flex-1"
          >
            Xem gói đã mua
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 