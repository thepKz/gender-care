import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Card, Typography, Space, message } from 'antd';
import { CheckCircleOutlined, HomeOutlined, ShoppingOutlined, ReloadOutlined } from '@ant-design/icons';
import packagePurchaseApi from '../../api/endpoints/packagePurchaseApi';

const { Title, Text } = Typography;

interface PaymentSuccessProps {}

const PaymentSuccess: React.FC<PaymentSuccessProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [checkingPackages, setCheckingPackages] = useState(false);

  useEffect(() => {
    // Lấy thông tin từ PayOS callback
    const code = searchParams.get('code');
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const orderCode = searchParams.get('orderCode');
    const cancel = searchParams.get('cancel');

    console.log('🔍 PayOS Callback:', { code, id, status, orderCode, cancel });

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
    navigate('/booking');
  };

  const handleCheckPurchases = async () => {
    setCheckingPackages(true);
    try {
      const response = await packagePurchaseApi.getUserPurchasedPackages({ isActive: true });
      console.log('🔍 [PaymentSuccess] Purchased packages:', response);
      
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
    } finally {
      setCheckingPackages(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!paymentInfo?.orderCode) {
      message.error('Không tìm thấy orderCode để test webhook');
      return;
    }

    setCheckingPackages(true);
    try {
      console.log('🧪 [PaymentSuccess] Testing webhook with orderCode:', paymentInfo.orderCode);
      
      // Call test webhook endpoint
      const webhookResponse = await fetch('http://localhost:8080/api/package-purchases/webhook/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderCode: paymentInfo.orderCode
        })
      });

      const webhookResult = await webhookResponse.json();
      console.log('🧪 [PaymentSuccess] Webhook test result:', webhookResult);

      if (webhookResult.success) {
        message.success('Webhook test thành công! Đang kiểm tra gói đã mua...');
        
        // Sau khi webhook success, check purchased packages
        setTimeout(async () => {
          await handleCheckPurchases();
        }, 2000);
      } else {
        message.error(`Webhook test failed: ${webhookResult.message}`);
      }
    } catch (error) {
      console.error('❌ [PaymentSuccess] Webhook test error:', error);
      message.error('Có lỗi khi test webhook');
    } finally {
      setCheckingPackages(false);
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

        {isSuccess && (
          <div className="mt-4">
            <Button 
              size="large" 
              onClick={handleTestWebhook}
              loading={checkingPackages}
              icon={<ReloadOutlined />}
              className="w-full"
              ghost
            >
              {checkingPackages ? 'Đang test webhook...' : 'Test webhook & kiểm tra gói'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess; 