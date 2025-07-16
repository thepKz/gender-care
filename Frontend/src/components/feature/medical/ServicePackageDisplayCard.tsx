import React, { useState } from 'react';
import { ServicePackage, Service } from '../../../types';
import ServicePackageDetailModal from '../../ui/modals/ServicePackageDetailModal';

interface ServicePackageDisplayCardProps {
  servicePackage: ServicePackage;
  className?: string;
  onBookingClick?: (servicePackage: ServicePackage) => void;
  onPurchaseClick?: (servicePackage: ServicePackage) => void;
}

const ServicePackageDisplayCard: React.FC<ServicePackageDisplayCardProps> = ({
  servicePackage,
  className = '',
  onBookingClick,
  onPurchaseClick
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Format price - Định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Calculate total price of individual services
  const calculateOriginalPrice = () => {
    if (!servicePackage.services) return 0;
    return servicePackage.services.reduce((total, serviceItem) => {
      if (typeof serviceItem.serviceId === 'object' && serviceItem.serviceId !== null) {
        const service = serviceItem.serviceId as Service;
        return total + (service.price || 0) * serviceItem.quantity;
      }
      return total;
    }, 0);
  };

  // Calculate savings amount
  const calculateSavings = () => {
    const originalPrice = calculateOriginalPrice();
    const packagePrice = servicePackage.price || 0;
    return originalPrice - packagePrice;
  };

  // Calculate discount percentage
  const calculateDiscountPercentage = () => {
    const originalPrice = calculateOriginalPrice();
    const savings = calculateSavings();
    if (originalPrice === 0) return 0;
    return Math.round((savings / originalPrice) * 100);
  };

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const originalPrice = calculateOriginalPrice();
  const savings = calculateSavings();
  const discountPercentage = calculateDiscountPercentage();

  return (
    <>
      <div
        className={`
          relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300
          cursor-pointer overflow-hidden group h-full
          ${className}
        `}
        onClick={handleCardClick}
      >
        {/* Animated Background Elements */}
        <div className="relative z-10 p-6 text-gray-900 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Gói dịch vụ</span>
            {discountPercentage > 0 && (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">-{discountPercentage}%</span>
            )}
          </div>
          <h3 className="text-xl font-bold mb-3 leading-tight group-hover:scale-100 transition-none">
            {servicePackage.name}
          </h3>
          {/* Description */}
          <div className="flex-1 mb-4">
            <p className="text-sm leading-relaxed text-gray-600 line-clamp-3">
              {servicePackage.description || 'Gói dịch vụ chăm sóc sức khỏe toàn diện với chất lượng cao và giá trị tối ưu.'}
            </p>
          </div>
          {/* Services Count & Info */}
          {servicePackage.services && servicePackage.services.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold mb-1 text-blue-600">
                    {servicePackage.services.length}
                  </div>
                  <div className="text-xs text-gray-500">Dịch vụ</div>
                </div>
                <div>
                  <div className="text-lg font-bold mb-1 text-yellow-600">4.9</div>
                  <div className="text-xs text-gray-500">Đánh giá ⭐</div>
                </div>
              </div>
            </div>
          )}
          {/* Price Section */}
          <div className="mb-4">
            <div className="text-center">
              {originalPrice > 0 && savings > 0 && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-sm line-through text-gray-400">
                    {formatPrice(originalPrice)} VNĐ
                  </span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
                    Tiết kiệm {formatPrice(savings)} VNĐ
                  </span>
                </div>
              )}
              <div className="text-2xl font-bold mb-1 text-blue-700">
                {servicePackage.price ? formatPrice(servicePackage.price) : 'Liên hệ'}
              </div>
              {servicePackage.price && (
                <div className="text-xs text-gray-500">VNĐ</div>
              )}
            </div>
          </div>
          {/* Benefits Highlights */}
          <div className="mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-2 h-2 bg-yellow-300 rounded-full"></span>
                <span>Ưu tiên đặt lịch</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-2 h-2 bg-yellow-300 rounded-full"></span>
                <span>Chăm sóc VIP 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-2 h-2 bg-yellow-300 rounded-full"></span>
                <span>Bảo hành kết quả</span>
              </div>
            </div>
          </div>
          {/* Nút Mua ngay */}
          <div className="mt-auto flex justify-center">
            <button
              type="button"
              className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 px-6 rounded-full transition-all duration-200 text-sm"
              onClick={e => {
                e.stopPropagation();
                setIsModalVisible(true); // Luôn mở modal chi tiết
              }}
            >
              Nhấp để xem chi tiết →
            </button>
          </div>
        </div>
      </div>

      {/* Service Package Detail Modal */}
      <ServicePackageDetailModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        servicePackage={servicePackage}
        onBookingClick={onBookingClick}
      />
    </>
  );
};

export default ServicePackageDisplayCard; 