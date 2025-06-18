import {
    ClockCircleOutlined,
    EnvironmentOutlined,
    StarOutlined
} from '@ant-design/icons';
import { Button, Card } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '../../../types';

interface ServiceDisplayCardProps {
  service: Service;
  className?: string;
  showBookingButton?: boolean;
  onBookingClick?: (service: Service) => void;
}

const ServiceDisplayCard: React.FC<ServiceDisplayCardProps> = ({ 
  service, 
  className = '',
  showBookingButton = true,
  onBookingClick
}) => {
  const navigate = useNavigate();

  // Format price - Định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Get service type icon - Lấy icon theo loại dịch vụ
  const getServiceTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'consultation':
        return '👩‍⚕️';
      case 'test':
        return '🔬';
      case 'treatment':
        return '💉';
      case 'checkup':
        return '🩺';
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
      case 'checkup':
        return 'Khám sức khỏe';
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

  // Handle booking - Xử lý đặt lịch
  const handleBooking = () => {
    if (onBookingClick) {
      onBookingClick(service);
    } else {
      navigate('/booking', { 
        state: { 
          selectedService: service,
          serviceType: service.serviceType 
        } 
      });
    }
  };

  return (
    <Card
      hoverable
      className={`medical-service-display-card h-full rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group ${className}`}
      cover={
        <div className="relative h-40 bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center overflow-hidden">
          {/* Background Pattern - Họa tiết nền */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23006478' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Service Icon (luôn hiển thị, không dùng ảnh) */}
          <div className="text-center">
            <div className="text-7xl text-[#2A7F9E]/30 group-hover:scale-110 transition-transform duration-300">
              {getServiceTypeIcon(service.serviceType)}
            </div>
          </div>

          {/* Service Type Badge - Nhãn loại dịch vụ */}
          <div className="absolute top-3 left-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
              <span className="text-xs font-medium text-[#2A7F9E] flex items-center gap-1">
                <span>{getServiceTypeIcon(service.serviceType)}</span>
                {getServiceTypeLabel(service.serviceType)}
              </span>
            </div>
          </div>

          {/* Status Badge - Nhãn trạng thái */}
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
        </div>
      }
    >
      <div className="p-5">
        {/* Service Name - Tên dịch vụ */}
        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
          {service.serviceName}
        </h3>

        {/* Service Description - Mô tả dịch vụ */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {service.description || 'Dịch vụ chăm sóc sức khỏe chuyên nghiệp với đội ngũ y bác sĩ giàu kinh nghiệm.'}
        </p>

        {/* Service Details - Chi tiết dịch vụ */}
        <div className="space-y-3 mb-4">
          {/* Available Location - Địa điểm có sẵn */}
          <div className="flex items-center gap-2 text-sm">
            <EnvironmentOutlined className="text-[#2A7F9E]" />
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

          {/* Duration - Thời gian */}
          <div className="flex items-center gap-2 text-sm">
            <ClockCircleOutlined className="text-[#2A7F9E]" />
            <span className="text-gray-600">
              {service.duration ? `${service.duration} phút` : 'Thời gian linh hoạt'}
            </span>
          </div>
        </div>

        {/* Price - Giá tiền */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-200/50 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-[#2A7F9E]">
                {service.price ? formatPrice(service.price) : 'Liên hệ'}
              </span>
              {service.price && <span className="text-gray-500 ml-1">VNĐ</span>}
            </div>
            <div className="flex items-center gap-1">
              <StarOutlined className="text-yellow-500 text-sm" />
              <span className="text-sm text-gray-600 font-medium">4.8</span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Nút hành động */}
        {showBookingButton && (
          <div className="flex gap-3">
            <Button
              type="primary"
              className="flex-1 bg-[#2A7F9E] hover:bg-[#0C3C54] border-[#2A7F9E] hover:border-[#0C3C54] rounded-xl h-11 font-medium"
              onClick={handleBooking}
            >
              Đặt lịch ngay
            </Button>
            <Button
              className="border-[#2A7F9E] text-[#2A7F9E] hover:bg-[#2A7F9E] hover:text-white rounded-xl h-11 font-medium px-4"
              onClick={() => navigate(`/services/${service._id}`)}
            >
              Chi tiết
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ServiceDisplayCard; 