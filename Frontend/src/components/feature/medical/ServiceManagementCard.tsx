import {
    CopyOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    MoreOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { Button, Dropdown, Tag, Tooltip } from 'antd';
import React from 'react';
import { Service } from '../../../types';
import ServiceDisplayCard from './ServiceDisplayCard';

interface ServiceManagementCardProps {
  service: Service;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
  onView?: (service: Service) => void;
  onDuplicate?: (service: Service) => void;
  onRecover?: (service: Service) => void;
  className?: string;
}

const ServiceManagementCard: React.FC<ServiceManagementCardProps> = ({ 
  service, 
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onRecover,
  className = ''
}) => {

  // Menu items cho dropdown actions - Danh sách các hành động
  const getActionMenuItems = () => {
    const baseItems = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'Xem chi tiết',
        onClick: () => onView?.(service)
      },
      {
        key: 'duplicate',
        icon: <CopyOutlined />,
        label: 'Sao chép',
        onClick: () => onDuplicate?.(service)
      }
    ];

    // Nếu service đã bị xóa, chỉ hiển thị khôi phục thêm vào
    if (service.isDeleted === 1) {
      return [
        ...baseItems,
        {
          type: 'divider' as const
        },
        {
          key: 'recover',
          icon: <ReloadOutlined />,
          label: 'Khôi phục dịch vụ',
          onClick: () => onRecover?.(service)
        }
      ];
    }

    // Nếu service chưa bị xóa, thêm nút xóa
    return [
      ...baseItems,
      {
        type: 'divider' as const
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Xóa dịch vụ',
        danger: true,
        onClick: () => onDelete?.(service)
      }
    ];
  };

  return (
    <div className={`service-management-card relative ${className}`}>
      {/* Base Service Display Card */}
      <ServiceDisplayCard 
        service={service}
        showBookingButton={false}
        className="pb-16"
      />

      {/* Management Controls Overlay - Bảng điều khiển quản lý */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl">
        <div className="flex items-center justify-between">
          {/* Service Status Tags - Nhãn trạng thái dịch vụ */}
          <div className="flex items-center gap-2">
            <Tag 
              color={service.isDeleted === 1 ? 'red' : 'green'}
              className="text-xs font-medium rounded-md border-0"
            >
              {service.isDeleted === 1 ? 'Ngưng hoạt động' : 'Đang hoạt động'}
            </Tag>
          </div>

          {/* Action Buttons - Nút hành động */}
          <div className="flex items-center gap-2">
            {/* Quick Edit Button - Nút chỉnh sửa nhanh (cho tất cả services kể cả đã xóa) */}
            <Tooltip title="Chỉnh sửa nhanh">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit?.(service)}
                className="hover:bg-blue-50 hover:border-blue-primary hover:text-blue-primary"
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

        {/* Service Stats - Thống kê dịch vụ */}
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
      <div className="absolute inset-0 bg-gradient-to-t from-blue-primary/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
    </div>
  );
};

export default ServiceManagementCard; 