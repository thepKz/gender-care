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
        return 'Dịch vụ y tế';
    }
  };

  // Get service type gradient - Lấy gradient theo loại dịch vụ
  const getServiceTypeGradient = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'consultation':
        return 'from-blue-50 to-indigo-100';
      case 'test':
        return 'from-green-50 to-emerald-100';
      case 'treatment':
        return 'from-purple-50 to-violet-100';
      case 'checkup':
        return 'from-cyan-50 to-blue-100';
      default:
        return 'from-gray-50 to-slate-100';
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
      className={`medical-service-display-card h-full rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden group backdrop-blur-sm ${className}`}
      cover={
        <div className={`relative h-48 bg-gradient-to-br ${getServiceTypeGradient(service.serviceType)} flex flex-col justify-between p-6 overflow-hidden`}>
          {/* Subtle geometric pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Service Type Badge - Minimalist */}
          <div className="relative z-10">
            <div className="inline-block">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-sm border border-white/20">
                <span className="text-sm font-semibold text-gray-700 tracking-wide">
                  {getServiceTypeLabel(service.serviceType)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge - Elegant */}
          {service.isDeleted === 0 && (
            <div className="relative z-10 self-end">
              <div className="bg-emerald-500/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-sm border border-emerald-400/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-white tracking-wide">
                    Có sẵn
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Floating decorative elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full blur-2xl" />
        </div>
      }
    >
      <div className="p-6">
        {/* Service Name - Tên dịch vụ */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem] leading-tight tracking-tight">
          {service.serviceName}
        </h3>

        {/* Service Description - Mô tả dịch vụ */}
        <p className="text-gray-600 text-sm mb-6 line-clamp-3 min-h-[3.75rem] leading-relaxed">
          {service.description || 'Dịch vụ chăm sóc sức khỏe chuyên nghiệp với đội ngũ y bác sĩ giàu kinh nghiệm.'}
        </p>

        {/* Service Details - Chi tiết dịch vụ */}
        <div className="space-y-3 mb-6">
          {/* Available Location - Địa điểm có sẵn */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            <span className="text-gray-700 text-sm font-medium">
              {service.availableAt && service.availableAt.length > 0 ? (
                <>
                  {getLocationLabel(service.availableAt[0])}
                  {service.availableAt.length > 1 && (
                    <span className="text-gray-400 ml-1">
                      & {service.availableAt.length - 1} hình thức khác
                    </span>
                  )}
                </>
              ) : (
                'Chưa xác định'
              )}
            </span>
          </div>

          {/* Quality Assurance */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
            <span className="text-gray-700 text-sm font-medium">
              Đảm bảo chất lượng
            </span>
          </div>
        </div>

        {/* Price Section - Minimalist */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-6 rounded-3xl mb-6 border border-gray-200/50">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1 font-medium tracking-wider uppercase">
                Giá dịch vụ
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 tracking-tight">
                  {service.price ? formatPrice(service.price) : 'Liên hệ'}
                </span>
                {service.price && <span className="text-gray-500 text-sm font-medium">VNĐ</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1 font-medium tracking-wider uppercase">
                Đánh giá
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-amber-500">4.8</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${i < 4 ? 'bg-amber-400' : 'bg-gray-300'} mr-0.5`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Elegant & Minimalist */}
        {showBookingButton && (
          <div className="flex gap-3">
            <Button
              type="primary"
              className="flex-1 bg-gray-900 hover:bg-gray-800 border-gray-900 hover:border-gray-800 rounded-2xl h-12 font-semibold text-sm tracking-wide transition-all duration-300 shadow-sm hover:shadow-md"
              onClick={handleBooking}
            >
              Đặt lịch ngay
            </Button>
            <Button
              className="border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 rounded-2xl h-12 font-semibold px-6 text-sm tracking-wide transition-all duration-300"
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