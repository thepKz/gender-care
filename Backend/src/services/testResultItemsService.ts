import TestResultItems, { ITestResultItems } from '../models/TestResultItems';
import TestResults from '../models/TestResults';
import Appointments from '../models/Appointments';
import { TestResultComparisonService } from './testResultComparisonService';
import mongoose from 'mongoose';

// Service class để xử lý business logic cho TestResultItems
export class TestResultItemsService {

  // Lấy tất cả test result items với pagination và filtering
  async getAllTestResultItems(page: number = 1, limit: number = 10, search?: string): Promise<{
    testResultItems: ITestResultItems[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const skip = (page - 1) * limit;
    
    // Tạo filter query nếu có search
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { value: { $regex: search, $options: 'i' } },
          { unit: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Thực hiện query với pagination và populate thông tin liên quan
    const [testResultItems, total] = await Promise.all([
      TestResultItems.find(filter)
        .populate('testResultId', 'conclusion recommendations')
        .populate('itemNameId', 'name description unit normalRange')
        .skip(skip)
        .limit(limit)
        .sort({ _id: -1 }),
      TestResultItems.countDocuments(filter)
    ]);

    return {
      testResultItems,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  // Lấy test result items theo test result ID
  async getTestResultItemsByTestResultId(testResultId: string): Promise<ITestResultItems[]> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(testResultId)) {
      throw new Error('Invalid test result ID format');
    }

    const testResultItems = await TestResultItems.find({ testResultId })
      .populate('itemNameId', 'name description unit normalRange')
      .sort({ _id: 1 });

    return testResultItems;
  }

  // Lấy test result item theo ID
  async getTestResultItemById(id: string): Promise<ITestResultItems | null> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid test result item ID format');
    }

    const testResultItem = await TestResultItems.findById(id)
      .populate({
        path: 'testResultId',
        select: 'conclusion recommendations appointmentTestId',
        populate: {
          path: 'appointmentTestId',
          select: 'name appointmentId',
          populate: {
            path: 'appointmentId',
            select: 'customerId appointmentDate',
            populate: {
              path: 'customerId',
              select: 'fullName email'
            }
          }
        }
      })
      .populate('itemNameId', 'name description unit normalRange');
    
    if (!testResultItem) {
      throw new Error('Test result item not found');
    }

    return testResultItem;
  }

  // Tạo test result item mới (chỉ Doctor và Nursing Staff)
  async createTestResultItem(data: {
    testResultId: string;
    itemNameId: string;
    value: string;
    unit?: string;
    currentRange?: string;
    flag?: "high" | "low" | "normal";
  }, createdByRole: string): Promise<ITestResultItems> {
    // Kiểm tra quyền hạn - chỉ doctor và nursing staff
    if (!['doctor', 'nursing_staff'].includes(createdByRole)) {
      throw new Error('Only doctors and nursing staff can create test result items');
    }

    // Validate input data
    if (!data.testResultId || !mongoose.Types.ObjectId.isValid(data.testResultId)) {
      throw new Error('Valid test result ID is required');
    }

    if (!data.itemNameId || !mongoose.Types.ObjectId.isValid(data.itemNameId)) {
      throw new Error('Valid item name ID is required');
    }

    if (!data.value || data.value.trim().length === 0) {
      throw new Error('Test result value is required');
    }

    // Kiểm tra test result có tồn tại không
    const TestResults = (await import('../models/TestResults')).default;
    const testResult = await TestResults.findById(data.testResultId);
    
    if (!testResult) {
      throw new Error('Test result not found');
    }

    // Kiểm tra test category có tồn tại không
    const TestCategories = (await import('../models/TestCategories')).default;
    const testCategory = await TestCategories.findById(data.itemNameId);
    
    if (!testCategory) {
      throw new Error('Test category not found');
    }

    // Kiểm tra không tạo duplicate item cho cùng test result và item name
    const existingItem = await TestResultItems.findOne({
      testResultId: data.testResultId,
      itemNameId: data.itemNameId
    });

    if (existingItem) {
      throw new Error('Test result item already exists for this test result and item');
    }

    // Auto-determine flag dựa trên normal range nếu không được provide
    let flag = data.flag;
    if (!flag && testCategory.normalRange && data.value) {
      flag = this.determineFlag(data.value, testCategory.normalRange);
    }

    // Tạo test result item mới
    const testResultItem = new TestResultItems({
      testResultId: data.testResultId,
      itemNameId: data.itemNameId,
      value: data.value.trim(),
      unit: data.unit?.trim() || testCategory.unit,
      currentRange: data.currentRange?.trim() || testCategory.normalRange,
      flag: flag || 'normal'
    });

    return await testResultItem.save();
  }

  // Tạo nhiều test result items cùng lúc
  async createMultipleTestResultItems(data: {
    testResultId: string;
    items: Array<{
      itemNameId: string;
      value: string;
      unit?: string;
      currentRange?: string;
      flag?: "high" | "low" | "normal";
    }>;
  }, createdByRole: string): Promise<ITestResultItems[]> {
    // Kiểm tra quyền hạn - chỉ doctor và nursing staff
    if (!['doctor', 'nursing_staff'].includes(createdByRole)) {
      throw new Error('Only doctors and nursing staff can create test result items');
    }

    // Validate input data
    if (!data.testResultId || !mongoose.Types.ObjectId.isValid(data.testResultId)) {
      throw new Error('Valid test result ID is required');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('At least one test result item is required');
    }

    // Kiểm tra test result có tồn tại không
    const TestResults = (await import('../models/TestResults')).default;
    const testResult = await TestResults.findById(data.testResultId);
    
    if (!testResult) {
      throw new Error('Test result not found');
    }

    // Validate từng item và prepare data
    const TestCategories = (await import('../models/TestCategories')).default;
    const preparedItems = [];

    for (const item of data.items) {
      // Validate item
      if (!item.itemNameId || !mongoose.Types.ObjectId.isValid(item.itemNameId)) {
        throw new Error(`Invalid item name ID: ${item.itemNameId}`);
      }

      if (!item.value || item.value.trim().length === 0) {
        throw new Error(`Value is required for item: ${item.itemNameId}`);
      }

      // Kiểm tra test category
      const testCategory = await TestCategories.findById(item.itemNameId);
      if (!testCategory) {
        throw new Error(`Test category not found: ${item.itemNameId}`);
      }

      // Check duplicate
      const existingItem = await TestResultItems.findOne({
        testResultId: data.testResultId,
        itemNameId: item.itemNameId
      });

      if (existingItem) {
        throw new Error(`Test result item already exists for item: ${testCategory.name}`);
      }

      // Auto-determine flag
      let flag = item.flag;
      if (!flag && testCategory.normalRange && item.value) {
        flag = this.determineFlag(item.value, testCategory.normalRange);
      }

      preparedItems.push({
        testResultId: data.testResultId,
        itemNameId: item.itemNameId,
        value: item.value.trim(),
        unit: item.unit?.trim() || testCategory.unit,
        currentRange: item.currentRange?.trim() || testCategory.normalRange,
        flag: flag || 'normal'
      });
    }

    // Insert all items at once
    const createdItems = await TestResultItems.insertMany(preparedItems);
    
    // Populate the created items
    return await TestResultItems.find({ 
      _id: { $in: createdItems.map(item => item._id) } 
    })
    .populate('itemNameId', 'name description unit normalRange');
  }

  // Cập nhật test result item
  async updateTestResultItem(id: string, data: {
    value?: string;
    unit?: string;
    currentRange?: string;
    flag?: "high" | "low" | "normal";
  }, updatedByRole: string): Promise<ITestResultItems> {
    // Kiểm tra quyền hạn - chỉ doctor và nursing staff
    if (!['doctor', 'nursing_staff'].includes(updatedByRole)) {
      throw new Error('Only doctors and nursing staff can update test result items');
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid test result item ID format');
    }

    // Kiểm tra tồn tại
    const existingItem = await TestResultItems.findById(id)
      .populate('itemNameId', 'normalRange');
    
    if (!existingItem) {
      throw new Error('Test result item not found');
    }

    // Prepare update data
    const updateData: any = {};
    if (data.value !== undefined) updateData.value = data.value.trim();
    if (data.unit !== undefined) updateData.unit = data.unit?.trim();
    if (data.currentRange !== undefined) updateData.currentRange = data.currentRange?.trim();
    if (data.flag !== undefined) updateData.flag = data.flag;

    // Auto-update flag nếu value thay đổi và không có flag mới
    if (data.value && !data.flag && existingItem.itemNameId && 
        (existingItem.itemNameId as any).normalRange) {
      updateData.flag = this.determineFlag(data.value, (existingItem.itemNameId as any).normalRange);
    }

    // Thực hiện update
    const updatedItem = await TestResultItems.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('itemNameId', 'name description unit normalRange');

    if (!updatedItem) {
      throw new Error('Failed to update test result item');
    }

    return updatedItem;
  }

  // Xóa test result item
  async deleteTestResultItem(id: string, deletedByRole: string): Promise<void> {
    // Kiểm tra quyền hạn - chỉ doctor và nursing staff
    if (!['doctor', 'nursing_staff'].includes(deletedByRole)) {
      throw new Error('Only doctors and nursing staff can delete test result items');
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid test result item ID format');
    }

    // Thực hiện xóa
    const deletedItem = await TestResultItems.findByIdAndDelete(id);
    if (!deletedItem) {
      throw new Error('Test result item not found or already deleted');
    }
  }

  // Lấy summary của test result items theo test result
  async getTestResultItemsSummary(testResultId: string): Promise<{
    totalItems: number;
    normalCount: number;
    highCount: number;
    lowCount: number;
    abnormalPercentage: number;
  }> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(testResultId)) {
      throw new Error('Invalid test result ID format');
    }

    const summary = await TestResultItems.aggregate([
      {
        $match: { testResultId: new mongoose.Types.ObjectId(testResultId) }
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          normalCount: {
            $sum: { $cond: [{ $eq: ['$flag', 'normal'] }, 1, 0] }
          },
          highCount: {
            $sum: { $cond: [{ $eq: ['$flag', 'high'] }, 1, 0] }
          },
          lowCount: {
            $sum: { $cond: [{ $eq: ['$flag', 'low'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = summary.length > 0 ? summary[0] : {
      totalItems: 0,
      normalCount: 0,
      highCount: 0,
      lowCount: 0
    };

    const abnormalCount = result.highCount + result.lowCount;
    const abnormalPercentage = result.totalItems > 0 
      ? Math.round((abnormalCount / result.totalItems) * 100 * 100) / 100
      : 0;

    return {
      ...result,
      abnormalPercentage
    };
  }

  // Helper function để xác định flag dựa trên normal range
  private determineFlag(value: string, normalRange: string): "high" | "low" | "normal" {
    // Parse numeric value
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return 'normal'; // Default cho non-numeric values
    }

    // Parse normal range (ví dụ: "10-20", "<5", ">100")
    if (normalRange.includes('-')) {
      const [min, max] = normalRange.split('-').map(v => parseFloat(v.trim()));
      if (!isNaN(min) && !isNaN(max)) {
        if (numericValue < min) return 'low';
        if (numericValue > max) return 'high';
        return 'normal';
      }
    } else if (normalRange.startsWith('<')) {
      const threshold = parseFloat(normalRange.substring(1).trim());
      if (!isNaN(threshold)) {
        return numericValue >= threshold ? 'high' : 'normal';
      }
    } else if (normalRange.startsWith('>')) {
      const threshold = parseFloat(normalRange.substring(1).trim());
      if (!isNaN(threshold)) {
        return numericValue <= threshold ? 'low' : 'normal';
      }
    }

    return 'normal'; // Default fallback
  }

  // Tạo test result item với auto-evaluation dựa trên service custom range
  async createTestResultItemWithAutoEvaluation(data: {
    testResultId: string;
    itemNameId: string;
    value: string;
    unit?: string;
    currentRange?: string;
  }, createdByRole: string): Promise<ITestResultItems> {
    // Check permissions
    if (!['doctor', 'nursing_staff'].includes(createdByRole)) {
      throw new Error('Only doctors and nursing staff can create test result items');
    }

    // Validate input
    if (!data.testResultId || !mongoose.Types.ObjectId.isValid(data.testResultId)) {
      throw new Error('Valid test result ID is required');
    }
    if (!data.itemNameId || !mongoose.Types.ObjectId.isValid(data.itemNameId)) {
      throw new Error('Valid item name ID is required');
    }
    if (!data.value || data.value.trim() === '') {
      throw new Error('Value is required');
    }

    // Lấy test result để biết serviceId
    const testResult = await TestResults.findById(data.testResultId)
      .populate('appointmentId');
    
    if (!testResult) {
      throw new Error('Test result not found');
    }

    const appointment = testResult.appointmentId as any;
    if (!appointment || !appointment.serviceId) {
      throw new Error('Appointment or service not found');
    }

    // Auto-evaluate dựa trên service custom range
    const evaluation = await TestResultComparisonService.autoEvaluateTestResult(
      appointment.serviceId.toString(),
      data.itemNameId,
      data.value
    );

    // Tạo test result item với auto-evaluated data
    const testResultItem = new TestResultItems({
      testResultId: data.testResultId,
      itemNameId: data.itemNameId,
      value: data.value.trim(),
      unit: data.unit?.trim() || evaluation?.effectiveUnit || '',
      currentRange: data.currentRange?.trim() || evaluation?.effectiveRange || '',
      flag: evaluation?.flag || 'normal'
    });

    const savedItem = await testResultItem.save();

    // Populate và return
    return await TestResultItems.findById(savedItem._id)
      .populate('itemNameId', 'name description unit normalRange') as ITestResultItems;
  }

  // Bulk create với auto-evaluation dựa trên service custom range
  async createMultipleTestResultItemsWithAutoEvaluation(data: {
    testResultId: string;
    items: Array<{
      itemNameId: string;
      value: string;
      unit?: string;
      currentRange?: string;
    }>;
  }, createdByRole: string): Promise<ITestResultItems[]> {
    // Check permissions
    if (!['doctor', 'nursing_staff'].includes(createdByRole)) {
      throw new Error('Only doctors and nursing staff can create test result items');
    }

    // Validate input
    if (!data.testResultId || !mongoose.Types.ObjectId.isValid(data.testResultId)) {
      throw new Error('Valid test result ID is required');
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Items array is required and cannot be empty');
    }

    // Lấy test result để biết serviceId
    const testResult = await TestResults.findById(data.testResultId)
      .populate('appointmentId');
    
    if (!testResult) {
      throw new Error('Test result not found');
    }

    const appointment = testResult.appointmentId as any;
    if (!appointment || !appointment.serviceId) {
      throw new Error('Appointment or service not found');
    }

    // Validate từng item
    const TestCategories = (await import('../models/TestCategories')).default;
    for (const item of data.items) {
      if (!item.itemNameId || !mongoose.Types.ObjectId.isValid(item.itemNameId)) {
        throw new Error(`Invalid item name ID: ${item.itemNameId}`);
      }
      if (!item.value || item.value.trim().length === 0) {
        throw new Error(`Value is required for item: ${item.itemNameId}`);
      }

      // Check if test category exists
      const testCategory = await TestCategories.findById(item.itemNameId);
      if (!testCategory) {
        throw new Error(`Test category not found: ${item.itemNameId}`);
      }

      // Check duplicate
      const existingItem = await TestResultItems.findOne({
        testResultId: data.testResultId,
        itemNameId: item.itemNameId
      });
      if (existingItem) {
        throw new Error(`Test result item already exists for item: ${testCategory.name}`);
      }
    }

    // Bulk auto-evaluate tất cả items
    const evaluations = await TestResultComparisonService.bulkAutoEvaluate(
      appointment.serviceId.toString(),
      data.items.map(item => ({
        testCategoryId: item.itemNameId,
        value: item.value
      }))
    );

    // Tạo test result items với auto-evaluated data
    const testResultItemsData = data.items.map((item, index) => {
      const evaluation = evaluations[index];
      
      return {
        testResultId: data.testResultId,
        itemNameId: item.itemNameId,
        value: item.value.trim(),
        unit: item.unit?.trim() || evaluation?.effectiveUnit || '',
        currentRange: item.currentRange?.trim() || evaluation?.effectiveRange || '',
        flag: evaluation?.flag || 'normal'
      };
    });

    const createdItems = await TestResultItems.insertMany(testResultItemsData);

    // Populate và return
    return await TestResultItems.find({ 
      _id: { $in: createdItems.map(item => item._id) } 
    }).populate('itemNameId', 'name description unit normalRange');
  }

  // Lấy template cho service để nhập kết quả xét nghiệm
  async getTestResultTemplateForService(serviceId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new Error('Invalid service ID');
    }

    return await TestResultComparisonService.getTestResultTemplate(serviceId);
  }

  // Auto-evaluate một giá trị dựa trên service custom range
  async autoEvaluateValue(serviceId: string, testCategoryId: string, value: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new Error('Invalid service ID');
    }
    if (!mongoose.Types.ObjectId.isValid(testCategoryId)) {
      throw new Error('Invalid test category ID');
    }

    return await TestResultComparisonService.autoEvaluateTestResult(serviceId, testCategoryId, value);
  }
} 