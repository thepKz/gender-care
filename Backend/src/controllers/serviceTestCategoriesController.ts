import { Request, Response } from 'express';
import { ServiceTestCategoriesService } from '../services/serviceTestCategoriesService';
import { AuthRequest } from '../types';

// Controller class để xử lý HTTP requests cho ServiceTestCategories
class ServiceTestCategoriesController {
  private serviceTestCategoriesService: ServiceTestCategoriesService;

  constructor() {
    this.serviceTestCategoriesService = new ServiceTestCategoriesService();
  }

  // GET /api/service-test-categories/service/:serviceId - Lấy test categories cho service
  getTestCategoriesByServiceId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const result = await this.serviceTestCategoriesService.getTestCategoriesByServiceId(serviceId);

      res.status(200).json({
        success: true,
        message: 'Test categories for service retrieved successfully',
        data: result
      });
    } catch (error: any) {
      if (error.message.includes('Invalid')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve test categories for service',
          error: error.message
        });
      }
    }
  };

  // GET /api/service-test-categories - Lấy tất cả service test categories
  getAllServiceTestCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const search = req.query.search as string;

      const result = await this.serviceTestCategoriesService.getAllServiceTestCategories(page, limit, search);

      res.status(200).json({
        success: true,
        message: 'Service test categories retrieved successfully',
        data: result.serviceTestCategories,
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
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve service test categories',
        error: error.message
      });
    }
  };

  // POST /api/service-test-categories - Gán test category cho service với custom range (Doctor, Staff)
  assignTestCategoryToService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { serviceId, testCategoryId, isRequired, unit, targetValue, minValue, maxValue, thresholdRules } = req.body;
      const userRole = req.user?.role || '';

      if (!serviceId || !testCategoryId) {
        res.status(400).json({
          success: false,
          message: 'Service ID and Test Category ID are required'
        });
        return;
      }

      const data = {
        serviceId,
        testCategoryId,
        isRequired: isRequired !== undefined ? isRequired : true,
        unit: unit?.trim(),
        targetValue: targetValue?.trim(),
        minValue: minValue !== undefined ? Number(minValue) : undefined,
        maxValue: maxValue !== undefined ? Number(maxValue) : undefined,
        thresholdRules: Array.isArray(thresholdRules) ? thresholdRules : undefined
      };

      const result = await this.serviceTestCategoriesService.assignTestCategoryToService(data, userRole);

      res.status(201).json({
        success: true,
        message: 'Test category assigned to service successfully',
        data: result
      });
    } catch (error: any) {
      if (error.message.includes('Only') || error.message.includes('not found') ||
        error.message.includes('already assigned')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to assign test category to service',
          error: error.message
        });
      }
    }
  };

  // POST /api/service-test-categories/bulk - Gán nhiều test categories cho service
  assignMultipleTestCategoriesToService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { serviceId, testCategoryIds, isRequired } = req.body;
      const userRole = req.user?.role || '';

      if (!serviceId || !testCategoryIds || !Array.isArray(testCategoryIds)) {
        res.status(400).json({
          success: false,
          message: 'Service ID and Test Category IDs array are required'
        });
        return;
      }

      const data = {
        serviceId,
        testCategoryIds,
        isRequired: isRequired !== undefined ? isRequired : true
      };

      const result = await this.serviceTestCategoriesService.assignMultipleTestCategoriesToService(data, userRole);

      res.status(201).json({
        success: true,
        message: `${result.length} test categories assigned to service successfully`,
        data: result
      });
    } catch (error: any) {
      if (error.message.includes('Only') || error.message.includes('not found')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to assign test categories to service',
          error: error.message
        });
      }
    }
  };

  // PUT /api/service-test-categories/:id - Cập nhật service test category với custom range
  updateServiceTestCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isRequired, unit, targetValue, minValue, maxValue, thresholdRules } = req.body;
      const userRole = req.user?.role || '';

      const updateData = {
        isRequired,
        unit: unit?.trim(),
        targetValue: targetValue?.trim(),
        minValue: minValue !== undefined ? Number(minValue) : undefined,
        maxValue: maxValue !== undefined ? Number(maxValue) : undefined,
        thresholdRules: Array.isArray(thresholdRules) ? thresholdRules : undefined
      };
      const result = await this.serviceTestCategoriesService.updateServiceTestCategory(id, updateData, userRole);

      res.status(200).json({
        success: true,
        message: 'Service test category updated successfully',
        data: result
      });
    } catch (error: any) {
      if (error.message.includes('Only') || error.message.includes('Invalid') ||
        error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update service test category',
          error: error.message
        });
      }
    }
  };

  // DELETE /api/service-test-categories/:id - Xóa test category khỏi service
  removeTestCategoryFromService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userRole = req.user?.role || '';

      await this.serviceTestCategoriesService.removeTestCategoryFromService(id, userRole);

      res.status(200).json({
        success: true,
        message: 'Test category removed from service successfully'
      });
    } catch (error: any) {
      if (error.message.includes('Only')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to remove test category from service',
          error: error.message
        });
      }
    }
  };

  // DELETE /api/service-test-categories/service/:serviceId - Xóa tất cả test categories của service
  removeAllTestCategoriesFromService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const userRole = req.user?.role || '';

      const result = await this.serviceTestCategoriesService.removeAllTestCategoriesFromService(serviceId, userRole);

      res.status(200).json({
        success: true,
        message: `${result.deletedCount} test categories removed from service successfully`,
        data: { deletedCount: result.deletedCount }
      });
    } catch (error: any) {
      if (error.message.includes('Only')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('Invalid')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to remove test categories from service',
          error: error.message
        });
      }
    }
  };
}

export default new ServiceTestCategoriesController(); 