import React from 'react';
import { Card, Empty } from 'antd';
import { ServiceTestCategoriesManager } from '../../../components/feature/medical/ServiceTestCategoriesManager';
import { ServiceSelector } from '../../../components/ui/ServiceSelector';
import { useServiceSelection } from '../../../hooks/useServiceSelection';

const TestCategoriesManagement: React.FC = () => {
  const {
    services,
    selectedService,
    loading,
    selectService,
    clearSelection
  } = useServiceSelection();

  return (
    <div className="testCategoriesManagement p-6">
      <div className="testCategoriesManagement__header mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Quản lý Test Categories
        </h1>
        <p className="text-gray-600">
          Cấu hình các xét nghiệm cần thiết cho từng dịch vụ và thiết lập khoảng giá trị tùy chỉnh
        </p>
      </div>

      <Card className="mb-6">
        <div className="testCategoriesManagement__serviceSelector">
          <h3 className="text-lg font-semibold mb-4">Chọn dịch vụ để cấu hình</h3>
          
          <ServiceSelector
            services={services}
            selectedService={selectedService}
            loading={loading}
            onSelect={selectService}
            onClear={clearSelection}
            placeholder="Chọn dịch vụ để cấu hình test categories..."
          />
        </div>
      </Card>

      {selectedService ? (
        <Card>
          <ServiceTestCategoriesManager
            serviceId={selectedService._id}
            serviceName={selectedService.serviceName}
            onUpdate={() => {
              // Có thể reload data nếu cần
            }}
          />
        </Card>
      ) : (
        <Card>
          <Empty
            description="Vui lòng chọn dịch vụ để bắt đầu cấu hình test categories"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );
};

export default TestCategoriesManagement; 