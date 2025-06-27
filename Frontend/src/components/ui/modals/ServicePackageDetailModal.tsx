import { Modal, Button, Divider, Tag } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServicePackage } from '../../../types';
import PurchasePackageModal from './PurchasePackageModal';

interface ServicePackageDetailModalProps {
  visible: boolean;
  onClose: () => void;
  servicePackage: ServicePackage;
  onBookingClick?: (servicePackage: ServicePackage) => void;
}

const ServicePackageDetailModal: React.FC<ServicePackageDetailModalProps> = ({
  visible,
  onClose,
  servicePackage,
  onBookingClick
}) => {
  const navigate = useNavigate();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handlePurchaseClick = () => {
    setShowPurchaseModal(true);
  };
  const handleClosePurchaseModal = () => {
    setShowPurchaseModal(false);
  };

  if (!servicePackage) return null;

  // Format price - Định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Calculate total price of individual services
  const calculateOriginalPrice = () => {
    if (!servicePackage.services) return 0;
    return servicePackage.services.reduce((total, service) => total + (service.price || 0), 0);
  };

  // Calculate savings
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

  // Handle booking
  const handleBooking = () => {
    if (onBookingClick) {
      onBookingClick(servicePackage);
    } else {
      navigate('/booking', { 
        state: { 
          selectedPackage: servicePackage,
          bookingType: 'package'
        } 
      });
    }
    onClose();
  };

  const originalPrice = calculateOriginalPrice();
  const savings = calculateSavings();
  const discountPercentage = calculateDiscountPercentage();

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      title={<span className="font-bold text-lg">Chi tiết gói dịch vụ</span>}
    >
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{servicePackage.name}</h2>
          <div className="text-gray-600 mb-2">{servicePackage.description || 'Gói dịch vụ chăm sóc sức khỏe toàn diện'}</div>
          <div className="flex justify-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{servicePackage.services?.length || 0}</div>
              <div className="text-xs text-gray-500">Dịch vụ</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{servicePackage.durationInDays}</div>
              <div className="text-xs text-gray-500">Ngày</div>
            </div>
          </div>
          <div className="text-xl font-bold text-blue-700 mb-2">{servicePackage.price ? `${servicePackage.price.toLocaleString()} VNĐ` : 'Liên hệ'}</div>
        </div>
        {/* Services List */}
        {servicePackage.services && servicePackage.services.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="font-semibold mb-2 text-gray-700">Danh sách dịch vụ:</div>
            <ul className="space-y-1 text-sm">
              {servicePackage.services.map((item, idx) => {
                const service = typeof item.serviceId === 'object' ? item.serviceId : null;
                return (
                  <li key={idx} className="flex justify-between items-center py-1 border-b last:border-b-0">
                    <span>{service?.serviceName || 'Dịch vụ'}</span>
                    <span className="text-gray-500">{item.quantity} lượt</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {/* Nút Mua ngay */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 px-8 rounded-full transition-all duration-200 text-base"
            onClick={handlePurchaseClick}
          >
            Mua ngay
          </button>
        </div>
      </div>
      {/* Modal thanh toán */}
      <PurchasePackageModal
        visible={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        servicePackage={servicePackage}
      />
    </Modal>
  );
};

export default ServicePackageDetailModal; 