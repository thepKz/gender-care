import mongoose from 'mongoose';
import ServiceTestCategories from '../models/ServiceTestCategories';
import Service from '../models/Service';
import TestCategories from '../models/TestCategories';

export class ServiceTestCategoriesService {

  // Lấy test categories cho một service cụ thể
  async getTestCategoriesByServiceId(serviceId: string) {
    // Validate serviceId
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new Error('Invalid service ID');
    }

    // Kiểm tra service có tồn tại không
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Lấy test categories của service
    const serviceTestCategories = await ServiceTestCategories.find({ serviceId })
      .populate('testCategoryId', 'name description unit normalRange')
      .populate('serviceId', 'serviceName serviceType')
      .sort({ createdAt: -1 });

    return serviceTestCategories;
  }

  // Lấy tất cả service test categories với pagination
  async getAllServiceTestCategories(page: number, limit: number, search?: string) {
    // Build search query
    let searchQuery = {};

    if (search) {
      // Search trong service name hoặc test category name
      searchQuery = {
        $or: [
          { 'serviceId.serviceName': { $regex: search, $options: 'i' } },
          { 'testCategoryId.name': { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await ServiceTestCategories.countDocuments(searchQuery);

    // Get paginated results
    const serviceTestCategories = await ServiceTestCategories.find(searchQuery)
      .populate('serviceId', 'serviceName serviceType price')
      .populate('testCategoryId', 'name description unit normalRange')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    return {
      serviceTestCategories,
      currentPage: page,
      totalPages,
      total
    };
  }

  // Gán test category cho service
  async assignTestCategoryToService(data: any, userRole: string) {
    // Check permissions - chỉ doctor và staff mới được gán
    if (!['doctor', 'staff', 'admin'].includes(userRole)) {
      throw new Error('Only doctors and staff can assign test categories to services');
    }

    const { serviceId, testCategoryId, isRequired, customNormalRange, customUnit, targetValue, notes, minValue, maxValue } = data;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new Error('Invalid service ID');
    }
    if (!mongoose.Types.ObjectId.isValid(testCategoryId)) {
      throw new Error('Invalid test category ID');
    }

    // Kiểm tra service và test category có tồn tại không
    const [service, testCategory] = await Promise.all([
      Service.findById(serviceId),
      TestCategories.findById(testCategoryId)
    ]);

    if (!service) {
      throw new Error('Service not found');
    }
    if (!testCategory) {
      throw new Error('Test category not found');
    }

    // Kiểm tra đã được gán chưa
    const existingAssignment = await ServiceTestCategories.findOne({
      serviceId,
      testCategoryId
    });

    if (existingAssignment) {
      throw new Error('Test category already assigned to this service');
    }

    // Tự động tính targetValue từ minValue và maxValue
    let calculatedTargetValue = targetValue;
    if (minValue !== undefined && maxValue !== undefined) {
      calculatedTargetValue = ((minValue + maxValue) / 2).toString();
    }

    // Tạo assignment mới
    const newAssignment = new ServiceTestCategories({
      serviceId,
      testCategoryId,
      isRequired,
      customNormalRange,
      customUnit,
      targetValue: calculatedTargetValue,
      notes,
      minValue,
      maxValue
    });

    const savedAssignment = await newAssignment.save();

    // Populate và return
    return await ServiceTestCategories.findById(savedAssignment._id)
      .populate('serviceId', 'serviceName serviceType')
      .populate('testCategoryId', 'name description unit normalRange');
  }

  // Gán nhiều test categories cho service
  async assignMultipleTestCategoriesToService(data: any, userRole: string) {
    // Check permissions
    if (!['doctor', 'staff', 'admin'].includes(userRole)) {
      throw new Error('Only doctors and staff can assign test categories to services');
    }

    const { serviceId, testCategoryIds, isRequired } = data;

    // Validate serviceId
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new Error('Invalid service ID');
    }

    // Validate test category IDs
    for (const id of testCategoryIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid test category ID: ${id}`);
      }
    }

    // Kiểm tra service có tồn tại không
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Kiểm tra test categories có tồn tại không
    const testCategories = await TestCategories.find({
      _id: { $in: testCategoryIds }
    });

    if (testCategories.length !== testCategoryIds.length) {
      throw new Error('One or more test categories not found');
    }

    // Lấy danh sách đã được gán
    const existingAssignments = await ServiceTestCategories.find({
      serviceId,
      testCategoryId: { $in: testCategoryIds }
    });

    // Filter ra những test categories chưa được gán
    const existingTestCategoryIds = existingAssignments.map(a => a.testCategoryId.toString());
    const newTestCategoryIds = testCategoryIds.filter(
      (id: string) => !existingTestCategoryIds.includes(id)
    );

    if (newTestCategoryIds.length === 0) {
      throw new Error('All test categories are already assigned to this service');
    }

    // Tạo assignments mới
    const newAssignments = newTestCategoryIds.map((testCategoryId: string) => ({
      serviceId,
      testCategoryId,
      isRequired
    }));

    const savedAssignments = await ServiceTestCategories.insertMany(newAssignments);

    // Populate và return
    const populatedAssignments = await ServiceTestCategories.find({
      _id: { $in: savedAssignments.map(a => a._id) }
    })
      .populate('serviceId', 'serviceName serviceType')
      .populate('testCategoryId', 'name description unit normalRange');

    return populatedAssignments;
  }

  // Cập nhật service test category
  async updateServiceTestCategory(id: string, updateData: any, userRole: string) {
    // Check permissions
    if (!['doctor', 'staff', 'admin'].includes(userRole)) {
      throw new Error('Only doctors and staff can update service test categories');
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid service test category ID');
    }

    // Tự động tính targetValue từ minValue và maxValue nếu có
    if (updateData.minValue !== undefined && updateData.maxValue !== undefined) {
      updateData.targetValue = ((updateData.minValue + updateData.maxValue) / 2).toString();
    }

    // Tìm và cập nhật
    const updatedAssignment = await ServiceTestCategories.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('serviceId', 'serviceName serviceType')
      .populate('testCategoryId', 'name description unit normalRange');

    if (!updatedAssignment) {
      throw new Error('Service test category not found');
    }

    return updatedAssignment;
  }

  // Xóa test category khỏi service
  async removeTestCategoryFromService(id: string, userRole: string) {
    // Check permissions
    if (!['doctor', 'staff', 'admin'].includes(userRole)) {
      throw new Error('Only doctors and staff can remove test categories from services');
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid service test category ID');
    }

    // Tìm assignment
    const assignment = await ServiceTestCategories.findById(id);
    if (!assignment) {
      throw new Error('Service test category not found');
    }

    // TODO: Kiểm tra xem có test results nào đang sử dụng không
    // Có thể thêm logic để prevent delete nếu có data phụ thuộc

    // Xóa assignment
    await ServiceTestCategories.findByIdAndDelete(id);

    return { message: 'Test category removed from service successfully' };
  }

  // Xóa tất cả test categories của service
  async removeAllTestCategoriesFromService(serviceId: string, userRole: string) {
    // Check permissions
    if (!['doctor', 'staff', 'admin'].includes(userRole)) {
      throw new Error('Only doctors and staff can remove test categories from services');
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new Error('Invalid service ID');
    }

    // Kiểm tra service có tồn tại không
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Xóa tất cả assignments của service
    const result = await ServiceTestCategories.deleteMany({ serviceId });

    return result;
  }
} 