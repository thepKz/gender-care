import TestCategories, { ITestCategories } from '../models/TestCategories';
import mongoose from 'mongoose';

// Service class để xử lý business logic cho TestCategories
export class TestCategoriesService {
  
  // Lấy tất cả test categories với pagination và filtering
  async getAllTestCategories(page: number = 1, limit: number = 10, search?: string): Promise<{
    testCategories: ITestCategories[];
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
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Thực hiện query với pagination
    const [testCategories, total] = await Promise.all([
      TestCategories.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      TestCategories.countDocuments(filter)
    ]);

    return {
      testCategories,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  // Lấy test category theo ID
  async getTestCategoryById(id: string): Promise<ITestCategories | null> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid test category ID format');
    }

    const testCategory = await TestCategories.findById(id);
    if (!testCategory) {
      throw new Error('Test category not found');
    }

    return testCategory;
  }

  // Tạo test category mới
  async createTestCategory(data: {
    name: string;
    description?: string;
    unit?: string;
    normalRange?: string;
  }): Promise<ITestCategories> {
    // Validate input data
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Test category name is required');
    }

    // Kiểm tra duplicate name
    const existingCategory = await TestCategories.findOne({ 
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') }
    });
    
    if (existingCategory) {
      throw new Error('Test category with this name already exists');
    }

    // Tạo test category mới
    const testCategory = new TestCategories({
      name: data.name.trim(),
      description: data.description?.trim(),
      unit: data.unit?.trim(),
      normalRange: data.normalRange?.trim()
    });

    return await testCategory.save();
  }

  // Cập nhật test category
  async updateTestCategory(id: string, data: {
    name?: string;
    description?: string;
    unit?: string;
    normalRange?: string;
  }): Promise<ITestCategories> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid test category ID format');
    }

    // Kiểm tra tồn tại
    const existingCategory = await TestCategories.findById(id);
    if (!existingCategory) {
      throw new Error('Test category not found');
    }

    // Kiểm tra duplicate name nếu name được update
    if (data.name && data.name.trim() !== existingCategory.name) {
      const duplicateCategory = await TestCategories.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') }
      });

      if (duplicateCategory) {
        throw new Error('Test category with this name already exists');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim();
    if (data.unit !== undefined) updateData.unit = data.unit?.trim();
    if (data.normalRange !== undefined) updateData.normalRange = data.normalRange?.trim();

    // Thực hiện update
    const updatedCategory = await TestCategories.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      throw new Error('Failed to update test category');
    }

    return updatedCategory;
  }

  // Xóa test category
  async deleteTestCategory(id: string): Promise<void> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid test category ID format');
    }

    // Kiểm tra có đang được sử dụng trong TestResultItems không
    const TestResultItems = (await import('../models/TestResultItems')).default;
    const usageCount = await TestResultItems.countDocuments({ itemNameId: id });
    
    if (usageCount > 0) {
      throw new Error('Cannot delete test category as it is being used in test results');
    }

    // Thực hiện xóa
    const deletedCategory = await TestCategories.findByIdAndDelete(id);
    if (!deletedCategory) {
      throw new Error('Test category not found or already deleted');
    }
  }

  // Lấy test categories để sử dụng trong dropdown/select
  async getTestCategoriesForDropdown(): Promise<Array<{
    id: string;
    name: string;
    unit?: string;
    normalRange?: string;
  }>> {
    const categories = await TestCategories.find({}, 'name unit normalRange')
      .sort({ name: 1 });

    return categories.map(cat => ({
      id: cat._id!.toString(),
      name: cat.name,
      unit: cat.unit,
      normalRange: cat.normalRange
    }));
  }
} 