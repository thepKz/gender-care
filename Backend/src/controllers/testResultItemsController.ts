import { Request, Response } from 'express';
import { TestResultItemsService } from '../services/testResultItemsService';
import { AuthRequest } from '../types';

// Controller class để xử lý HTTP requests cho TestResultItems
class TestResultItemsController {
  private testResultItemsService: TestResultItemsService;

  constructor() {
    this.testResultItemsService = new TestResultItemsService();
  }

  // GET /api/test-result-items - Lấy tất cả test result items với pagination
  getAllTestResultItems = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const search = req.query.search as string;

      const result = await this.testResultItemsService.getAllTestResultItems(page, limit, search);

      res.status(200).json({
        success: true,
        message: 'Test result items retrieved successfully',
        data: result.testResultItems,
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
        message: 'Failed to retrieve test result items',
        error: error.message
      });
    }
  };

  // GET /api/test-result-items/appointment/:appointmentId - Lấy items theo appointment ID
  getTestResultItemsByAppointmentId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;
      const testResultItems = await this.testResultItemsService.getTestResultItemsByAppointmentId(appointmentId);

      res.status(200).json({
        success: true,
        message: 'Test result items retrieved successfully',
        data: testResultItems
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
          message: 'Failed to retrieve test result items',
          error: error.message
        });
      }
    }
  };

  // GET /api/test-result-items/:id - Lấy test result item theo ID
  getTestResultItemById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const testResultItem = await this.testResultItemsService.getTestResultItemById(id);

      res.status(200).json({
        success: true,
        message: 'Test result item retrieved successfully',
        data: testResultItem
      });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve test result item',
          error: error.message
        });
      }
    }
  };

  // POST /api/test-result-items - Tạo test result item mới
  createTestResultItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { appointmentId, itemNameId, value, unit, flag } = req.body;
      const userRole = req.user?.role || '';

      if (!appointmentId || !itemNameId || !value) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID, item name ID, and value are required'
        });
        return;
      }

      const data = {
        appointmentId,
        itemNameId,
        value,
        unit,
        flag
      };

      const newTestResultItem = await this.testResultItemsService.createTestResultItem(data, userRole);

      res.status(201).json({
        success: true,
        message: 'Test result item created successfully',
        data: newTestResultItem
      });
    } catch (error: any) {
      if (error.message.includes('Only') || error.message.includes('required') || 
          error.message.includes('not found') || error.message.includes('already exists')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create test result item',
          error: error.message
        });
      }
    }
  };

  // POST /api/test-result-items/bulk - Tạo nhiều test result items cùng lúc
  createMultipleTestResultItems = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { appointmentId, items } = req.body;
      const userRole = req.user?.role || '';

      if (!appointmentId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID and items array are required'
        });
        return;
      }

      const data = { appointmentId, items };
      const createdItems = await this.testResultItemsService.createMultipleTestResultItems(data, userRole);

      res.status(201).json({
        success: true,
        message: `${createdItems.length} test result items created successfully`,
        data: createdItems
      });
    } catch (error: any) {
      if (error.message.includes('Only') || error.message.includes('required') || 
          error.message.includes('not found') || error.message.includes('already exists')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create test result items',
          error: error.message
        });
      }
    }
  };

  // PUT /api/test-result-items/:id - Cập nhật test result item
  updateTestResultItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { value, unit, flag } = req.body;
      const userRole = req.user?.role || '';

      const updateData = {
        value,
        unit,
        flag
      };

      const updatedTestResultItem = await this.testResultItemsService.updateTestResultItem(id, updateData, userRole);

      res.status(200).json({
        success: true,
        message: 'Test result item updated successfully',
        data: updatedTestResultItem
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
          message: 'Failed to update test result item',
          error: error.message
        });
      }
    }
  };

  // DELETE /api/test-result-items/:id - Xóa test result item
  deleteTestResultItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userRole = req.user?.role || '';

      await this.testResultItemsService.deleteTestResultItem(id, userRole);

      res.status(200).json({
        success: true,
        message: 'Test result item deleted successfully'
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
          message: 'Failed to delete test result item',
          error: error.message
        });
      }
    }
  };

  // GET /api/test-result-items/summary/:appointmentId - Lấy summary của items theo appointment
  getTestResultItemsSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;
      const summary = await this.testResultItemsService.getTestResultItemsSummary(appointmentId);

      res.status(200).json({
        success: true,
        message: 'Test result items summary retrieved successfully',
        data: summary
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
          message: 'Failed to retrieve test result items summary',
          error: error.message
        });
      }
    }
  };

  // GET /api/test-result-items/template/:serviceId - Lấy template cho việc nhập kết quả xét nghiệm
  getTestResultTemplateForService = async (req: Request, res: Response): Promise<void> => {
    try {
      const { serviceId } = req.params;

      const template = await this.testResultItemsService.getTestResultTemplateForService(serviceId);

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Service not found or has no test categories'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Test result template retrieved successfully',
        data: template
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
          message: 'Failed to retrieve test result template',
          error: error.message
        });
      }
    }
  };
}

export default new TestResultItemsController(); 