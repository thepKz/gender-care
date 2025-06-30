import React from 'react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: {
    online: number;
    clinic: number;
    home?: number;
  };
  duration: string;
  category: string;
}

interface ServiceSelectionProps {
  services: Service[];
  selectedService: string;
  onServiceSelect: (serviceId: string) => void;
  isLoading?: boolean;
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({
  services,
  selectedService,
  onServiceSelect,
  isLoading = false
}) => {
  const getServiceEmoji = (category: string) => {
    switch (category) {
      case 'consultation':
        return '💬';
      case 'test':
        return '🧪';
      case 'package':
        return '📦';
      default:
        return '🏥';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Đang tải dịch vụ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Chọn dịch vụ</h2>
      
      <div className="grid gap-3 max-h-64 overflow-y-auto">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => onServiceSelect(service.id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedService === service.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getServiceEmoji(service.category)}</span>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 mb-1">{service.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{service.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{service.duration}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">
                      {formatPrice(service.price.clinic)}
                    </div>
                    <div className="text-xs text-gray-500">Tại phòng khám</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceSelection; 