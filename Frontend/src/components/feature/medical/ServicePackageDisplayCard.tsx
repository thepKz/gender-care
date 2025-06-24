import {
    EyeOutlined,
    GiftOutlined,
    StarOutlined
} from '@ant-design/icons';
import { Button, Card } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServicePackage } from '../../../types';
import ServicePackageDetailModal from '../../ui/modals/ServicePackageDetailModal';

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
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Format price - Định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Calculate discount percentage
  const discountPercentage = Math.round(
    ((servicePackage.priceBeforeDiscount - servicePackage.price) / servicePackage.priceBeforeDiscount) * 100
  );

  // Handle booking - Xử lý đặt lịch (điều hướng sang booking page)
  const handleBooking = () => {
    if (onBookingClick) {
      onBookingClick(servicePackage);
    } else {
      // Điều hướng sang booking page với packageId param
      navigate(`/booking?packageId=${servicePackage._id}&type=package`);
    }
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
      className={`medical-service-package-display-card h-full rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group ${className}`}
      cover={
        <div className="relative h-40 bg-gradient-to-br from-green-50 to-cyan-50 flex items-center justify-center overflow-hidden">
          {/* Background Pattern - Họa tiết nền */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23006478' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Icon gói dịch vụ (không dùng ảnh) */}
          <div className="text-center">
            <div className="text-7xl text-[#0C3C54]/30 group-hover:scale-110 transition-transform duration-300">
              🎁
            </div>
          </div>

          {/* Package Type Badge - Nhãn loại gói */}
          <div className="absolute top-3 left-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
              <span className="text-xs font-medium text-[#0C3C54] flex items-center gap-1">
                <GiftOutlined />
                Gói dịch vụ
              </span>
            </div>
          </div>

          {/* Discount Badge - Nhãn giảm giá */}
          {discountPercentage > 0 && (
            <div className="absolute top-3 right-3">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                -{discountPercentage}%
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="p-5">
        {/* Package Name - Tên gói dịch vụ */}
        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
          {servicePackage.name}
        </h3>

        {/* Package Description - Mô tả gói dịch vụ */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {servicePackage.description || 'Gói dịch vụ chăm sóc sức khỏe toàn diện với các dịch vụ chuyên nghiệp.'}
        </p>

        {/* Package Details - Chi tiết gói dịch vụ */}
        <div className="space-y-3 mb-4">
          {/* View Details Link */}
          <div className="flex items-center gap-2 text-sm">
            <EyeOutlined className="text-[#0C3C54]" />
            <button
              onClick={handleViewDetail}
              className="text-[#0C3C54] hover:text-[#2A7F9E] hover:underline font-medium transition-colors duration-200"
            >
              Xem chi tiết {servicePackage.services?.length || 0} dịch vụ
            </button>
          </div>

          {/* Package Benefits */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-500">✓</span>
            <span className="text-gray-600">Tiết kiệm chi phí</span>
          </div>

          {/* 🔹 NEW: Total Service Quantity Display */}
          {servicePackage.totalServiceQuantity && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-500">✓</span>
              <span className="text-gray-600">
                Tổng {servicePackage.totalServiceQuantity} lượt sử dụng
              </span>
            </div>
          )}

          {/* 🔹 NEW: Duration Display */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-purple-500">📅</span>
            <span className="text-gray-600">
              Thời hạn {servicePackage.durationInDays} ngày
            </span>
          </div>
        </div>

        {/* Price - Giá tiền */}
        <div className="bg-gradient-to-br from-green-50 to-cyan-50 p-4 rounded-xl border border-green-200/50 mb-4">
          {/* Original Price & Discount */}
          {discountPercentage > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(servicePackage.priceBeforeDiscount)} VNĐ
              </span>
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                -{discountPercentage}%
              </span>
            </div>
          )}
          
          {/* Current Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-[#0C3C54]">
                {formatPrice(servicePackage.price)}
              </span>
              <span className="text-gray-500 ml-1">VNĐ</span>
            </div>
            <div className="flex items-center gap-1">
              <StarOutlined className="text-yellow-500 text-sm" />
              <span className="text-sm text-gray-600 font-medium">4.8</span>
            </div>
          </div>

          {/* Savings */}
          {discountPercentage > 0 && (
            <div className="text-right mt-1">
              <span className="text-xs text-green-600 font-medium">
                Tiết kiệm {formatPrice(servicePackage.priceBeforeDiscount - servicePackage.price)} VNĐ
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons - Nút hành động */}
        {showBookingButton && (
          <div className="flex gap-3">
            <Button
              type="primary"
              className="flex-1 bg-[#0C3C54] hover:bg-[#2A7F9E] border-[#0C3C54] hover:border-[#2A7F9E] rounded-xl h-11 font-medium"
              onClick={handleBooking}
            >
              Đặt gói ngay
            </Button>
            <Button
              className="border-[#0C3C54] text-[#0C3C54] hover:bg-[#0C3C54] hover:text-white rounded-xl h-11 font-medium px-4"
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
    </>
  );
};

export default ServicePackageDisplayCard; 