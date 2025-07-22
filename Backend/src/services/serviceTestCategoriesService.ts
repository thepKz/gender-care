import mongoose from 'mongoose';
import ServiceTestCategories from '../models/ServiceTestCategories';
import Service from '../models/Service';
import TestCategories from '../models/TestCategories';

export class ServiceTestCategoriesService {

  // Lấy test categories cho một service cụ thể
  async getTestCategoriesByServiceId(serviceId: string) {
    // Validate serviceId
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new Error('ID dịch vụ không hợp lệ');
    }

    // Kiểm tra service có tồn tại không
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Không tìm thấy dịch vụ');
    }

    // Lấy test categories của service (KHÔNG filter isDeleted)
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

    // Get total count (KHÔNG filter isDeleted)
    const total = await ServiceTestCategories.countDocuments(searchQuery);

    // Get paginated results (KHÔNG filter isDeleted)
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
    // Check permissions - cho phép cả manager
    if (!['doctor', 'staff', 'admin', 'manager'].includes(userRole)) {
      throw new Error('Chỉ bác sĩ, nhân viên, quản trị viên, quản lý mới có thể gán chỉ số xét nghiệm cho dịch vụ');
    }

    const { serviceId, testCategoryId, isRequired, unit, targetValue, minValue, maxValue, thresholdRules } = data;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new Error('ID dịch vụ không hợp lệ');
    }
    if (!mongoose.Types.ObjectId.isValid(testCategoryId)) {
      throw new Error('ID chỉ số xét nghiệm không hợp lệ');
    }

    // Kiểm tra service và test category có tồn tại không
    const [service, testCategory] = await Promise.all([
      Service.findById(serviceId),
      TestCategories.findById(testCategoryId)
    ]);

    if (!service) {
      throw new Error('Không tìm thấy dịch vụ');
    }
    if (!testCategory) {
      throw new Error('Không tìm thấy chỉ số xét nghiệm');
    }

    // Kiểm tra đã được gán chưa
    const existingAssignment = await ServiceTestCategories.findOne({
      serviceId,
      testCategoryId
    });

    if (existingAssignment) {
      throw new Error('Chỉ số xét nghiệm này đã được gán cho dịch vụ này');
    }

    // Validate thresholdRules nếu có
    if (thresholdRules && Array.isArray(thresholdRules)) {
      for (const rule of thresholdRules) {
        if (!rule.flag || !rule.message) {
          throw new Error('Mỗi ngưỡng đánh giá phải có flag và message');
        }
      }
    }

    // Tự động tính targetValue từ minValue và maxValue nếu chưa có
    let calculatedTargetValue = targetValue;
    if (minValue !== undefined && maxValue !== undefined && !targetValue) {
      calculatedTargetValue = ((minValue + maxValue) / 2).toString();
    }

    // Tạo assignment mới
    const newAssignment = new ServiceTestCategories({
      serviceId,
      testCategoryId,
      isRequired,
      unit,
      targetValue: calculatedTargetValue,
      minValue,
      maxValue,
      thresholdRules
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
    if (!['doctor', 'staff', 'admin', 'manager'].includes(userRole)) {
      throw new Error('Chỉ bác sĩ, nhân viên, quản trị viên, quản lý mới có thể gán chỉ số xét nghiệm cho dịch vụ');
    }

    const { serviceId, testCategoryIds, isRequired } = data;

    // Validate serviceId
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new Error('ID dịch vụ không hợp lệ');
    }

    // Validate test category IDs
    for (const id of testCategoryIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`ID chỉ số xét nghiệm không hợp lệ: ${id}`);
      }
    }

    // Kiểm tra service có tồn tại không
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Không tìm thấy dịch vụ');
    }

    // Kiểm tra test categories có tồn tại không
    const testCategories = await TestCategories.find({
      _id: { $in: testCategoryIds }
    });

    if (testCategories.length !== testCategoryIds.length) {
      throw new Error('Một hoặc nhiều chỉ số xét nghiệm không tồn tại');
    }

    // Lấy danh sách đã được gán (KHÔNG filter isDeleted)
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
      throw new Error('Tất cả chỉ số xét nghiệm đã được gán cho dịch vụ này');
    }

    // Tạo assignments mới
    const newAssignments = newTestCategoryIds.map((testCategoryId: string) => ({
      serviceId,
      testCategoryId,
      isRequired
    }));

    const savedAssignments = await ServiceTestCategories.insertMany(newAssignments);

    // Populate và return (KHÔNG filter isDeleted)
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
    if (!['doctor', 'staff', 'admin', 'manager'].includes(userRole)) {
      throw new Error('Chỉ bác sĩ, nhân viên, quản trị viên, quản lý mới có thể cập nhật chỉ số xét nghiệm cho dịch vụ');
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('ID cấu hình chỉ số không hợp lệ');
    }

    // Nếu chỉ update isDeleted (xóa mềm), chỉ update trường này để tránh ảnh hưởng logic khác
    let updateFields: any = {};
    if (typeof updateData.isDeleted !== 'undefined') {
      updateFields.isDeleted = updateData.isDeleted;
    } else {
      const { isRequired, unit, targetValue, minValue, maxValue, thresholdRules } = updateData;
      // Validate thresholdRules nếu có
      if (thresholdRules && Array.isArray(thresholdRules)) {
        for (const rule of thresholdRules) {
          if (!rule.flag || !rule.message) {
            throw new Error('Mỗi ngưỡng đánh giá phải có flag và message');
          }
        }
      }
      // Tự động tính targetValue từ minValue và maxValue nếu chưa có
      let calculatedTargetValue = targetValue;
      if (minValue !== undefined && maxValue !== undefined && !targetValue) {
        calculatedTargetValue = ((minValue + maxValue) / 2).toString();
      }
      updateFields = {
        isRequired,
        unit,
        targetValue: calculatedTargetValue,
        minValue,
        maxValue,
        thresholdRules
      };
    }
    // Debug log giá trị updateFields
    console.log('Update ServiceTestCategory:', { id, updateFields });
    // Update assignment
    const updatedAssignment = await ServiceTestCategories.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    )
      .populate('serviceId', 'serviceName serviceType')
      .populate('testCategoryId', 'name description unit normalRange');
    // Debug log kết quả update
    console.log('Updated ServiceTestCategory result:', updatedAssignment);

    if (!updatedAssignment) {
      throw new Error('Không tìm thấy cấu hình chỉ số');
    }

    return updatedAssignment;
  }

  // Xóa test category khỏi service
  async removeTestCategoryFromService(id: string, userRole: string) {
    // Check permissions
    if (!['doctor', 'staff', 'admin', 'manager'].includes(userRole)) {
      throw new Error('Chỉ bác sĩ, nhân viên, quản trị viên, quản lý mới có thể xóa chỉ số xét nghiệm khỏi dịch vụ');
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('ID cấu hình chỉ số không hợp lệ');
    }

    // Tìm assignment
    const assignment = await ServiceTestCategories.findById(id);
    if (!assignment) {
      throw new Error('Không tìm thấy cấu hình chỉ số');
    }

    // TODO: Kiểm tra xem có test results nào đang sử dụng không
    // Có thể thêm logic để prevent delete nếu có data phụ thuộc

    // Xóa mềm assignment
    await ServiceTestCategories.findByIdAndUpdate(id, { isDeleted: true });
    return { message: 'Chỉ số xét nghiệm đã được xóa khỏi dịch vụ thành công' };
  }

  // Xóa tất cả test categories của service
  async removeAllTestCategoriesFromService(serviceId: string, userRole: string) {
    // Check permissions
    if (!['doctor', 'staff', 'admin', 'manager'].includes(userRole)) {
      throw new Error('Chỉ bác sĩ, nhân viên, quản trị viên, quản lý mới có thể xóa chỉ số xét nghiệm khỏi dịch vụ');
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new Error('ID dịch vụ không hợp lệ');
    }

    // Kiểm tra service có tồn tại không
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Không tìm thấy dịch vụ');
    }

    // Xóa mềm tất cả assignments của service
    const result = await ServiceTestCategories.updateMany({ serviceId }, { isDeleted: true });
    return result;
  }
} 