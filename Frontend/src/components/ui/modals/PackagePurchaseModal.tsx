import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Card,
  Button,
  Typography,
  Divider,
  Space,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Tag
} from 'antd';
import {
  UserOutlined,
  CreditCardOutlined,
  GiftOutlined,
  CheckCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import { ServicePackage, UserProfile } from '../../../types';
import userProfileApiInstance from '../../../api/endpoints/userProfileApi';
import packagePurchaseApi from '../../../api/endpoints/packagePurchaseApi';
import { useAuth } from '../../../hooks/useAuth';

const { Title, Text } = Typography;
const { Option } = Select;

interface PackagePurchaseModalProps {
  visible: boolean;
  onCancel: () => void;
  servicePackage: ServicePackage;
  onPurchaseSuccess?: (purchaseId: string) => void;
}

const PackagePurchaseModal: React.FC<PackagePurchaseModalProps> = ({
  visible,
  onCancel,
  servicePackage,
  onPurchaseSuccess
}) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);

  // Load user profiles when modal opens
  useEffect(() => {
    if (visible && user?._id) {
      loadUserProfiles();
    }
  }, [visible, user?._id]);

  const loadUserProfiles = async () => {
    setProfilesLoading(true);
    try {
      const profiles = await userProfileApiInstance.getMyProfiles();
      if (profiles && Array.isArray(profiles)) {
        setUserProfiles(profiles);
        
        // Auto-select default profile if exists
        const defaultProfile = profiles.find(p => p.isDefault);
        if (defaultProfile) {
          form.setFieldsValue({ userProfileId: defaultProfile._id });
        }
      }
    } catch (error) {
      console.error('Error loading user profiles:', error);
      message.error('Không thể tải danh sách hồ sơ người dùng');
    } finally {
      setProfilesLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const calculateDiscount = () => {
    if (!servicePackage.priceBeforeDiscount || servicePackage.priceBeforeDiscount <= servicePackage.price) {
      return 0;
    }
    return Math.round(
      ((servicePackage.priceBeforeDiscount - servicePackage.price) / servicePackage.priceBeforeDiscount) * 100
    );
  };

  const handlePurchase = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const purchaseData = {
        servicePackageId: servicePackage._id,
        userProfileId: values.userProfileId,
        paymentMethod: 'payos' // Default payment method
      };

      console.log('🔄 [PackagePurchase] Initiating purchase:', purchaseData);

      const response = await packagePurchaseApi.purchasePackage(purchaseData);

      if (response.success && response.data) {
        console.log('✅ [PackagePurchase] Purchase initiated successfully');
        
        // If payment URL is provided, redirect to payment
        if (response.data.paymentUrl) {
          message.success('Đang chuyển hướng đến trang thanh toán...');
          window.location.href = response.data.paymentUrl;
        } else if (response.data.purchaseId) {
          // Direct success (for free packages or testing)
          message.success('Mua gói dịch vụ thành công!');
          onPurchaseSuccess?.(response.data.purchaseId);
          onCancel();
        }
      } else {
        throw new Error(response.message || 'Purchase failed');
      }
    } catch (error: any) {
      console.error('❌ [PackagePurchase] Purchase error:', error);
      message.error('Có lỗi xảy ra khi mua gói: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <GiftOutlined className="text-blue-500" />
          <span>Xác nhận mua gói dịch vụ</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <div className="py-4">
        {/* Package Information */}
        <Card className="mb-6 border border-blue-200 bg-blue-50/50">
          <Row gutter={16} align="middle">
            <Col span={16}>
              <div>
                <Title level={4} className="mb-2 text-gray-800">
                  {servicePackage.name}
                </Title>
                <Text type="secondary" className="block mb-3">
                  {servicePackage.description}
                </Text>
                
                {/* Services included */}
                <div className="mb-3">
                  <Text strong className="text-sm text-gray-600">Bao gồm dịch vụ:</Text>
                  <div className="mt-2 space-y-1">
                    {servicePackage.services?.map((service, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircleOutlined className="text-green-500 text-xs" />
                        <Text className="text-sm">
                          {typeof service.serviceId === 'object' 
                            ? service.serviceId.serviceName 
                            : service.serviceName || 'Dịch vụ'} 
                          <Tag color="blue" className="ml-2">x{service.quantity}</Tag>
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Package stats */}
                <div className="flex gap-4 text-sm">
                  <Space>
                    <StarOutlined className="text-yellow-500" />
                    <Text>Đánh giá: 4.8/5</Text>
                  </Space>
                  <Space>
                    <Text>Thời hạn: {servicePackage.durationInDays} ngày</Text>
                  </Space>
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-right">
                {/* Discount display */}
                {calculateDiscount() > 0 && (
                  <div className="mb-2">
                    <Text delete className="text-gray-500">
                      {formatPrice(servicePackage.priceBeforeDiscount)} VNĐ
                    </Text>
                    <Tag color="red" className="ml-2">
                      -{calculateDiscount()}%
                    </Tag>
                  </div>
                )}
                
                {/* Current price */}
                <div>
                  <Title level={3} className="mb-0 text-blue-600">
                    {formatPrice(servicePackage.price)} VNĐ
                  </Title>
                </div>

                {/* Savings */}
                {calculateDiscount() > 0 && (
                  <Text className="text-green-600 text-sm font-medium">
                    Tiết kiệm {formatPrice(servicePackage.priceBeforeDiscount - servicePackage.price)} VNĐ
                  </Text>
                )}
              </div>
            </Col>
          </Row>
        </Card>

        {/* Purchase Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePurchase}
        >
          <Alert
            message="Chọn hồ sơ sử dụng gói dịch vụ"
            description="Gói dịch vụ sẽ được gắn với hồ sơ được chọn và chỉ có thể sử dụng cho hồ sơ này."
            type="info"
            showIcon
            className="mb-4"
          />

          <Form.Item
            name="userProfileId"
            label="Chọn hồ sơ sử dụng gói"
            rules={[
              { required: true, message: 'Vui lòng chọn hồ sơ để sử dụng gói dịch vụ' }
            ]}
          >
            <Select
              placeholder="Chọn hồ sơ người sử dụng"
              loading={profilesLoading}
              size="large"
              showSearch
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
            >
              {userProfiles.map((profile) => (
                <Option key={profile._id} value={profile._id}>
                  <Space>
                    <UserOutlined />
                    <span>{profile.fullName}</span>
                    {profile.isDefault && <Tag color="blue">Mặc định</Tag>}
                    <Text type="secondary">({profile.phone || 'Chưa có SĐT'})</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          {/* Payment summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Title level={5} className="mb-3">
              <CreditCardOutlined className="mr-2" />
              Thông tin thanh toán
            </Title>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text>Giá gói dịch vụ:</Text>
                <Text>{formatPrice(servicePackage.price)} VNĐ</Text>
              </div>
              {calculateDiscount() > 0 && (
                <div className="flex justify-between text-green-600">
                  <Text>Tiết kiệm:</Text>
                  <Text>-{formatPrice(servicePackage.priceBeforeDiscount - servicePackage.price)} VNĐ</Text>
                </div>
              )}
              <Divider className="my-2" />
              <div className="flex justify-between">
                <Text strong>Tổng thanh toán:</Text>
                <Text strong className="text-blue-600 text-lg">
                  {formatPrice(servicePackage.price)} VNĐ
                </Text>
              </div>
            </div>
          </div>

          <Divider />

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <Button size="large" onClick={handleCancel}>
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              icon={<CreditCardOutlined />}
              className="px-8"
            >
              {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default PackagePurchaseModal; 