import React, { useState, useEffect } from 'react';
import { message } from 'antd';
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

  // API states
  const { loading: loadingCategories, execute: executeLoadCategories } = useApiState({
    errorMessage: 'Lỗi khi tải danh sách test categories'
  });
  
  const { loading: loadingAll, execute: executeLoadAll } = useApiState({
    errorMessage: 'Lỗi khi tải danh sách test categories'
  });
  
  const { loading: submitting, execute: executeSubmit } = useApiState();
  const { execute: executeDelete } = useApiState();

  // Form data
  const [formData, setFormData] = useState<CreateServiceTestCategoryData>({
    serviceId,
    testCategoryId: '',
    isRequired: false,
    customNormalRange: '',
    customUnit: '',
    targetValue: '',
    notes: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await serviceTestCategoriesApi.update(editingItem._id, formData);
        message.success('Cập nhật thành công!');
      } else {
        await serviceTestCategoriesApi.create(formData);
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
    setFormData({
      serviceId,
      testCategoryId: '',
      isRequired: false,
      customNormalRange: '',
      customUnit: '',
      targetValue: '',
      notes: ''
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const startEdit = (item: ServiceTestCategory) => {
    setEditingItem(item);
    setFormData({
      serviceId: item.serviceId,
      testCategoryId: item.testCategoryId,
      isRequired: item.isRequired,
      customNormalRange: item.customNormalRange || '',
      customUnit: item.customUnit || '',
      targetValue: item.targetValue || '',
      notes: item.notes || ''
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
                        {item.customNormalRange || item.testCategory?.normalRange || 'Chưa cấu hình'}
                      </div>
                      <div>
                        <strong>Đơn vị:</strong>{' '}
                        {item.customUnit || item.testCategory?.unit || 'Chưa cấu hình'}
                      </div>
                      {item.targetValue && (
                        <div>
                          <strong>Giá trị mục tiêu:</strong> {item.targetValue}
                        </div>
                      )}
                      {item.notes && (
                        <div className="col-span-2">
                          <strong>Ghi chú:</strong> {item.notes}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Category *
                  </label>
                  <select
                    value={formData.testCategoryId}
                    onChange={(e) => setFormData({ ...formData, testCategoryId: e.target.value })}
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
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                  className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isRequired" className="text-sm text-gray-700">
                  Bắt buộc làm xét nghiệm
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khoảng bình thường tùy chỉnh
                </label>
                <input
                  type="text"
                  value={formData.customNormalRange}
                  onChange={(e) => setFormData({ ...formData, customNormalRange: e.target.value })}
                  placeholder="Ví dụ: 10-20, < 15, > 10"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đơn vị tùy chỉnh
                </label>
                <input
                  type="text"
                  value={formData.customUnit}
                  onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
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
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  placeholder="Giá trị mong muốn"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ghi chú thêm về test này..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <ModernButton
                  type="submit"
                  variant="primary"
                  size="medium"
                  fullWidth
                >
                  {editingItem ? 'Cập nhật' : 'Thêm'}
                </ModernButton>
                <ModernButton
                  type="button"
                  onClick={resetForm}
                  variant="secondary"
                  size="medium"
                  fullWidth
                >
                  Hủy
                </ModernButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 