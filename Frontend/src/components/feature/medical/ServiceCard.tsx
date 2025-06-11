import {
    ClockCircleOutlined,
    CustomerServiceOutlined,
    EnvironmentOutlined,
    HeartOutlined,
    StarOutlined
} from '@ant-design/icons';
import { Button, Card, Tag } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '../../../types';

interface ServiceCardProps {
  service: Service;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  service, 
  onEdit, 
  onDelete, 
  className = '' 
}) => {
  const navigate = useNavigate();

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Get service type icon
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

  // Get service type label
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

  // Get available location icon
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

  // Get available location label
  const getLocationLabel = (location: string | undefined) => {
    if (!location) return 'Chưa xác định';
    
    switch (location.toLowerCase()) {
      case 'athome':
        return 'Tại nhà';
      case 'online':
        return 'Trực tuyến';
      case 'center':
        return 'Tại trung tâm';
      default:
        return location;
    }
  };

  const handleBooking = () => {
    navigate('/booking', { 
      state: { 
        selectedService: service,
        serviceType: service.serviceType 
      } 
    });
  };

  return (
    <Card
      hoverable
      className={`medical-service-card h-full rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group ${className}`}
      cover={
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23006478' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Service Image or Icon */}
          {service.image ? (
            <img
              src={service.image}
              alt={service.serviceName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="text-6xl text-blue-primary/20 group-hover:scale-110 transition-transform duration-300">
              {getServiceTypeIcon(service.serviceType)}
            </div>
          )}

          {/* Service Type Badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
              <span className="text-xs font-medium text-blue-primary flex items-center gap-1">
                <span>{getServiceTypeIcon(service.serviceType)}</span>
                {getServiceTypeLabel(service.serviceType)}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {service.isActive && (
            <div className="absolute top-3 right-3">
              <div className="bg-green-500/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
                <span className="text-xs font-medium text-white flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Đang phục vụ
                </span>
              </div>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      }
    >
      <div className="p-4">
        {/* Service Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
          {service.serviceName}
        </h3>

        {/* Service Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
          {service.description || 'Dịch vụ chăm sóc sức khỏe chuyên nghiệp với đội ngũ y bác sĩ giàu kinh nghiệm.'}
        </p>

        {/* Service Details */}
        <div className="space-y-2 mb-4">
          {/* Available Location */}
          <div className="flex items-center gap-2 text-sm">
            <EnvironmentOutlined className="text-blue-primary" />
            <span className="text-gray-600">
              {service.availableAt && service.availableAt.length > 0 ? (
                <>
                  {getLocationIcon(service.availableAt[0])} {getLocationLabel(service.availableAt[0])}
                  {service.availableAt.length > 1 && (
                    <span className="text-xs text-gray-400 ml-1">
                      +{service.availableAt.length - 1} khác
                    </span>
                  )}
                </>
              ) : (
                <>📍 Chưa xác định</>
              )}
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-sm">
            <ClockCircleOutlined className="text-blue-primary" />
            <span className="text-gray-600">
              {service.duration ? `${service.duration} phút` : 'Thời gian linh hoạt'}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-blue-primary">
              {formatPrice(service.price)}
            </span>
            <span className="text-gray-500 ml-1">VNĐ</span>
          </div>
          <div className="flex items-center gap-1">
            <StarOutlined className="text-yellow-500 text-sm" />
            <span className="text-sm text-gray-600">4.8</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            type="primary"
            className="flex-1 bg-blue-primary hover:bg-blue-secondary border-blue-primary hover:border-blue-secondary rounded-xl h-10 font-medium"
            onClick={handleBooking}
            icon={<HeartOutlined />}
          >
            Đặt lịch ngay
          </Button>
          
          <Button
            className="px-3 rounded-xl border-gray-300 hover:border-blue-primary hover:text-blue-primary"
            icon={<CustomerServiceOutlined />}
            onClick={() => navigate('/counselors')}
          />
        </div>

        {/* Additional Tags */}
        {service.specialRequirements && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              <Tag 
                color="blue" 
                className="text-xs rounded-md border-0 bg-blue-50 text-blue-600"
              >
                Yêu cầu đặc biệt
              </Tag>
            </div>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
    </Card>
  );
};

export default ServiceCard; 