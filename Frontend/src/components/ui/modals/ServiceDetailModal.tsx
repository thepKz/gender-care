import { Modal, Button, Divider, Tag } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '../../../types';

interface ServiceDetailModalProps {
  visible: boolean;
  onClose: () => void;
  service: Service;
  onBookingClick?: (service: Service) => void;
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  visible,
  onClose,
  service,
  onBookingClick
}) => {
  const navigate = useNavigate();

  // Format price - Định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Get service type label and color
  const getServiceTypeInfo = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'consultation':
        return { label: 'Tư vấn', color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'test':
        return { label: 'Xét nghiệm', color: 'green', bg: 'bg-emerald-50', text: 'text-emerald-600' };
      case 'treatment':
        return { label: 'Điều trị', color: 'purple', bg: 'bg-purple-50', text: 'text-purple-600' };
      case 'checkup':
        return { label: 'Khám sức khỏe', color: 'orange', bg: 'bg-orange-50', text: 'text-orange-600' };
      default:
        return { label: 'Dịch vụ y tế', color: 'gray', bg: 'bg-gray-50', text: 'text-gray-600' };
    }
  };

  // Get location label
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

  // Handle booking
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
    onClose();
  };

  const typeInfo = getServiceTypeInfo(service.serviceType);

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose
      className="service-detail-modal"
    >
      <div className="p-6">
        {/* Header Section */}
        <div className={`${typeInfo.bg} p-6 rounded-2xl mb-6 relative overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white transform translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white transform -translate-x-12 translate-y-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Tag color={typeInfo.color} className="px-4 py-2 text-sm font-semibold uppercase tracking-wide">
                {typeInfo.label}
              </Tag>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                Đang hoạt động
              </div>
            </div>
            
            <h1 className={`text-3xl font-bold ${typeInfo.text} mb-3`}>
              {service.serviceName}
            </h1>
            
          </div>
        </div>

        {/* Service Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin dịch vụ</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Loại dịch vụ:</span>
                  <span className={`font-semibold ${typeInfo.text}`}>
                    {typeInfo.label}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Hình thức cung cấp:</span>
                  <div className="text-right">
                    {service.availableAt && service.availableAt.length > 0 ? (
                      service.availableAt.map((location, index) => (
                        <Tag key={index} color="blue" className="mb-1">
                          {getLocationLabel(location)}
                        </Tag>
                      ))
                    ) : (
                      <span className="text-gray-500">Chưa xác định</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-semibold text-gray-800">Linh hoạt theo lịch hẹn</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Đánh giá:</span>
                  <span className="font-semibold text-yellow-600">4.8/5 ⭐</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Chi phí & Đặt lịch</h3>
              
              {/* Price Card */}
              <div className={`${typeInfo.bg} border-l-4 border-${typeInfo.color}-500 p-5 rounded-r-2xl mb-4`}>
                <div className="text-center">
                  <span className="text-sm text-gray-500 font-medium uppercase tracking-wide block mb-2">
                    Chi phí dịch vụ
                  </span>
                  <div className={`text-4xl font-black ${typeInfo.text} mb-2`}>
                    {service.price ? formatPrice(service.price) : 'Liên hệ'}
                  </div>
                  {service.price && (
                    <span className="text-gray-600 text-lg font-medium">VNĐ</span>
                  )}
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                <h4 className="font-semibold text-green-800 mb-2">Lợi ích khi sử dụng dịch vụ:</h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• Đội ngũ chuyên gia giàu kinh nghiệm</li>
                  <li>• Trang thiết bị hiện đại</li>
                  <li>• Quy trình chuẩn quốc tế</li>
                  <li>• Hỗ trợ tư vấn 24/7</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        {/* Additional Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin chi tiết</h3>
          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-gray-600 leading-relaxed">
              {service.description || 'Dịch vụ được thực hiện bởi đội ngũ chuyên gia y tế có trình độ cao, sử dụng trang thiết bị hiện đại và tuân thủ quy trình chuẩn quốc tế. Chúng tôi cam kết mang đến cho bạn trải nghiệm dịch vụ y tế tốt nhất với chất lượng đảm bảo và giá cả hợp lý.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            size="large"
            onClick={onClose}
            className="px-8 h-12 rounded-xl font-medium"
          >
            Đóng
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleBooking}
            className={`px-8 h-12 rounded-xl font-semibold bg-gradient-to-r from-${typeInfo.color}-500 to-${typeInfo.color}-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            Đặt lịch ngay
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ServiceDetailModal; 