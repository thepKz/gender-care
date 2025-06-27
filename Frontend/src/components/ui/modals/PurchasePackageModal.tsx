import { CreditCardOutlined } from '@ant-design/icons';
import { Button, Card, message, Modal, Typography } from 'antd';
import React, { useState } from 'react';
import packagePurchaseApi from '../../../api/endpoints/packagePurchaseApi';
import { ServicePackage } from '../../../types';

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
      console.log('🔍 [Frontend] Payment URL:', response.data?.bill?.paymentUrl);

      if (response.success && response.data?.bill?.paymentUrl) {
        console.log('✅ [Frontend] Redirecting to PayOS:', response.data.bill.paymentUrl);
        // Redirect đến PayOS payment page
        window.location.href = response.data.bill.paymentUrl;
      } else {
        console.error('❌ [Frontend] No payment URL in response:', response);
        message.error('Không thể tạo link thanh toán. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('❌ [Frontend] Error purchasing package:', error);
      console.error('❌ [Frontend] Error response:', error.response);
      console.error('❌ [Frontend] Error data:', error.response?.data);
      
      // Enhanced error handling với user-friendly messages
      let errorMessage = 'Có lỗi xảy ra khi mua gói dịch vụ';
      
      if (error.response?.data?.errors?.general) {
        const originalError = error.response.data.errors.general;
        
        // Handle specific duplicate package error
        if (originalError.includes('Bạn đã sở hữu gói này')) {
          errorMessage = 'Bạn đã sở hữu gói dịch vụ này và vẫn còn hiệu lực. Vui lòng sử dụng hết các dịch vụ hoặc chờ gói hết hạn trước khi mua lại.';
          
          // Show additional info modal
          Modal.info({
            title: '🎁 Gói dịch vụ đã có sẵn',
            content: (
              <div>
                <p>Bạn đã sở hữu gói dịch vụ này với:</p>
                <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                  <li>✅ Các dịch vụ chưa sử dụng hết</li>
                  <li>📅 Thời hạn còn hiệu lực</li>
                </ul>
                <p style={{ marginTop: '12px', fontWeight: '500' }}>
                  💡 <strong>Gợi ý:</strong> Hãy vào trang <em>"Gói đã mua"</em> để đặt lịch sử dụng các dịch vụ có sẵn.
                </p>
              </div>
            ),
            okText: 'Đã hiểu',
            centered: true
          });
          
        } else if (originalError.includes('Package not found')) {
          errorMessage = 'Không tìm thấy gói dịch vụ hoặc gói đã ngừng hoạt động';
        } else if (originalError.includes('Insufficient payment')) {
          errorMessage = 'Số tiền thanh toán không đủ cho gói dịch vụ này';
        } else {
          errorMessage = originalError;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
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