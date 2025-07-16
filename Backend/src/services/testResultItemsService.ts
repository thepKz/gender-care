import TestResultItems, { ITestResultItems } from '../models/TestResultItems';
import Appointments from '../models/Appointments';
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
        .populate('appointmentId', 'appointmentDate appointmentTime serviceId')
        .populate('testCategoryId', 'name description unit')
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

  // Lấy test result items theo appointment ID
  async getTestResultItemsByAppointmentId(appointmentId: string): Promise<ITestResultItems[]> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new Error('Invalid appointment ID format');
    }

    const testResultItems = await TestResultItems.find({ appointmentId })
      .populate('testCategoryId', 'name description unit')
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
        path: 'appointmentId',
        select: 'appointmentDate appointmentTime serviceId profileId doctorId',
        populate: [
          {
            path: 'profileId',
            select: 'fullName gender'
          },
          {
            path: 'doctorId',
            select: 'specialization',
            populate: {
              path: 'userId',
              select: 'fullName'
            }
          }
        ]
      })
      .populate('testCategoryId', 'name description unit');
    
    if (!testResultItem) {
      throw new Error('Test result item not found');
    }

    return testResultItem;
  }

  // Tạo test result item mới (dạng mới: lưu 1 document với mảng items)
  async createTestResultItem(data: {
    appointmentId: string;
    items: Array<{
      testCategoryId: string;
      value: string;
      unit?: string;
      flag?: "very_low" | "low" | "normal" | "mild_high" | "high" | "critical";
      message?: string;
    }>;
  }, createdByRole: string): Promise<ITestResultItems> {
    // Kiểm tra quyền hạn - cho phép doctor, nursing staff, staff
    if (!['doctor', 'nursing_staff', 'staff'].includes(createdByRole)) {
      throw new Error('Only doctors, nursing staff, and staff can create test result items');
    }

    // Validate input data
    if (!data.appointmentId || !mongoose.Types.ObjectId.isValid(data.appointmentId)) {
      throw new Error('Valid appointment ID is required');
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('At least one test result item is required');
    }

    // Kiểm tra appointment có tồn tại không
    const appointment = await Appointments.findById(data.appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Validate từng item
    const TestCategories = (await import('../models/TestCategories')).default;
    for (const item of data.items) {
      if (!item.testCategoryId || !mongoose.Types.ObjectId.isValid(item.testCategoryId)) {
        throw new Error(`Invalid test category ID: ${item.testCategoryId}`);
      }
      if (!item.value || item.value.trim().length === 0) {
        throw new Error(`Value is required for item: ${item.testCategoryId}`);
      }
      const testCategory = await TestCategories.findById(item.testCategoryId);
      if (!testCategory) {
        throw new Error(`Test category not found: ${item.testCategoryId}`);
      }
    }

    // Tạo test result item mới (1 document, mảng items)
    const testResultItem = new TestResultItems({
      appointmentId: data.appointmentId,
      items: data.items.map(item => ({
        testCategoryId: item.testCategoryId,
        value: item.value.trim(),
        unit: item.unit?.trim(),
        flag: item.flag || 'normal',
        message: item.message?.trim()
      }))
    });

    const savedItem = await testResultItem.save();

    // Map vào testResult nếu có
    const TestResults = (await import('../models/TestResults')).default;
    await TestResults.updateOne(
      { appointmentId: data.appointmentId },
      { $addToSet: { testResultItemsId: savedItem._id } }
    );

    // Populate và return
    const result = await TestResultItems.findById(savedItem._id)
      .populate('items.testCategoryId', 'name description unit');
    if (!result) throw new Error('Test result item not found');
    return result;
  }

  // Tạo nhiều test result items cùng lúc
  async createMultipleTestResultItems(data: {
    appointmentId: string;
    items: Array<{
      testCategoryId: string;
      value: string;
      unit?: string;
      flag?: "very_low" | "low" | "normal" | "mild_high" | "high" | "critical";
      message?: string;
    }>;
  }, createdByRole: string): Promise<ITestResultItems[]> {
    // Kiểm tra quyền hạn - cho phép doctor, nursing staff, staff
    if (!['doctor', 'nursing_staff', 'staff'].includes(createdByRole)) {
      throw new Error('Only doctors, nursing staff, and staff can create test result items');
    }

    // Validate input data
    if (!data.appointmentId || !mongoose.Types.ObjectId.isValid(data.appointmentId)) {
      throw new Error('Valid appointment ID is required');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('At least one test result item is required');
    }

    // Kiểm tra appointment có tồn tại không
    const appointment = await Appointments.findById(data.appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Validate từng item và prepare data
    const TestCategories = (await import('../models/TestCategories')).default;
    const preparedItems = [];

    for (const item of data.items) {
      // Validate item
      if (!item.testCategoryId || !mongoose.Types.ObjectId.isValid(item.testCategoryId)) {
        throw new Error(`Invalid test category ID: ${item.testCategoryId}`);
      }

      if (!item.value || item.value.trim().length === 0) {
        throw new Error(`Value is required for item: ${item.testCategoryId}`);
      }

      // Kiểm tra test category
      const testCategory = await TestCategories.findById(item.testCategoryId);
      if (!testCategory) {
        throw new Error(`Test category not found: ${item.testCategoryId}`);
      }

      // Check duplicate
      const existingItem = await TestResultItems.findOne({
        appointmentId: data.appointmentId,
        testCategoryId: item.testCategoryId
      });

      if (existingItem) {
        throw new Error(`Test result item already exists for item: ${testCategory.name}`);
      }

      preparedItems.push({
        appointmentId: data.appointmentId,
        testCategoryId: item.testCategoryId,
        value: item.value.trim(),
        unit: item.unit?.trim(),
        flag: item.flag || 'normal',
        message: item.message?.trim()
      });
    }

    // Insert all items at once
    const createdItems = await TestResultItems.insertMany(preparedItems);
    
    // Populate the created items
    return await TestResultItems.find({ 
      _id: { $in: createdItems.map(item => item._id) } 
    })
    .populate('testCategoryId', 'name description unit');
  }

  // Cập nhật test result item theo appointmentId và testCategoryId
  async updateTestResultItemByCategory(
    appointmentId: string, 
    testCategoryId: string, 
    data: {
      value?: string;
      unit?: string;
      flag?: "very_low" | "low" | "normal" | "mild_high" | "high" | "critical";
      message?: string;
    }, 
    updatedByRole: string
  ): Promise<any> {
    // Kiểm tra quyền hạn - cho phép doctor, nursing staff, staff
    if (!['doctor', 'nursing_staff', 'staff'].includes(updatedByRole)) {
      throw new Error('Only doctors, nursing staff, and staff can update test result items');
    }

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new Error('Invalid appointment ID format');
    }
    if (!mongoose.Types.ObjectId.isValid(testCategoryId)) {
      throw new Error('Invalid test category ID format');
    }

    // Prepare update data
    const updateFields: any = {};
    if (data.value !== undefined) updateFields['items.$.value'] = data.value.trim();
    if (data.unit !== undefined) updateFields['items.$.unit'] = data.unit?.trim();
    if (data.flag !== undefined) updateFields['items.$.flag'] = data.flag;
    if (data.message !== undefined) updateFields['items.$.message'] = data.message?.trim();

    // Update item trong mảng items theo appointmentId và testCategoryId
    const result = await TestResultItems.updateOne(
      { 
        appointmentId: new mongoose.Types.ObjectId(appointmentId),
        'items.testCategoryId': new mongoose.Types.ObjectId(testCategoryId)
      },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      throw new Error('Test result item not found');
    }

    // Lấy lại document đã update để return
    const updatedDocument = await TestResultItems.findOne({ appointmentId })
      .populate('items.testCategoryId', 'name description unit');

    return updatedDocument;
  }

  // Xóa test result item
  async deleteTestResultItem(id: string, deletedByRole: string): Promise<void> {
    // Kiểm tra quyền hạn
    if (!['doctor', 'nursing_staff', 'staff'].includes(deletedByRole)) {
      throw new Error('Only doctors, nursing staff, and staff can delete test result items');
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid test result item ID format');
    }

    // Xóa khỏi testResultItemsId trong TestResults
    const TestResults = (await import('../models/TestResults')).default;
    await TestResults.updateMany(
      { testResultItemsId: id },
      { $pull: { testResultItemsId: id } }
    );

    const result = await TestResultItems.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Test result item not found');
    }
  }

  // Lấy summary của test result items theo appointment
  async getTestResultItemsSummary(appointmentId: string): Promise<{
    totalItems: number;
    normalCount: number;
    highCount: number;
    lowCount: number;
    abnormalPercentage: number;
  }> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new Error('Invalid appointment ID format');
    }

    const summary = await TestResultItems.aggregate([
      {
        $match: { appointmentId: new mongoose.Types.ObjectId(appointmentId) }
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          normalCount: {
            $sum: { $cond: [{ $eq: ['$flag', 'normal'] }, 1, 0] }
          },
          highCount: {
            $sum: { $cond: [{ $in: ['$flag', ['high', 'mild_high', 'critical']] }, 1, 0] }
          },
          lowCount: {
            $sum: { $cond: [{ $in: ['$flag', ['low', 'very_low']] }, 1, 0] }
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

    // Tính abnormal percentage (bao gồm cả high và low)
    const abnormalCount = result.highCount + result.lowCount;
    const abnormalPercentage = result.totalItems > 0 
      ? Math.round((abnormalCount / result.totalItems) * 100 * 100) / 100
      : 0;

    return {
      ...result,
      abnormalPercentage
    };
  }

  // Lấy template cho service
  async getTestResultTemplateForService(serviceId: string): Promise<any> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new Error('Invalid service ID format');
    }

    const ServiceTestCategories = (await import('../models/ServiceTestCategories')).default;
    const Service = (await import('../models/Service')).default;

    // Lấy thông tin service
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Lấy test categories cho service
    const serviceTestCategories = await ServiceTestCategories.find({ serviceId })
      .populate('testCategoryId', 'name description unit')
      .sort({ 'testCategoryId.name': 1 });

    if (serviceTestCategories.length === 0) {
      return null;
    }

    return {
      serviceId: service._id,
      serviceName: service.serviceName,
      testCategories: serviceTestCategories.map(stc => {
        const testCategory = stc.testCategoryId as any; // Type assertion for populated field
        return {
          _id: testCategory._id,
          name: testCategory.name,
          targetValue: stc.targetValue,
          minValue: stc.minValue,
          maxValue: stc.maxValue,
          thresholdRules: stc.thresholdRules,
          unit: stc.unit || testCategory.unit
        };
      })
    };
  }
} 