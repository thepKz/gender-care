import { Button, Card } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServicePackage } from '../../../types';
import ServicePackageDetailModal from '../../ui/modals/ServicePackageDetailModal';
import PackagePurchaseModal from '../../ui/modals/PackagePurchaseModal';
import { useAuth } from '../../../hooks/useAuth';

interface ServicePackageDisplayCardProps {
  servicePackage: ServicePackage;
  className?: string;
  showBookingButton?: boolean;
  onBookingClick?: (servicePackage: ServicePackage) => void;
  onViewDetail?: (servicePackage: ServicePackage) => void;
}

const ServicePackageDisplayCard: React.FC<ServicePackageDisplayCardProps> = ({ 
  servicePackage, 
  className = '',
  showBookingButton = true,
  onBookingClick,
  onViewDetail
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Format price - Định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Calculate discount percentage
  const discountPercentage = Math.round(
    ((servicePackage.priceBeforeDiscount - servicePackage.price) / servicePackage.priceBeforeDiscount) * 100
  );

  // Get package gradient based on discount level
  const getPackageGradient = (discount: number) => {
    if (discount >= 30) return 'from-rose-50 to-pink-100';
    if (discount >= 20) return 'from-orange-50 to-amber-100';
    if (discount >= 10) return 'from-emerald-50 to-green-100';
    return 'from-blue-50 to-indigo-100';
  };

  // Handle booking - Xử lý mua gói dịch vụ
  const handleBooking = () => {
    if (onBookingClick) {
      onBookingClick(servicePackage);
    } else {
      // Check authentication first
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      
      // Show purchase modal instead of going to booking page
      setShowPurchaseModal(true);
    }
  };

  // Handle purchase success
  const handlePurchaseSuccess = (purchaseId: string) => {
    console.log('✅ Package purchased successfully:', purchaseId);
    // Redirect to purchased packages page or booking page
    navigate('/purchased-packages');
  };

  // Handle view detail - Xử lý xem chi tiết
  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail(servicePackage);
    } else {
      setShowDetailModal(true);
    }
  };

  return (
    <>
    <Card
      hoverable
      className={`medical-service-package-display-card h-full rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden group backdrop-blur-sm ${className}`}
      cover={
        <div className={`relative h-48 bg-gradient-to-br ${getPackageGradient(discountPercentage)} flex flex-col justify-between p-6 overflow-hidden`}>
          {/* Subtle geometric pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M15 15L45 45M45 15L15 45' stroke='%23000' stroke-width='0.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Package Type Badge - Minimalist */}
          <div className="relative z-10">
            <div className="inline-block">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-sm border border-white/20">
                <span className="text-sm font-semibold text-gray-700 tracking-wide">
                  Gói dịch vụ
                </span>
              </div>
            </div>
          </div>

          {/* Discount Badge - Modern & Elegant */}
          {discountPercentage > 0 && (
            <div className="relative z-10 self-end">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 backdrop-blur-md rounded-2xl px-4 py-2 shadow-sm border border-red-400/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-white tracking-wide">
                    -{discountPercentage}%
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
        {/* Package Name - Tên gói dịch vụ */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem] leading-tight tracking-tight">
          {servicePackage.name}
        </h3>

        {/* Package Description - Mô tả gói dịch vụ */}
        <p className="text-gray-600 text-sm mb-6 line-clamp-3 min-h-[3.75rem] leading-relaxed">
          {servicePackage.description || 'Gói dịch vụ chăm sóc sức khỏe toàn diện với các dịch vụ chuyên nghiệp.'}
        </p>

        {/* Package Details - Chi tiết gói dịch vụ */}
        <div className="space-y-3 mb-6">
          {/* View Details */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
            <button
              onClick={handleViewDetail}
              className="text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors duration-200 flex-1 text-left"
            >
              {servicePackage.services?.length || 0} dịch vụ trong gói
            </button>
          </div>

          {/* Total Service Quantity */}
          {servicePackage.totalServiceQuantity && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              <span className="text-gray-700 text-sm font-medium">
                {servicePackage.totalServiceQuantity} lượt sử dụng
              </span>
            </div>
          )}

          {/* Duration */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
            <span className="text-gray-700 text-sm font-medium">
              Thời hạn {servicePackage.durationInDays} ngày
            </span>
          </div>
        </div>

        {/* Price Section - Premium Design */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-6 rounded-3xl mb-6 border border-gray-200/50">
          {/* Original Price & Discount - If applicable */}
          {discountPercentage > 0 && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 line-through font-medium">
                  {formatPrice(servicePackage.priceBeforeDiscount)} VNĐ
                </span>
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  -{discountPercentage}%
                </div>
              </div>
              <span className="text-xs text-emerald-600 font-semibold">
                Tiết kiệm {formatPrice(servicePackage.priceBeforeDiscount - servicePackage.price)} VNĐ
              </span>
            </div>
          )}
          
          {/* Current Price & Rating */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1 font-medium tracking-wider uppercase">
                Giá gói dịch vụ
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 tracking-tight">
                  {formatPrice(servicePackage.price)}
                </span>
                <span className="text-gray-500 text-sm font-medium">VNĐ</span>
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

        {/* Action Buttons - Premium Design */}
        {showBookingButton && (
          <div className="flex gap-3">
            <Button
              type="primary"
              className="flex-1 bg-gray-900 hover:bg-gray-800 border-gray-900 hover:border-gray-800 rounded-2xl h-12 font-semibold text-sm tracking-wide transition-all duration-300 shadow-sm hover:shadow-md"
              onClick={handleBooking}
            >
              Đặt gói ngay
            </Button>
            <Button
              className="border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 rounded-2xl h-12 font-semibold px-6 text-sm tracking-wide transition-all duration-300"
              onClick={handleViewDetail}
            >
              Chi tiết
            </Button>
          </div>
        )}
      </div>
    </Card>

    {/* Service Package Detail Modal */}
    <ServicePackageDetailModal
      visible={showDetailModal}
      onClose={() => setShowDetailModal(false)}
      servicePackage={servicePackage}
    />

    {/* Package Purchase Modal */}
    <PackagePurchaseModal
      visible={showPurchaseModal}
      onCancel={() => setShowPurchaseModal(false)}
      servicePackage={servicePackage}
      onPurchaseSuccess={handlePurchaseSuccess}
    />
    </>
  );
};

export default ServicePackageDisplayCard; 