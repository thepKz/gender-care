import React from 'react';
import { Select, Spin } from 'antd';
import ModernButton from './ModernButton';

const { Option } = Select;

interface ServiceItem {
  _id: string;
  serviceName: string;
  description?: string;
}

interface ServiceSelectorProps {
  services: ServiceItem[];
  selectedService: ServiceItem | null;
  loading: boolean;
  onSelect: (serviceId: string) => void;
  onClear: () => void;
  placeholder?: string;
  size?: 'small' | 'middle' | 'large';
  showClearButton?: boolean;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedService,
  loading,
  onSelect,
  onClear,
  placeholder = 'Chọn dịch vụ...',
  size = 'large',
  showClearButton = true
}) => {
  return (
    <div className="serviceSelector">
      <div className="flex items-center gap-4">
        <Select
          placeholder={placeholder}
          className="flex-1 max-w-md"
          size={size}
          showSearch
          loading={loading}
          filterOption={(input, option) => {
            if (!option?.children) return false;
            const children = String(option.children);
            return children.toLowerCase().includes(input.toLowerCase());
          }}
          onChange={onSelect}
          value={selectedService?._id}
          notFoundContent={loading ? <Spin size="small" /> : 'Không tìm thấy dịch vụ'}
        >
          {services.map(service => (
            <Option key={service._id} value={service._id}>
              {service.serviceName}
            </Option>
          ))}
        </Select>
        
        {selectedService && showClearButton && (
          <ModernButton
            onClick={onClear}
            variant="ghost"
            size="medium"
          >
            Xóa lựa chọn
          </ModernButton>
        )}
      </div>

      {selectedService && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900">{selectedService.serviceName}</h4>
          {selectedService.description && (
            <p className="text-blue-700 text-sm mt-1">{selectedService.description}</p>
          )}
        </div>
      )}
    </div>
  );
}; 