import React, { useState } from 'react';
import { Service } from '../../../types';
import ServiceDetailModal from '../../ui/modals/ServiceDetailModal';

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
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Format price - Định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Get service type info for styling
  const getServiceTypeInfo = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'consultation':
        return {
          label: 'Tư vấn',
          gradient: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200',
          pattern: 'bg-blue-100'
        };
      case 'test':
        return {
          label: 'Xét nghiệm',
          gradient: 'from-emerald-500 to-emerald-600',
          bg: 'bg-emerald-50',
          text: 'text-emerald-600',
          border: 'border-emerald-200',
          pattern: 'bg-emerald-100'
        };
      case 'treatment':
        return {
          label: 'Điều trị',
          gradient: 'from-purple-500 to-purple-600',
          bg: 'bg-purple-50',
          text: 'text-purple-600',
          border: 'border-purple-200',
          pattern: 'bg-purple-100'
        };
      case 'checkup':
        return {
          label: 'Khám sức khỏe',
          gradient: 'from-orange-500 to-orange-600',
          bg: 'bg-orange-50',
          text: 'text-orange-600',
          border: 'border-orange-200',
          pattern: 'bg-orange-100'
        };
      default:
        return {
          label: 'Dịch vụ y tế',
          gradient: 'from-gray-500 to-gray-600',
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          pattern: 'bg-gray-100'
        };
    }
  };

  // Get location labels
  const getLocationLabels = (locations: string[] | string | undefined) => {
    if (!locations) return [];
    
    const locationArray = Array.isArray(locations) ? locations : [locations];
    
    return locationArray.map(location => {
      switch (location?.toLowerCase()) {
        case 'athome':
          return 'Tại nhà';
        case 'online':
          return 'Trực tuyến';
        case 'center':
          return 'Tại trung tâm';
        default:
          return location || 'Khác';
      }
    });
  };

  const typeInfo = getServiceTypeInfo(service.serviceType);
  const locationLabels = getLocationLabels(service.availableAt);

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <div
        className={`
          relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 
          cursor-pointer transform hover:scale-105 overflow-hidden group h-full
          ${typeInfo.border} border-2 hover:border-opacity-50
          ${className}
        `}
        onClick={handleCardClick}
      >
        {/* Header với service type */}
        <div className={`${typeInfo.bg} p-6 relative overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${typeInfo.pattern} transform translate-x-8 -translate-y-8`} />
            <div className={`absolute bottom-0 left-0 w-16 h-16 rounded-full ${typeInfo.pattern} transform -translate-x-6 translate-y-6`} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${typeInfo.bg} ${typeInfo.text} border ${typeInfo.border}`}>
                {typeInfo.label}
              </span>
            </div>
            
            <h3 className={`text-xl font-bold ${typeInfo.text} mb-2 group-hover:scale-105 transition-transform duration-300`}>
              {service.serviceName}
            </h3>
            
            {/* Location badges */}
            {locationLabels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {locationLabels.map((location, index) => (
                  <span
                    key={index}
                    className="text-xs bg-white/70 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full font-medium"
                  >
                    {location}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Description */}


          {/* Price Section */}
          <div className={`${typeInfo.bg} border-l-4 border-l-${typeInfo.text.replace('text-', '')} p-4 rounded-r-xl`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                  Chi phí
                </span>
                <div className={`text-2xl font-black ${typeInfo.text}`}>
                  {service.price ? `${formatPrice(service.price)} VNĐ` : 'Liên hệ'}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Đánh giá</div>
                <div className="text-yellow-600 font-bold">4.8 ⭐</div>
              </div>
            </div>
          </div>

          {/* Hover Effect Indicator */}
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors duration-300">
              Nhấp để xem chi tiết →
            </span>
          </div>
        </div>
      </div>

      {/* Service Detail Modal */}
      <ServiceDetailModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        service={service}
        onBookingClick={onBookingClick}
      />
    </>
  );
};

export default ServiceDisplayCard; 