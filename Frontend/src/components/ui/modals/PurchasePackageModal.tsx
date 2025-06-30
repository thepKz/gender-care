import { CreditCardOutlined } from '@ant-design/icons';
import { Button, Card, message, Modal, Typography } from 'antd';
import React, { useState } from 'react';
import packagePurchaseApi from '../../../api/endpoints/packagePurchaseApi';
import { ServicePackage } from '../../../types';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface PurchasePackageModalProps {
  visible: boolean;
  onClose: () => void;
  servicePackage: ServicePackage | null;
  onSuccess?: () => void;
}

const PurchasePackageModal: React.FC<PurchasePackageModalProps> = ({
  visible,
  onClose,
  servicePackage,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handlePurchase = async () => {
    if (!servicePackage?._id) return;

    setLoading(true);
    try {
      console.log('🔍 [Frontend] Calling purchasePackage API...');
      const response = await packagePurchaseApi.purchasePackage({
        packageId: servicePackage._id,
        // Không cần gửi profileId nữa
      });

      console.log('🔍 [Frontend] API Response:', response);
      console.log('🔍 [Frontend] Response success:', response.success);
      console.log('🔍 [Frontend] Response data:', response.data);
      
      if (response.success && response.data) {
        // 🆕 Handle different response types based on backend structure
        const data = response.data as any; // Type assertion for dynamic response structure
        
        console.log('🔍 [Frontend] Analyzing response structure:', {
          hasPackagePurchase: !!data.packagePurchase,
          hasPaymentUrl: !!data.paymentUrl,
          hasBill: !!data.bill,
          packageName: data.packageName,
          pricing: data.pricing
        });
        
        // Case 1: Paid package with payment URL (most common)
        if (data.paymentUrl || (data.bill && data.bill.paymentUrl)) {
          const paymentUrl = data.paymentUrl || data.bill.paymentUrl;
          const packageName = data.packageName || servicePackage.name;
          console.log('💳 [Frontend] Redirecting to payment URL:', paymentUrl);
          message.success({ 
            content: `Đang chuyển hướng đến trang thanh toán cho ${packageName}...`,
            duration: 2,
          });
          
          // Redirect to payment
          window.location.href = paymentUrl;
          return;
        }
        
        // Case 2: Free package - already purchased and activated immediately
        if (data.packagePurchase && data.packagePurchase.status === 'active') {
          const packageName = data.packageName || servicePackage.name;
          console.log('✅ [Frontend] Free package activated successfully');
          message.success({
            content: `🎉 ${packageName} đã được kích hoạt thành công!`,
            duration: 3,
          });
          
          // Close modal and navigate to purchased packages
          onClose();
          if (navigate) {
            navigate('/purchased-packages');
          }
          return;
        }
        
        // Case 3: Purchase created but waiting for payment (has bill but no package yet)
        if (data.bill && !data.packagePurchase) {
          const packageName = data.packageName || servicePackage.name;
          console.log('⏳ [Frontend] Purchase pending - payment required');
          message.info({
            content: `Đơn hàng ${packageName} đã được tạo. Cần thanh toán để kích hoạt.`,
            duration: 3,
          });
          
          // Close modal and navigate to purchased packages or billing
          onClose();
          return;
        }
        
        // Case 4: Unexpected response structure
        console.error('❌ [Frontend] Unexpected response structure:', {
          hasPackagePurchase: !!data.packagePurchase,
          hasPaymentUrl: !!data.paymentUrl,
          hasBill: !!data.bill,
          dataKeys: Object.keys(data)
        });
        
        message.error({
          content: 'Cấu trúc response không như mong đợi. Vui lòng thử lại.',
          duration: 3,
        });
      }
    } catch (error: any) {
      console.error('❌ [Frontend] Error purchasing package:', error);
      console.error('❌ [Frontend] Error response:', error.response);
      
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi mua gói dịch vụ';
      console.error('❌ [Frontend] Error message:', errorMessage);
      
      // 🆕 Better error handling with specific messages
      if (error.response?.status === 400) {
        message.error({
          content: `❌ ${errorMessage}`,
          duration: 4,
        });
      } else if (error.response?.status === 409) {
        // Conflict - likely duplicate purchase
        Modal.info({
          title: '📋 Thông báo',
          content: 'Bạn đã mua gói này rồi. Vui lòng kiểm tra danh sách gói đã mua.',
          onOk: () => {
            onClose();
            if (navigate) {
              navigate('/purchased-packages');
            }
          },
        });
      } else if (error.response?.status === 500) {
        message.error({
          content: `❌ Lỗi hệ thống: ${errorMessage}. Vui lòng thử lại sau.`,
          duration: 5,
        });
      } else {
        message.error({
          content: `❌ ${errorMessage}`,
          duration: 4,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!servicePackage) return null;

  const discountPercentage = Math.round(
    ((servicePackage.priceBeforeDiscount - servicePackage.price) / servicePackage.priceBeforeDiscount) * 100
  );

  // 🔹 Calculate total service quantity
  const totalQuantity = servicePackage.services?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CreditCardOutlined className="text-blue-600" />
          <span>Mua gói dịch vụ</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      className="purchase-package-modal"
    >
      <div className="space-y-6">
        {/* Package Info */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <div className="text-center">
            <div className="text-4xl mb-3">🎁</div>
            <Title level={4} className="mb-2">{servicePackage.name}</Title>
            <Text className="text-gray-600 block mb-4">{servicePackage.description || 'Gói dịch vụ chăm sóc sức khỏe toàn diện'}</Text>
            
            {/* 🔹 Package Summary */}
            <div className="flex justify-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{servicePackage.services?.length || 0}</div>
                <div className="text-sm text-gray-500">Dịch vụ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalQuantity}</div>
                <div className="text-sm text-gray-500">Lượt sử dụng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{servicePackage.durationInDays}</div>
                <div className="text-sm text-gray-500">Ngày</div>
              </div>
            </div>
            
            {/* Price Display */}
            <div className="space-y-2">
              {discountPercentage > 0 && (
                <div>
                  <Text delete className="text-gray-500 text-lg">
                    {formatPrice(servicePackage.priceBeforeDiscount)}
                  </Text>
                  <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    -{discountPercentage}%
                  </span>
                </div>
              )}
              <div className="text-3xl font-bold text-blue-600">
                {formatPrice(servicePackage.price)}
              </div>
              {discountPercentage > 0 && (
                <Text className="text-green-600 font-medium">
                  Tiết kiệm {formatPrice(servicePackage.priceBeforeDiscount - servicePackage.price)}
                </Text>
              )}
            </div>
          </div>
        </Card>

        {/* Services Summary */}
        {servicePackage.services && servicePackage.services.length > 0 && (
          <Card className="bg-gray-50 border border-gray-200">
            <Title level={5} className="mb-3 text-center">Chi tiết gói dịch vụ</Title>
            <div className="space-y-2">
              {servicePackage.services.map((serviceItem, index) => {
                const service = typeof serviceItem.serviceId === 'object' ? serviceItem.serviceId : null;
                if (!service) return null;
                
                return (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🩺</span>
                      <div>
                        <div className="font-medium">{service.serviceName}</div>
                        <div className="text-sm text-gray-500">{formatPrice(service.price)} / lượt</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{serviceItem.quantity} lượt</div>
                      <div className="text-sm text-gray-500">
                        {formatPrice(service.price * serviceItem.quantity)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            size="large" 
            onClick={handleCancel}
            className="flex-1"
          >
            Huỷ bỏ
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handlePurchase}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <CreditCardOutlined />
            Thanh toán với PayOS - {formatPrice(servicePackage.price)}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PurchasePackageModal; 