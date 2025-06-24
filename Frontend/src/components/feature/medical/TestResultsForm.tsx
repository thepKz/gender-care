import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { 
  testResultItemsApi, 
  TestResultTemplate, 
  AutoEvaluateData, 
  EvaluationResult 
} from '../../../api/endpoints/testManagementApi';
import ModernButton from '../../ui/ModernButton';

interface TestResultsFormProps {
  serviceId: string;
  testResultId: string;
  patientName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface TestItemInput {
  testCategoryId: string;
  value: string;
  unit?: string;
  notes?: string;
  evaluation?: EvaluationResult;
}

export const TestResultsForm: React.FC<TestResultsFormProps> = ({
  serviceId,
  testResultId,
  patientName,
  onSuccess,
  onCancel
}) => {
  const [template, setTemplate] = useState<TestResultTemplate | null>(null);
  const [testItems, setTestItems] = useState<TestItemInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState<string | null>(null);

  // Load template
  useEffect(() => {
    loadTemplate();
  }, [serviceId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await testResultItemsApi.getTemplate(serviceId);
      setTemplate(data);
      
      // Initialize test items
      const items: TestItemInput[] = data.testCategories.map(cat => ({
        testCategoryId: cat._id,
        value: '',
        unit: cat.customUnit || cat.unit,
        notes: ''
      }));
      setTestItems(items);
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: 'Lỗi khi tải template'
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateTestItem = (testCategoryId: string, field: keyof TestItemInput, value: string) => {
    setTestItems(prev => prev.map(item => 
      item.testCategoryId === testCategoryId 
        ? { ...item, [field]: value }
        : item
    ));
  };

  const evaluateValue = async (testCategoryId: string, value: string) => {
    if (!value.trim()) return;

    try {
      setEvaluating(testCategoryId);
      const evaluation = await testResultItemsApi.evaluateValue({
        serviceId,
        testCategoryId,
        value: value.trim()
      });

      setTestItems(prev => prev.map(item => 
        item.testCategoryId === testCategoryId 
          ? { ...item, evaluation }
          : item
      ));
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: 'Lỗi khi đánh giá giá trị'
      });
      console.error(error);
    } finally {
      setEvaluating(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = testItems.filter(item => item.value.trim());
    if (validItems.length === 0) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng nhập ít nhất một kết quả xét nghiệm'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const data: AutoEvaluateData = {
        testResultId,
        serviceId,
        testItems: validItems.map(item => ({
          testCategoryId: item.testCategoryId,
          value: item.value.trim(),
          unit: item.unit,
          notes: item.notes
        }))
      };

      await testResultItemsApi.bulkCreateWithAutoEvaluation(data);
      notification.success({
        message: 'Thành công',
        description: 'Lưu kết quả xét nghiệm thành công!'
      });
      onSuccess?.();
    } catch (error: any) {
      notification.error({
        message: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTestCategory = (testCategoryId: string) => {
    return template?.testCategories.find(cat => cat._id === testCategoryId);
  };

  const getEvaluationBadge = (evaluation: EvaluationResult) => {
    if (evaluation.isNormal) {
      return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Bình thường</span>;
    }
    if (evaluation.isHigh) {
      return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Cao</span>;
    }
    if (evaluation.isLow) {
      return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Thấp</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="testResultsForm flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Đang tải template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="testResultsForm text-center py-8">
        <p className="text-gray-600">Không thể tải template cho dịch vụ này</p>
        <ModernButton onClick={onCancel} className="mt-4" variant="secondary">
          Quay lại
        </ModernButton>
      </div>
    );
  }

  return (
    <div className="testResultsForm max-w-4xl mx-auto">
      <div className="testResultsForm__header mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Nhập kết quả xét nghiệm
        </h3>
        <div className="text-sm text-gray-600 mt-1">
          <p>Dịch vụ: <strong>{template.serviceName}</strong></p>
          {patientName && <p>Bệnh nhân: <strong>{patientName}</strong></p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="testResultsForm__items space-y-4">
          {template.testCategories.map((category) => {
            const testItem = testItems.find(item => item.testCategoryId === category._id);
            if (!testItem) return null;

            return (
              <div 
                key={category._id}
                className="testResultsForm__item bg-white border rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      {category.name}
                      {category.isRequired && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          Bắt buộc
                        </span>
                      )}
                    </h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>
                        Khoảng bình thường: {' '}
                        <strong>
                          {category.customNormalRange || category.normalRange}
                          {' '}
                          {category.customUnit || category.unit}
                        </strong>
                      </p>
                      {category.targetValue && (
                        <p>Giá trị mục tiêu: <strong>{category.targetValue}</strong></p>
                      )}
                      {category.notes && (
                        <p className="text-blue-600">{category.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  {testItem.evaluation && getEvaluationBadge(testItem.evaluation)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Value Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kết quả *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testItem.value}
                        onChange={(e) => updateTestItem(category._id, 'value', e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            evaluateValue(category._id, e.target.value);
                          }
                        }}
                        placeholder="Nhập kết quả"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        required={category.isRequired}
                      />
                      {evaluating === category._id && (
                        <div className="flex items-center px-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đơn vị
                    </label>
                    <input
                      type="text"
                      value={testItem.unit || ''}
                      onChange={(e) => updateTestItem(category._id, 'unit', e.target.value)}
                      placeholder="Đơn vị"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      value={testItem.notes || ''}
                      onChange={(e) => updateTestItem(category._id, 'notes', e.target.value)}
                      placeholder="Ghi chú thêm"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Evaluation Result */}
                {testItem.evaluation && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Đánh giá:</h5>
                    <p className="text-sm text-gray-600">{testItem.evaluation.evaluation}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Khoảng hiệu lực: {testItem.evaluation.effectiveRange} {testItem.evaluation.effectiveUnit}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="testResultsForm__actions flex gap-4 pt-6 border-t">
          <ModernButton
            type="submit"
            disabled={submitting}
            loading={submitting}
            variant="primary"
            size="large"
            fullWidth
          >
            Lưu kết quả
          </ModernButton>
          <ModernButton
            type="button"
            onClick={onCancel}
            variant="secondary"
            size="large"
            fullWidth
          >
            Hủy
          </ModernButton>
        </div>
      </form>
    </div>
  );
}; 