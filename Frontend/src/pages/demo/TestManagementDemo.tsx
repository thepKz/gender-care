import React, { useState } from 'react';
import { Card, Tabs, Typography, Space } from 'antd';
import { ServiceTestCategoriesManager } from '../../components/feature/medical/ServiceTestCategoriesManager';
import { TestResultsForm } from '../../components/feature/medical/TestResultsForm';
import { ValueEvaluator } from '../../components/feature/medical/ValueEvaluator';
import { ValueEvaluatorOptimized } from '../../components/feature/medical/ValueEvaluatorOptimized';
import { ServiceSelector } from '../../components/ui/ServiceSelector';
import { useServiceSelection } from '../../hooks/useServiceSelection';
import ModernButton from '../../components/ui/ModernButton';

const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

// Demo component for ServiceSelector
const ServiceSelectorDemo: React.FC = () => {
  const {
    services,
    selectedService,
    loading,
    selectService,
    clearSelection
  } = useServiceSelection();

  return (
    <div>
      <ServiceSelector
        services={services}
        selectedService={selectedService}
        loading={loading}
        onSelect={selectService}
        onClear={clearSelection}
        placeholder="Demo service selector..."
      />
      
      {selectedService && (
        <div className="mt-4 p-3 bg-green-50 rounded">
          <p><strong>Selected Service:</strong> {selectedService.serviceName}</p>
          <p><strong>ID:</strong> {selectedService._id}</p>
        </div>
      )}
    </div>
  );
};

const TestManagementDemo: React.FC = () => {
  const [demoServiceId] = useState('demo-service-id');
  const [demoTestResultId] = useState('demo-test-result-id');
  const [demoTestCategoryId] = useState('demo-test-category-id');

  return (
    <div className="testManagementDemo p-6">
      <div className="testManagementDemo__header mb-6">
        <Title level={2}>Test Management Components Demo</Title>
        <Paragraph>
          Đây là trang demo các component quản lý xét nghiệm. Để test đầy đủ chức năng, 
          cần có dữ liệu thật từ backend.
        </Paragraph>
      </div>

      <Tabs defaultActiveKey="1" type="card">
        <TabPane tab="Service Test Categories Manager" key="1">
          <Card>
            <Title level={4}>ServiceTestCategoriesManager Component</Title>
            <Paragraph>
              Component này cho phép Admin/Manager cấu hình test categories cho từng dịch vụ,
              bao gồm custom range, đơn vị, giá trị mục tiêu.
            </Paragraph>
            
            <div className="demo-content">
              <ServiceTestCategoriesManager
                serviceId={demoServiceId}
                serviceName="Demo Service - Xét nghiệm máu"
                onUpdate={() => console.log('Service test categories updated')}
              />
            </div>
          </Card>
        </TabPane>

        <TabPane tab="Test Results Form" key="2">
          <Card>
            <Title level={4}>TestResultsForm Component</Title>
            <Paragraph>
              Component này cho phép Doctor/Staff nhập kết quả xét nghiệm với auto-evaluation.
              Form sẽ tự động đánh giá kết quả dựa trên custom range đã cấu hình.
            </Paragraph>
            
            <div className="demo-content">
              <TestResultsForm
                serviceId={demoServiceId}
                testResultId={demoTestResultId}
                patientName="Nguyễn Văn Demo"
                onSuccess={() => console.log('Test results saved successfully')}
                onCancel={() => console.log('Test results form cancelled')}
              />
            </div>
          </Card>
        </TabPane>

        <TabPane tab="Value Evaluator (Original)" key="3">
          <Card>
            <Title level={4}>ValueEvaluator Component (Original)</Title>
            <Paragraph>
              Component gốc với manual error handling và loading states.
            </Paragraph>
            
            <div className="demo-content">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <ValueEvaluator
                  serviceId={demoServiceId}
                  testCategoryId={demoTestCategoryId}
                  testCategoryName="Glucose"
                  normalRange="80-120"
                  unit="mg/dL"
                  onEvaluate={(result) => console.log('Evaluation result:', result)}
                />
                
                <ValueEvaluator
                  serviceId={demoServiceId}
                  testCategoryId="demo-test-category-2"
                  testCategoryName="Cholesterol"
                  normalRange="< 200"
                  unit="mg/dL"
                  onEvaluate={(result) => console.log('Evaluation result:', result)}
                />
              </Space>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="Value Evaluator (Optimized)" key="4">
          <Card>
            <Title level={4}>ValueEvaluatorOptimized Component</Title>
            <Paragraph>
              Component tối ưu sử dụng <code>useApiState</code> hook và <code>handleApiError</code> utility.
              Ít code hơn, dễ maintain hơn.
            </Paragraph>
            
            <div className="demo-content">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <ValueEvaluatorOptimized
                  serviceId={demoServiceId}
                  testCategoryId={demoTestCategoryId}
                  testCategoryName="Glucose (Optimized)"
                  normalRange="80-120"
                  unit="mg/dL"
                  onEvaluate={(result) => console.log('Optimized evaluation result:', result)}
                />
                
                <ValueEvaluatorOptimized
                  serviceId={demoServiceId}
                  testCategoryId="demo-test-category-2"
                  testCategoryName="HDL Cholesterol (Optimized)"
                  normalRange="> 40"
                  unit="mg/dL"
                  onEvaluate={(result) => console.log('Optimized evaluation result:', result)}
                />
              </Space>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="Service Selector Demo" key="5">
          <Card>
            <Title level={4}>ServiceSelector Component</Title>
            <Paragraph>
              Component tái sử dụng để chọn service, sử dụng <code>useServiceSelection</code> hook.
            </Paragraph>
            
            <div className="demo-content">
              <ServiceSelectorDemo />
            </div>
          </Card>
        </TabPane>

        <TabPane tab="API Integration" key="4">
          <Card>
            <Title level={4}>API Integration Guide</Title>
            <Paragraph>
              Các component này đã được tích hợp với các API endpoints:
            </Paragraph>
            
            <div className="api-info">
              <Title level={5}>ServiceTestCategories API</Title>
              <ul>
                <li>GET /api/service-test-categories/service/:serviceId - Lấy test categories của service</li>
                <li>POST /api/service-test-categories - Tạo service test category</li>
                <li>POST /api/service-test-categories/bulk - Tạo nhiều service test categories</li>
                <li>PUT /api/service-test-categories/:id - Cập nhật service test category</li>
                <li>DELETE /api/service-test-categories/:id - Xóa service test category</li>
              </ul>

              <Title level={5}>TestResultItems API</Title>
              <ul>
                <li>GET /api/test-result-items/template/:serviceId - Lấy template cho service</li>
                <li>POST /api/test-result-items/auto-evaluate - Tạo với auto-evaluation</li>
                <li>POST /api/test-result-items/bulk-auto-evaluate - Tạo nhiều với auto-evaluation</li>
                <li>POST /api/test-result-items/evaluate-value - Đánh giá giá trị</li>
              </ul>

              <Title level={5}>Usage in Production</Title>
              <Paragraph>
                1. Admin/Manager sử dụng TestCategoriesManagement page để cấu hình test categories cho services<br/>
                2. Doctor/Staff sử dụng TestResultsEntry page để nhập kết quả xét nghiệm<br/>
                3. ValueEvaluator có thể được sử dụng standalone hoặc tích hợp trong forms khác
              </Paragraph>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TestManagementDemo; 