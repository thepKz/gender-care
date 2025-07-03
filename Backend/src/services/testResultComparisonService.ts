import ServiceTestCategories from '../models/ServiceTestCategories';
import TestCategories from '../models/TestCategories';
import mongoose from 'mongoose';

export class TestResultComparisonService {

  // So sánh giá trị với range và return flag
  static compareValueWithRange(value: string, range: string): 'high' | 'low' | 'normal' | null {
    try {
      // Parse value (remove non-numeric chars except dots and commas)
      const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
      if (isNaN(numericValue)) {
        return null; // Không thể parse number
      }

      // Parse range (support formats: "10-20", "< 15", "> 10", "10.5 - 20.3", etc.)
      const rangePattern = /(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/; // Range format: "10-20"
      const lessThanPattern = /<\s*(\d+\.?\d*)/; // Format: "< 15"
      const greaterThanPattern = />\s*(\d+\.?\d*)/; // Format: "> 10"

      if (rangePattern.test(range)) {
        // Range format: "10-20"
        const match = range.match(rangePattern);
        if (match) {
          const minValue = parseFloat(match[1]);
          const maxValue = parseFloat(match[2]);
          
          if (numericValue < minValue) return 'low';
          if (numericValue > maxValue) return 'high';
          return 'normal';
        }
      } else if (lessThanPattern.test(range)) {
        // Less than format: "< 15"
        const match = range.match(lessThanPattern);
        if (match) {
          const maxValue = parseFloat(match[1]);
          if (numericValue >= maxValue) return 'high';
          return 'normal';
        }
      } else if (greaterThanPattern.test(range)) {
        // Greater than format: "> 10"
        const match = range.match(greaterThanPattern);
        if (match) {
          const minValue = parseFloat(match[1]);
          if (numericValue <= minValue) return 'low';
          return 'normal';
        }
      }

      return null; // Không thể parse range
    } catch (error) {
      return null;
    }
  }

  // Lấy effective range cho một test category trong service (custom range override default range)
  static async getEffectiveRangeForServiceTest(
    serviceId: string, 
    testCategoryId: string
  ): Promise<{
    range: string;
    unit: string;
    targetValue?: string;
    notes?: string;
    source: 'custom' | 'default';
  } | null> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(serviceId) || !mongoose.Types.ObjectId.isValid(testCategoryId)) {
        return null;
      }

      // Lấy service test category assignment
      const serviceTestCategory = await ServiceTestCategories.findOne({
        serviceId,
        testCategoryId
      }).populate('testCategoryId');

      if (!serviceTestCategory) {
        return null; // Service không có test category này
      }

      const testCategory = serviceTestCategory.testCategoryId as any;

      // Priority: customNormalRange > default normalRange
      const effectiveRange = serviceTestCategory.customNormalRange || testCategory.normalRange;
      const effectiveUnit = serviceTestCategory.customUnit || testCategory.unit;

      if (!effectiveRange) {
        return null; // Không có range để so sánh
      }

      return {
        range: effectiveRange,
        unit: effectiveUnit,
        targetValue: serviceTestCategory.targetValue,
        notes: serviceTestCategory.notes,
        source: serviceTestCategory.customNormalRange ? 'custom' : 'default'
      };
    } catch (error) {
      return null;
    }
  }

  // So sánh giá trị với thresholdRules (ưu tiên), fallback min/max
  static compareValueWithThresholdRules(value: number, thresholdRules?: Array<{ from: number | null, to: number | null, flag: string, message: string }>, minValue?: number, maxValue?: number): { flag: string | null, message: string | null } {
    if (thresholdRules && Array.isArray(thresholdRules) && thresholdRules.length > 0) {
      for (const rule of thresholdRules) {
        if (rule.from === null && rule.to !== null && value <= rule.to) {
          return { flag: rule.flag, message: rule.message };
        }
        if (rule.from !== null && rule.to === null && value >= rule.from) {
          return { flag: rule.flag, message: rule.message };
        }
        if (rule.from !== null && rule.to !== null && value >= rule.from && value <= rule.to) {
          return { flag: rule.flag, message: rule.message };
        }
      }
      // Không khớp rule nào
      return { flag: null, message: null };
    }
    // Fallback min/max
    if (typeof minValue === 'number' && value < minValue) {
      return { flag: 'low', message: null };
    }
    if (typeof maxValue === 'number' && value > maxValue) {
      return { flag: 'high', message: null };
    }
    if (typeof minValue === 'number' && typeof maxValue === 'number' && value >= minValue && value <= maxValue) {
      return { flag: 'normal', message: null };
    }
    return { flag: null, message: null };
  }

  // Auto-evaluate value dựa trên service test category (dùng thresholdRules nếu có)
  static async autoEvaluateTestResult(
    serviceId: string,
    testCategoryId: string,
    value: string
  ): Promise<{
    flag: string | null;
    message: string | null;
    effectiveRange: string | null;
    effectiveUnit: string | null;
    targetValue?: string;
    notes?: string;
    evaluationNotes?: string;
  } | null> {
    try {
      // Lấy assignment
      const serviceTestCategory = await ServiceTestCategories.findOne({
        serviceId,
        testCategoryId
      });
      if (!serviceTestCategory) return null;
      // Lấy thresholdRules, minValue, maxValue, unit
      const { thresholdRules, minValue, maxValue, unit, targetValue } = serviceTestCategory as any;
      // Parse value
      const numericValue = parseFloat(value.replace(/[^0-9.\-]/g, ''));
      if (isNaN(numericValue)) return null;
      // So sánh
      const { flag, message } = this.compareValueWithThresholdRules(numericValue, thresholdRules, minValue, maxValue);
      // Ghi chú đánh giá
      let evaluationNotes = '';
      if (flag && message) {
        evaluationNotes = message;
      } else if (flag === 'high') {
        evaluationNotes = `Giá trị cao hơn bình thường`;
      } else if (flag === 'low') {
        evaluationNotes = `Giá trị thấp hơn bình thường`;
      } else if (flag === 'normal') {
        evaluationNotes = `Giá trị trong khoảng bình thường`;
      }
      if (targetValue && flag === 'normal') {
        evaluationNotes += `. Giá trị mục tiêu: ${targetValue}`;
      }
      return {
        flag,
        message,
        effectiveRange: null, // Không còn dùng customNormalRange/normalRange
        effectiveUnit: unit || null,
        targetValue,
        evaluationNotes
      };
    } catch (error) {
      return null;
    }
  }

  // Bulk auto-evaluate cho nhiều test result items
  static async bulkAutoEvaluate(
    serviceId: string,
    testResultItems: Array<{
      testCategoryId: string;
      value: string;
    }>
  ): Promise<Array<{
    testCategoryId: string;
    value: string;
    flag: 'high' | 'low' | 'normal' | null;
    effectiveRange?: string;
    effectiveUnit?: string;
    targetValue?: string;
    evaluationNotes?: string;
  }>> {
    const results = [];

    for (const item of testResultItems) {
      const evaluation = await this.autoEvaluateTestResult(
        serviceId,
        item.testCategoryId,
        item.value
      );

      results.push({
        testCategoryId: item.testCategoryId,
        value: item.value,
        flag: evaluation?.flag || null,
        effectiveRange: evaluation?.effectiveRange,
        effectiveUnit: evaluation?.effectiveUnit,
        targetValue: evaluation?.targetValue,
        evaluationNotes: evaluation?.evaluationNotes
      });
    }

    return results;
  }

  // Get template cho việc nhập kết quả - return list test categories với ranges
  static async getTestResultTemplate(serviceId: string): Promise<Array<{
    testCategory: any;
    effectiveRange: string;
    effectiveUnit: string;
    targetValue?: string;
    notes?: string;
    isRequired: boolean;
  }> | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        return null;
      }

      // Lấy tất cả test categories của service
      const serviceTestCategories = await ServiceTestCategories.find({ serviceId })
        .populate('testCategoryId')
        .sort({ createdAt: 1 });

      const template = [];

      for (const stc of serviceTestCategories) {
        const testCategory = stc.testCategoryId as any;
        
        // Get effective range
        const effectiveRange = stc.customNormalRange || testCategory.normalRange || '';
        const effectiveUnit = stc.customUnit || testCategory.unit || '';

        template.push({
          testCategory: {
            _id: testCategory._id,
            name: testCategory.name,
            description: testCategory.description,
            unit: testCategory.unit,
            normalRange: testCategory.normalRange
          },
          effectiveRange,
          effectiveUnit,
          targetValue: stc.targetValue,
          notes: stc.notes,
          isRequired: stc.isRequired
        });
      }

      return template;
    } catch (error) {
      return null;
    }
  }
} 