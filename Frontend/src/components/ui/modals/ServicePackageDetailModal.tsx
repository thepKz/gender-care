import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseOutlined,
    DollarOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';
import { Divider, Modal, Tag, Typography } from 'antd';
import React from 'react';
import { Service, ServicePackage } from '../../../types';

const { Title, Text } = Typography;

interface ServicePackageDetailModalProps {
  visible: boolean;
  onClose: () => void;
  servicePackage: ServicePackage | null;
}

const ServicePackageDetailModal: React.FC<ServicePackageDetailModalProps> = ({
  visible,
  onClose,
  servicePackage
}) => {
  if (!servicePackage) return null;

  // Format price - Định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Calculate discount percentage
  const discountPercentage = Math.round(
    ((servicePackage.priceBeforeDiscount - servicePackage.price) / servicePackage.priceBeforeDiscount) * 100
  );

  // Get service type icon - Lấy icon theo loại dịch vụ
  const getServiceTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'consultation':
        return '👩‍⚕️';
      case 'test':
        return '🔬';
      case 'treatment':
        return '💉';
      default:
        return '🏥';
    }
  };

  // Get service type label - Lấy nhãn theo loại dịch vụ
  const getServiceTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'consultation':
        return 'Tư vấn';
      case 'test':
        return 'Xét nghiệm';
      case 'treatment':
        return 'Điều trị';
      default:
        return 'Khác';
    }
  };

  // Get available location icon - Lấy icon theo địa điểm
  const getLocationIcon = (location: string | undefined) => {
    if (!location) return '📍';
    
    switch (location.toLowerCase()) {
      case 'athome':
        return '🏠';
      case 'online':
        return '💻';
      case 'center':
        return '🏥';
      default:
        return '📍';
    }
  };

  // Get available location label - Lấy nhãn theo địa điểm
  const getLocationLabel = (location: string | undefined) => {
    if (!location) return 'Chưa xác định';
    
    switch (location.toLowerCase()) {
      case 'center':
        return 'Tại trung tâm';
      default:
        return location;
    }
  };

  // Get services from serviceIds (handle both string and Service object)
  const getServices = (): Service[] => {
    return servicePackage.serviceIds.filter(service => 
      typeof service === 'object' && service !== null
    ) as Service[];
  };

  const services = getServices();

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="service-package-detail-modal"
      closeIcon={<CloseOutlined className="text-gray-400 hover:text-gray-600" />}
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <Title level={3} className="mb-2 text-gray-900">
                {servicePackage.name}
              </Title>
              <Text className="text-gray-600 leading-relaxed">
                {servicePackage.description}
              </Text>
            </div>
            <div className="flex-shrink-0">
              {discountPercentage > 0 && (
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  -{discountPercentage}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Section */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-xl border border-green-200/50 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarOutlined className="text-green-primary" />
            <Text strong className="text-green-primary font-semibold">
              Giá ưu đãi đặc biệt
            </Text>
          </div>
          
          <div className="space-y-2">
            {discountPercentage > 0 && (
              <div className="flex items-center gap-2">
                <Text delete type="secondary" className="text-sm font-medium">
                  {formatPrice(servicePackage.priceBeforeDiscount)} VNĐ
                </Text>
                <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  -{discountPercentage}%
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Text strong className="text-2xl text-green-primary font-bold">
                {formatPrice(servicePackage.price)} VNĐ
              </Text>
              
              {discountPercentage > 0 && (
                <div className="text-right">
                  <div className="text-xs text-green-600 font-medium">Tiết kiệm</div>
                  <div className="text-sm font-bold text-red-500">
                    {formatPrice(servicePackage.priceBeforeDiscount - servicePackage.price)} VNĐ
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Divider orientation="left">
          <span className="text-gray-700 font-semibold">
            Bao gồm {services.length} dịch vụ
          </span>
        </Divider>

        {/* Services List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {services.map((service, index) => (
            <div
              key={service._id || index}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-4">
                {/* Service Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">
                      {getServiceTypeIcon(service.serviceType)}
                    </span>
                  </div>
                </div>

                {/* Service Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Title level={5} className="mb-1 text-gray-900">
                        {service.serviceName}
                      </Title>
                      <Text className="text-gray-600 text-sm">
                        {service.description}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text strong className="text-blue-primary">
                        {formatPrice(service.price)} VNĐ
                      </Text>
                    </div>
                  </div>

                  {/* Service Meta */}
                  <div className="flex items-center gap-4 text-sm">
                    {/* Service Type */}
                    <Tag
                      color="blue"
                      className="rounded-md border-0"
                    >
                      {getServiceTypeIcon(service.serviceType)} {getServiceTypeLabel(service.serviceType)}
                    </Tag>

                    {/* Available Location */}
                    {service.availableAt && service.availableAt.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <EnvironmentOutlined className="text-blue-primary" />
                        <span>
                          {getLocationIcon(service.availableAt[0])} {getLocationLabel(service.availableAt[0])}
                          {service.availableAt.length > 1 && (
                            <span className="text-xs text-gray-400 ml-1">
                              +{service.availableAt.length - 1}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Package Benefits */}
        <div className="mt-6 bg-blue-50 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircleOutlined className="text-blue-primary" />
            <Text strong className="text-blue-primary">
              Ưu điểm của gói dịch vụ
            </Text>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700">Tiết kiệm chi phí</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700">Chăm sóc toàn diện</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700">Ưu tiên đặt lịch</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-700">Hỗ trợ tư vấn 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ServicePackageDetailModal; 