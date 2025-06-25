import { Request, Response } from 'express';
import { TestCategoriesService } from '../services/testCategoriesService';
import { AuthRequest } from '../types';

// Controller class để xử lý HTTP requests cho TestCategories
class TestCategoriesController {
  private testCategoriesService: TestCategoriesService;

  constructor() {
    this.testCategoriesService = new TestCategoriesService();
  }

  // GET /api/test-categories - Lấy tất cả test categories với pagination
  getAllTestCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse query parameters với default values
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 items per page
      const search = req.query.search as string;

      // Gọi service để lấy data
      const result = await this.testCategoriesService.getAllTestCategories(page, limit, search);

      // Trả về response với metadata
      res.status(200).json({
        success: true,
        message: 'Test categories retrieved successfully',
        data: result.testCategories,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalItems: result.total,
          itemsPerPage: limit,
          hasNextPage: result.currentPage < result.totalPages,
          hasPrevPage: result.currentPage > 1
        }
      });
    } catch (error: any) {
      // Error handling
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve test categories',
        error: error.message
      });
    }
  };

  // GET /api/test-categories/all - Lấy TẤT CẢ test categories mà không có pagination
  getAllTestCategoriesWithoutPagination = async (req: Request, res: Response): Promise<void> => {
    try {
      const search = req.query.search as string;

      // Gọi service để lấy tất cả data
      const testCategories = await this.testCategoriesService.getAllTestCategoriesWithoutPagination(search);

      // Trả về response
      res.status(200).json({
        success: true,
        message: 'All test categories retrieved successfully',
        data: testCategories
      });
    } catch (error: any) {
      // Error handling
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve all test categories',
        error: error.message
      });
    }
  };

  // GET /api/test-categories/:id - Lấy test category theo ID
  getTestCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Gọi service để lấy data
      const testCategory = await this.testCategoriesService.getTestCategoryById(id);

      // Trả về response
      res.status(200).json({
        success: true,
        message: 'Test category retrieved successfully',
        data: testCategory
      });
    } catch (error: any) {
      // Handle specific errors
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve test category',
          error: error.message
        });
      }
    }
  };

  // POST /api/test-categories - Tạo test category mới
  createTestCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Validate input data
      const { name, description, unit, normalRange } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Test category name is required'
        });
        return;
      }

      // Prepare data để pass vào service
      const data = {
        name: name.trim(),
        description: description?.trim(),
        unit: unit?.trim(),
        normalRange: normalRange?.trim()
      };

      // Gọi service để tạo
      const newTestCategory = await this.testCategoriesService.createTestCategory(data);

      // Trả về response
      res.status(201).json({
        success: true,
        message: 'Test category created successfully',
        data: newTestCategory
      });
    } catch (error: any) {
      // Handle specific errors
      if (error.message.includes('already exists') || error.message.includes('required')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create test category',
          error: error.message
        });
      }
    }
  };

  // PUT /api/test-categories/:id - Cập nhật test category
  updateTestCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description, unit, normalRange } = req.body;

      // Prepare update data
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (unit !== undefined) updateData.unit = unit;
      if (normalRange !== undefined) updateData.normalRange = normalRange;

      // Gọi service để update
      const updatedTestCategory = await this.testCategoriesService.updateTestCategory(id, updateData);

      // Trả về response
      res.status(200).json({
        success: true,
        message: 'Test category updated successfully',
        data: updatedTestCategory
      });
    } catch (error: any) {
      // Handle specific errors
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('already exists')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update test category',
          error: error.message
        });
      }
    }
  };

  // DELETE /api/test-categories/:id - Xóa test category
  deleteTestCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Gọi service để xóa
      await this.testCategoriesService.deleteTestCategory(id);

      // Trả về response
      res.status(200).json({
        success: true,
        message: 'Test category deleted successfully'
      });
    } catch (error: any) {
      // Handle specific errors
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('Cannot delete') || error.message.includes('being used')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete test category',
          error: error.message
        });
      }
    }
  };

  // GET /api/test-categories/dropdown - Lấy test categories cho dropdown/select
  getTestCategoriesForDropdown = async (req: Request, res: Response): Promise<void> => {
    try {
      // Gọi service để lấy data
      const testCategories = await this.testCategoriesService.getTestCategoriesForDropdown();

      // Trả về response
      res.status(200).json({
        success: true,
        message: 'Test categories for dropdown retrieved successfully',
        data: testCategories
      });
    } catch (error: any) {
      // Error handling
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve test categories for dropdown',
        error: error.message
      });
    }
  };
}

export default new TestCategoriesController(); 