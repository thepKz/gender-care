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

  // Auto-evaluate value dựa trên service test category
  static async autoEvaluateTestResult(
    serviceId: string,
    testCategoryId: string,
    value: string
  ): Promise<{
    flag: 'high' | 'low' | 'normal' | null;
    effectiveRange: string;
    effectiveUnit: string;
    targetValue?: string;
    notes?: string;
    evaluationNotes?: string;
  } | null> {
    try {
      // Lấy effective range
      const rangeInfo = await this.getEffectiveRangeForServiceTest(serviceId, testCategoryId);
      
      if (!rangeInfo) {
        return null;
      }

      // Compare value với range
      const flag = this.compareValueWithRange(value, rangeInfo.range);

      // Tạo evaluation notes
      let evaluationNotes = '';
      if (flag === 'high') {
        evaluationNotes = `Giá trị cao hơn bình thường (${rangeInfo.range})`;
      } else if (flag === 'low') {
        evaluationNotes = `Giá trị thấp hơn bình thường (${rangeInfo.range})`;
      } else if (flag === 'normal') {
        evaluationNotes = `Giá trị trong khoảng bình thường (${rangeInfo.range})`;
      }

      if (rangeInfo.targetValue && flag === 'normal') {
        evaluationNotes += `. Giá trị mục tiêu: ${rangeInfo.targetValue}`;
      }

      return {
        flag,
        effectiveRange: rangeInfo.range,
        effectiveUnit: rangeInfo.unit,
        targetValue: rangeInfo.targetValue,
        notes: rangeInfo.notes,
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