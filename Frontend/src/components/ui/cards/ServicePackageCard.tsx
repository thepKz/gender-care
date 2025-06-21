import {
    CopyOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    GiftOutlined,
    MoreOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { Button, Card, Dropdown, Tag, Tooltip } from 'antd';
import React, { useState } from 'react';
import { ServicePackage } from '../../../types';
import ServicePackageDetailModal from '../modals/ServicePackageDetailModal';
import PurchasePackageModal from '../modals/PurchasePackageModal';

interface ServicePackageCardProps {
  servicePackage: ServicePackage;
  onEdit: (servicePackage: ServicePackage) => void;
  onDelete: (servicePackage: ServicePackage) => void;
  onView?: (servicePackage: ServicePackage) => void;
  onRecover?: (servicePackage: ServicePackage) => void;
  onDuplicate?: (servicePackage: ServicePackage) => void;
  className?: string;
}

const ServicePackageCard: React.FC<ServicePackageCardProps> = ({
  servicePackage,
  onEdit,
  onDelete,
  onView,
  onRecover,
  onDuplicate,
  className = ''
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Format price - Định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Calculate discount percentage
  const discountPercentage = Math.round(
    ((servicePackage.priceBeforeDiscount - servicePackage.price) / servicePackage.priceBeforeDiscount) * 100
  );

  // Handle view detail - Xử lý xem chi tiết
  const handleViewDetail = () => {
    setShowDetailModal(true);
    onView?.(servicePackage);
  };

  // Menu items cho dropdown actions - Danh sách các hành động
  const getActionMenuItems = () => {
    const baseItems = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'Xem chi tiết',
        onClick: () => handleViewDetail()
      },
      {
        key: 'duplicate',
        icon: <CopyOutlined />,
        label: 'Sao chép',
        onClick: () => onDuplicate?.(servicePackage)
      }
    ];

    // Nếu service package đã bị xóa, chỉ hiển thị khôi phục thêm vào
    if (!servicePackage.isActive) {
      return [
        ...baseItems,
        {
          type: 'divider' as const
        },
        {
          key: 'recover',
          icon: <ReloadOutlined />,
          label: 'Khôi phục gói dịch vụ',
          onClick: () => onRecover?.(servicePackage)
        }
      ];
    }

    // Nếu service package chưa bị xóa, thêm nút xóa
    return [
      ...baseItems,
      {
        type: 'divider' as const
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Xóa gói dịch vụ',
        danger: true,
        onClick: () => onDelete(servicePackage)
      }
    ];
  };

  return (
    <div className={`service-package-management-card relative ${className}`}>
      <Card
        hoverable
        className="medical-service-package-card h-full rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group pb-16"
        cover={
          <div className="relative h-48 bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center overflow-hidden">
            {/* Background Pattern - Họa tiết nền */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23006478' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            {/* Package Image or Icon - Hình ảnh hoặc icon gói dịch vụ */}
            <div className="text-center">
              <div className="text-6xl text-green-primary/20 group-hover:scale-110 transition-transform duration-300 mb-2">
                🎁
              </div>
              {/* Decorative service icons */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl animate-pulse">🩺</span>
                <span className="text-xl">+</span>
                <span className="text-2xl animate-pulse" style={{ animationDelay: '0.5s' }}>💊</span>
              </div>
            </div>

            {/* Package Type Badge - Nhãn loại gói */}
            <div className="absolute top-3 left-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
                <span className="text-xs font-medium text-green-primary flex items-center gap-1">
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

            {/* Gradient Overlay - Lớp phủ gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        }
      >
        <div className="p-4">
          {/* Package Name - Tên gói dịch vụ */}
          <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
            {servicePackage.name}
          </h3>

          {/* Package Description - Mô tả gói dịch vụ */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
            {servicePackage.description || 'Gói dịch vụ chăm sóc sức khỏe toàn diện với các dịch vụ chuyên nghiệp.'}
          </p>

          {/* Package Details - Chi tiết gói dịch vụ */}
          <div className="space-y-2 mb-4">
            {/* View Details Link */}
            <div className="flex items-center gap-2 text-sm">
              <EyeOutlined className="text-blue-primary" />
              <button
                onClick={handleViewDetail}
                className="text-blue-primary hover:text-blue-secondary hover:underline font-medium transition-colors duration-200"
              >
                Xem chi tiết {servicePackage.services.length} dịch vụ
              </button>
            </div>

            {/* Package Benefits */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600">Tiết kiệm chi phí</span>
            </div>
          </div>

          {/* Price - Giá tiền */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 p-3 rounded-xl border border-green-200/50 mb-4">
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
                <span className="text-2xl font-bold text-green-primary">
                  {formatPrice(servicePackage.price)}
                </span>
                <span className="text-gray-500 ml-1">VNĐ</span>
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
        </div>

        {/* Deleted Package Overlay - Overlay cho gói đã xóa (che toàn bộ card như Service) */}
        {!servicePackage.isActive && (
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 border border-gray-200">
              <span className="text-sm font-medium text-gray-700">Đã ngừng hoạt động</span>
            </div>
          </div>
        )}

        {/* Hover Effect Overlay - Hiệu ứng hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
      </Card>

      {/* Management Controls Overlay - Bảng điều khiển quản lý (giống ServiceManagementCard) */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl">
        <div className="flex items-center justify-between">
          {/* Service Package Status Tags - Nhãn trạng thái gói dịch vụ */}
          <div className="flex items-center gap-2">
            <Tag 
              color={servicePackage.isActive ? 'green' : 'red'}
              className="text-xs font-medium rounded-md border-0"
            >
              {servicePackage.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
            </Tag>
          </div>

          {/* Action Buttons - Nút hành động */}
          <div className="flex items-center gap-2">
            {/* Quick Edit Button - Nút chỉnh sửa nhanh (cho tất cả service packages kể cả đã xóa) */}
            <Tooltip title="Chỉnh sửa nhanh">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(servicePackage)}
                className="hover:bg-green-50 hover:border-green-primary hover:text-green-primary"
              />
            </Tooltip>

            {/* More Actions Dropdown - Dropdown thêm hành động */}
            <Dropdown
              menu={{ items: getActionMenuItems() }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                size="small"
                icon={<MoreOutlined />}
                className="hover:bg-gray-50 hover:border-gray-300"
              />
            </Dropdown>
          </div>
        </div>

        {/* Service Package Stats - Thống kê gói dịch vụ */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">Đã đặt:</span> 245 lượt
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">Đánh giá:</span> 4.8/5
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">Cập nhật:</span> Chưa có thông tin
          </div>
        </div>
      </div>

      {/* Hover Effect for Management Mode - Hiệu ứng hover cho chế độ quản lý */}
      <div className="absolute inset-0 bg-gradient-to-t from-green-primary/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />

      {/* Detail Modal */}
      <ServicePackageDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        servicePackage={servicePackage}
      />
    </div>
  );
};

export default ServicePackageCard; 