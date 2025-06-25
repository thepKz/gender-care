import React, { useState } from 'react';
import { testResultItemsApi, EvaluationResult } from '../../../api/endpoints/testManagementApi';
import { useApiState } from '../../../hooks/useApiState';
import { handleApiError } from '../../../utils/apiErrorHandler';
import ModernButton from '../../ui/ModernButton';

interface ValueEvaluatorOptimizedProps {
  serviceId: string;
  testCategoryId: string;
  testCategoryName: string;
  normalRange?: string;
  unit?: string;
  onEvaluate?: (result: EvaluationResult) => void;
}

export const ValueEvaluatorOptimized: React.FC<ValueEvaluatorOptimizedProps> = ({
  serviceId,
  testCategoryId,
  testCategoryName,
  normalRange,
  unit,
  onEvaluate
}) => {
  const [value, setValue] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const { loading, execute } = useApiState({
    errorMessage: 'Lỗi khi đánh giá giá trị'
  });

  const handleEvaluate = async () => {
    if (!value.trim()) {
      handleApiError(new Error('Vui lòng nhập giá trị'));
      return;
    }

    await execute(
      () => testResultItemsApi.evaluateValue({
        serviceId,
        testCategoryId,
        value: value.trim()
      }),
      (result) => {
        setEvaluation(result);
        onEvaluate?.(result);
      }
    );
  };

  const getEvaluationColor = (evaluation: EvaluationResult) => {
    if (evaluation.isNormal) return 'text-green-600 bg-green-50 border-green-200';
    if (evaluation.isHigh) return 'text-red-600 bg-red-50 border-red-200';
    if (evaluation.isLow) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getEvaluationIcon = (evaluation: EvaluationResult) => {
    if (evaluation.isNormal) return '✓';
    if (evaluation.isHigh) return '↑';
    if (evaluation.isLow) return '↓';
    return '?';
  };

  return (
    <div className="valueEvaluatorOptimized bg-white border rounded-lg p-4">
      <div className="valueEvaluatorOptimized__header mb-4">
        <h4 className="font-medium text-gray-900">{testCategoryName}</h4>
        {normalRange && (
          <p className="text-sm text-gray-600">
            Khoảng bình thường: <strong>{normalRange}</strong>
            {unit && <span> {unit}</span>}
          </p>
        )}
      </div>

      <div className="valueEvaluatorOptimized__input flex gap-2 mb-4">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Nhập giá trị${unit ? ` (${unit})` : ''}`}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && handleEvaluate()}
        />
        <ModernButton
          onClick={handleEvaluate}
          disabled={loading || !value.trim()}
          loading={loading}
          variant="primary"
          size="medium"
        >
          Đánh giá
        </ModernButton>
      </div>

      {evaluation && (
        <div className={`valueEvaluatorOptimized__result border rounded-lg p-3 ${getEvaluationColor(evaluation)}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold">
              {getEvaluationIcon(evaluation)}
            </span>
            <span className="font-medium">
              {evaluation.isNormal && 'Bình thường'}
              {evaluation.isHigh && 'Cao hơn bình thường'}
              {evaluation.isLow && 'Thấp hơn bình thường'}
            </span>
          </div>
          
          <p className="text-sm mb-2">{evaluation.evaluation}</p>
          
          <div className="text-xs opacity-75">
            <p>Khoảng hiệu lực: {evaluation.effectiveRange} {evaluation.effectiveUnit}</p>
          </div>
        </div>
      )}
    </div>
  );
}; 