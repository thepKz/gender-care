import React, { useState, useEffect } from 'react';
import { Modal, Button, Select, Card, Typography, Space, message, Spin } from 'antd';
import { CheckCircleOutlined, CreditCardOutlined, UserOutlined } from '@ant-design/icons';
import { ServicePackage, UserProfile } from '../../../types';
import packagePurchaseApi from '../../../api/endpoints/packagePurchaseApi';
import userProfileApiInstance from '../../../api/endpoints/userProfileApi';

const { Title, Text } = Typography;
const { Option } = Select;

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
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (visible) {
      fetchUserProfiles();
    }
  }, [visible]);

  const fetchUserProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const profiles = await userProfileApiInstance.getMyProfiles();
      setUserProfiles(profiles);
      
      // Auto select first profile if available
      if (profiles.length > 0) {
        setSelectedProfileId(profiles[0]._id);
      }
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải danh sách hồ sơ';
      message.error(errorMessage);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handlePurchase = async () => {
    if (!selectedProfileId) {
      message.error('Vui lòng chọn hồ sơ bệnh án');
      return;
    }

    if (!servicePackage) {
      message.error('Không tìm thấy thông tin gói dịch vụ');
      return;
    }

    try {
      setLoading(true);
      
      // Call API to purchase package - Mock thành công 100%
      await packagePurchaseApi.purchasePackage({
        profileId: selectedProfileId,
        packageId: servicePackage._id,
        promotionId: undefined // Có thể thêm promotion logic sau
      });

      message.success('Mua gói dịch vụ thành công!');
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error purchasing package:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi mua gói dịch vụ';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedProfileId('');
    onClose();
  };

  if (!servicePackage) return null;

  const discountPercentage = Math.round(
    ((servicePackage.priceBeforeDiscount - servicePackage.price) / servicePackage.priceBeforeDiscount) * 100
  );

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
            <Text className="text-gray-600 block mb-4">{servicePackage.description}</Text>
            
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

        {/* Profile Selection */}
        <div>
          <div className="mb-3">
            <Title level={5} className="mb-1 flex items-center gap-2">
              <UserOutlined />
              Chọn hồ sơ bệnh án
            </Title>
            <Text type="secondary">Gói dịch vụ sẽ được gán cho hồ sơ này</Text>
          </div>
          
          {loadingProfiles ? (
            <div className="text-center py-4">
              <Spin />
              <div className="mt-2 text-gray-500">Đang tải danh sách hồ sơ...</div>
            </div>
          ) : userProfiles.length === 0 ? (
            <div className="text-center py-4">
              <Text type="secondary">
                Bạn chưa có hồ sơ bệnh án nào. Vui lòng tạo hồ sơ trước khi mua gói.
              </Text>
            </div>
          ) : (
            <Select
              placeholder="Chọn hồ sơ bệnh án"
              value={selectedProfileId}
              onChange={setSelectedProfileId}
              className="w-full"
              size="large"
            >
              {userProfiles.map(profile => (
                <Option key={profile._id} value={profile._id}>
                  <div className="flex items-center justify-between">
                    <span>{profile.fullName}</span>
                    <span className="text-gray-500 text-sm">
                      {profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'} • 
                      {profile.phone}
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          )}
        </div>

        {/* Mock Payment Info */}
        <Card className="bg-yellow-50 border border-yellow-200">
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="text-green-500 text-xl mt-1" />
            <div>
              <Title level={5} className="mb-1 text-gray-800">Thanh toán giả lập</Title>
              <Text className="text-gray-600">
                Đây là chế độ demo - thanh toán sẽ thành công 100% để bạn có thể test các chức năng khác.
              </Text>
            </div>
          </div>
        </Card>

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
            disabled={!selectedProfileId || userProfiles.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <CreditCardOutlined />
            Mua ngay - {formatPrice(servicePackage.price)}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PurchasePackageModal; 