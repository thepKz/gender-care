import React, { useState, useEffect } from 'react';
import { message, Form, Input, InputNumber, Select, Button } from 'antd';
import { 
  serviceTestCategoriesApi, 
  testCategoriesApi, 
  ServiceTestCategory, 
  CreateServiceTestCategoryData 
} from '../../../api/endpoints/testManagementApi';
import { useApiState } from '../../../hooks/useApiState';
import { handleApiError, showSuccessNotification } from '../../../utils/apiErrorHandler';
import ModernButton from '../../ui/ModernButton';

interface ServiceTestCategoriesManagerProps {
  serviceId: string;
  serviceName?: string;
  onUpdate?: () => void;
}

interface TestCategory {
  _id: string;
  name: string;
  description?: string;
  normalRange?: string;
  unit?: string;
}

export const ServiceTestCategoriesManager: React.FC<ServiceTestCategoriesManagerProps> = ({
  serviceId,
  serviceName,
  onUpdate
}) => {
  const [serviceTestCategories, setServiceTestCategories] = useState<ServiceTestCategory[]>([]);
  const [allTestCategories, setAllTestCategories] = useState<TestCategory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceTestCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // API states
  const { loading: loadingCategories, execute: executeLoadCategories } = useApiState({
    errorMessage: 'Lỗi khi tải danh sách test categories'
  });
  
  const { loading: loadingAll, execute: executeLoadAll } = useApiState({
    errorMessage: 'Lỗi khi tải danh sách test categories'
  });
  
  const { loading: submitting, execute: executeSubmit } = useApiState();
  const { execute: executeDelete } = useApiState();

  // Load data
  useEffect(() => {
    loadServiceTestCategories();
    loadAllTestCategories();
  }, [serviceId]);

  const loadServiceTestCategories = async () => {
    try {
      setLoading(true);
      const data = await serviceTestCategoriesApi.getByService(serviceId);
      setServiceTestCategories(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách test categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTestCategories = async () => {
    try {
      const data = await testCategoriesApi.getAll();
      setAllTestCategories(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách test categories');
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        serviceId
      };
      if (editingItem) {
        await serviceTestCategoriesApi.update(editingItem._id, payload);
        message.success('Cập nhật thành công!');
      } else {
        await serviceTestCategoriesApi.create(payload);
        message.success('Thêm test category thành công!');
      }
      await loadServiceTestCategories();
      resetForm();
      onUpdate?.();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa test category này?')) return;
    
    try {
      await serviceTestCategoriesApi.delete(id);
      message.success('Xóa thành công!');
      await loadServiceTestCategories();
      onUpdate?.();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const resetForm = () => {
    form.resetFields();
    setEditingItem(null);
    setShowAddForm(false);
  };

  const startEdit = (item: ServiceTestCategory) => {
    setEditingItem(item);
    form.setFieldsValue({
      testCategoryId: item.testCategoryId,
      isRequired: item.isRequired,
      unit: item.unit || '',
      targetValue: item.targetValue || '',
      minValue: item.minValue,
      maxValue: item.maxValue,
      thresholdRules: item.thresholdRules || [
        { from: null, to: null, flag: 'normal', message: '' }
      ]
    });
    setShowAddForm(true);
  };

  // Get available test categories (not already assigned)
  const availableTestCategories = allTestCategories.filter(
    cat => !serviceTestCategories.find(stc => stc.testCategoryId === cat._id)
  );

  return (
    <div className="serviceTestCategoriesManager">
      <div className="serviceTestCategoriesManager__header mb-6 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Quản lý Test Categories - {serviceName}
        </h3>
        <ModernButton
          onClick={() => setShowAddForm(true)}
          variant="primary"
          size="medium"
        >
          Thêm Test Category
        </ModernButton>
      </div>

      {/* Current Service Test Categories */}
      <div className="serviceTestCategoriesManager__list">
        {loading ? (
          <div className="text-center py-4">Đang tải...</div>
        ) : serviceTestCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có test category nào được cấu hình cho dịch vụ này
          </div>
        ) : (
          <div className="space-y-4">
            {serviceTestCategories.map((item) => (
              <div
                key={item._id}
                className="serviceTestCategoriesManager__item bg-white border rounded-lg p-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {item.testCategory?.name}
                      </h4>
                      {item.isRequired && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          Bắt buộc
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <strong>Khoảng bình thường:</strong>{' '}
                        {item.testCategory?.description || 'Chưa cấu hình'}
                      </div>
                      <div>
                        <strong>Đơn vị:</strong>{' '}
                        {item.unit || 'Chưa cấu hình'}
                      </div>
                      {item.targetValue && (
                        <div>
                          <strong>Giá trị mục tiêu:</strong> {item.targetValue}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <ModernButton
                      onClick={() => startEdit(item)}
                      variant="outline"
                      size="small"
                    >
                      Sửa
                    </ModernButton>
                    <ModernButton
                      onClick={() => handleDelete(item._id)}
                      variant="danger"
                      size="small"
                    >
                      Xóa
                    </ModernButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="serviceTestCategoriesManager__modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Chỉnh sửa Test Category' : 'Thêm Test Category'}
            </h3>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              preserve={false}
              initialValues={editingItem || {
                testCategoryId: '',
                isRequired: false,
                unit: '',
                targetValue: '',
                minValue: undefined,
                maxValue: undefined,
                thresholdRules: [
                  { from: null, to: null, flag: 'normal', message: '' }
                ]
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Category *
                </label>
                <select
                  value={form.getFieldValue('testCategoryId')}
                  onChange={(e) => form.setFieldValue('testCategoryId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn test category</option>
                  {availableTestCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name} ({cat.normalRange} {cat.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={form.getFieldValue('isRequired')}
                  onChange={(e) => form.setFieldValue('isRequired', e.target.checked)}
                  className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isRequired" className="text-sm text-gray-700">
                  Bắt buộc làm xét nghiệm
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đơn vị tùy chỉnh
                </label>
                <input
                  type="text"
                  value={form.getFieldValue('unit')}
                  onChange={(e) => form.setFieldValue('unit', e.target.value)}
                  placeholder="Ví dụ: mg/dL, mmol/L"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá trị mục tiêu
                </label>
                <input
                  type="text"
                  value={form.getFieldValue('targetValue')}
                  onChange={(e) => form.setFieldValue('targetValue', e.target.value)}
                  placeholder="Giá trị mong muốn"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá trị tối thiểu
                </label>
                <input
                  type="text"
                  value={form.getFieldValue('minValue')}
                  onChange={(e) => form.setFieldValue('minValue', e.target.value)}
                  placeholder="Giá trị tối thiểu"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá trị tối đa
                </label>
                <input
                  type="text"
                  value={form.getFieldValue('maxValue')}
                  onChange={(e) => form.setFieldValue('maxValue', e.target.value)}
                  placeholder="Giá trị tối đa"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Form.Item label="Threshold Rules" name="thresholdRules">
                <Form.List name="thresholdRules">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field) => (
                        <div key={field.key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <Form.Item
                            key={`from-${field.key}`}
                            name={[field.name, 'from']}
                            style={{ flex: 1 }}
                          >
                            <InputNumber placeholder="From" style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item
                            key={`to-${field.key}`}
                            name={[field.name, 'to']}
                            style={{ flex: 1 }}
                          >
                            <InputNumber placeholder="To" style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item
                            key={`flag-${field.key}`}
                            name={[field.name, 'flag']}
                            style={{ flex: 1 }}
                            rules={[{ required: true, message: 'Chọn flag!' }]}
                          >
                            <Select placeholder="Flag">
                              <Select.Option value="very_low">very_low</Select.Option>
                              <Select.Option value="low">low</Select.Option>
                              <Select.Option value="normal">normal</Select.Option>
                              <Select.Option value="mild_high">mild_high</Select.Option>
                              <Select.Option value="high">high</Select.Option>
                              <Select.Option value="critical">critical</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            key={`msg-${field.key}`}
                            name={[field.name, 'message']}
                            style={{ flex: 2 }}
                            rules={[{ required: true, message: 'Nhập message!' }]}
                          >
                            <Input placeholder="Message" />
                          </Form.Item>
                          {fields.length > 1 && (
                            <Button danger onClick={() => remove(field.name)}>
                              Xóa
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="dashed" onClick={() => add({ from: null, to: null, flag: 'normal', message: '' })} block>
                        Thêm dòng
                      </Button>
                    </>
                  )}
                </Form.List>
              </Form.Item>

              <div className="flex gap-2 pt-4">
                <Button type="primary" htmlType="submit">Lưu</Button>
                <Button type="default" onClick={resetForm}>Hủy</Button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}; 