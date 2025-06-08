import { Request, Response } from 'express';
import { AppointmentTestsService } from '../services/appointmentTestsService';
import { AuthRequest } from '../types';

// Controller class để xử lý HTTP requests cho AppointmentTests
class AppointmentTestsController {
  private appointmentTestsService: AppointmentTestsService;

  constructor() {
    this.appointmentTestsService = new AppointmentTestsService();
  }

  // GET /api/appointment-tests - Lấy tất cả appointment tests với pagination
  getAllAppointmentTests = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse query parameters với default values
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const search = req.query.search as string;

      // Gọi service để lấy data
      const result = await this.appointmentTestsService.getAllAppointmentTests(page, limit, search);

      // Trả về response với metadata
      res.status(200).json({
        success: true,
        message: 'Appointment tests retrieved successfully',
        data: result.appointmentTests,
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
        message: 'Failed to retrieve appointment tests',
        error: error.message
      });
    }
  };

  // GET /api/appointment-tests/:id - Lấy appointment test theo ID
  getAppointmentTestById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Gọi service để lấy data
      const appointmentTest = await this.appointmentTestsService.getAppointmentTestById(id);

      res.status(200).json({
        success: true,
        message: 'Appointment test retrieved successfully',
        data: appointmentTest
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
          message: 'Failed to retrieve appointment test',
          error: error.message
        });
      }
    }
  };

  // GET /api/appointment-tests/appointment/:appointmentId - Lấy tests theo appointment ID
  getAppointmentTestsByAppointmentId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;

      // Gọi service để lấy data
      const appointmentTests = await this.appointmentTestsService.getAppointmentTestsByAppointmentId(appointmentId);

      res.status(200).json({
        success: true,
        message: 'Appointment tests retrieved successfully',
        data: appointmentTests
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
          message: 'Failed to retrieve appointment tests',
          error: error.message
        });
      }
    }
  };

  // POST /api/appointment-tests - Tạo appointment test mới
  createAppointmentTest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Validate input data
      const { appointmentId, name, description, price, preparationGuidelines, resultWaitTime } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Test name is required'
        });
        return;
      }

      if (price === undefined || price < 0) {
        res.status(400).json({
          success: false,
          message: 'Valid price is required'
        });
        return;
      }

      // Prepare data để pass vào service
      const data = {
        appointmentId: appointmentId || undefined, // Để service handle default "none"
        name: name.trim(),
        description: description?.trim(),
        price: parseFloat(price),
        preparationGuidelines: preparationGuidelines?.trim(),
        resultWaitTime: resultWaitTime?.trim()
      };

      // Gọi service để tạo
      const newAppointmentTest = await this.appointmentTestsService.createAppointmentTest(data);

      res.status(201).json({
        success: true,
        message: 'Appointment test created successfully',
        data: newAppointmentTest
      });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('already exists') || 
          error.message.includes('required')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create appointment test',
          error: error.message
        });
      }
    }
  };

  // PUT /api/appointment-tests/:id - Cập nhật appointment test
  updateAppointmentTest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { appointmentId, name, description, price, preparationGuidelines, resultWaitTime } = req.body;

      // Prepare update data
      const updateData: any = {};
      if (appointmentId !== undefined) updateData.appointmentId = appointmentId || "none";
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (preparationGuidelines !== undefined) updateData.preparationGuidelines = preparationGuidelines;
      if (resultWaitTime !== undefined) updateData.resultWaitTime = resultWaitTime;

      // Gọi service để update
      const updatedAppointmentTest = await this.appointmentTestsService.updateAppointmentTest(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Appointment test updated successfully',
        data: updatedAppointmentTest
      });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('already exists') || error.message.includes('non-negative')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update appointment test',
          error: error.message
        });
      }
    }
  };

  // DELETE /api/appointment-tests/:id - Xóa appointment test
  deleteAppointmentTest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Gọi service để xóa
      await this.appointmentTestsService.deleteAppointmentTest(id);

      res.status(200).json({
        success: true,
        message: 'Appointment test deleted successfully'
      });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('Cannot delete') || error.message.includes('associated')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete appointment test',
          error: error.message
        });
      }
    }
  };

  // GET /api/appointment-tests/appointment/:appointmentId/total-price - Tính tổng giá
  calculateTotalPriceByAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;

      // Gọi service để tính tổng
      const totalPrice = await this.appointmentTestsService.calculateTotalPriceByAppointment(appointmentId);

      res.status(200).json({
        success: true,
        message: 'Total price calculated successfully',
        data: {
          appointmentId,
          totalPrice
        }
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
          message: 'Failed to calculate total price',
          error: error.message
        });
      }
    }
  };

  // GET /api/appointment-tests/stats/:year/:month - Thống kê theo tháng
  getTestStatsByMonth = async (req: Request, res: Response): Promise<void> => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);

      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        res.status(400).json({
          success: false,
          message: 'Valid year and month (1-12) are required'
        });
        return;
      }

      // Gọi service để lấy thống kê
      const stats = await this.appointmentTestsService.getTestStatsByMonth(year, month);

      res.status(200).json({
        success: true,
        message: 'Test statistics retrieved successfully',
        data: {
          year,
          month,
          ...stats
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve test statistics',
        error: error.message
      });
    }
  };
}

export default new AppointmentTestsController(); 