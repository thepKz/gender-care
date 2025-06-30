import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TestResultsService } from '../services/testResultsService';
import { AuthRequest } from '../types';

// Controller class để xử lý HTTP requests cho TestResults
class TestResultsController {
  private testResultsService: TestResultsService;

  constructor() {
    this.testResultsService = new TestResultsService();
  }

  // GET /api/test-results - Lấy tất cả test results với pagination
  getAllTestResults = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse query parameters với default values
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const search = req.query.search as string;

      // Gọi service để lấy data
      const result = await this.testResultsService.getAllTestResults(page, limit, search);

      // Trả về response với metadata
      res.status(200).json({
        success: true,
        message: 'Test results retrieved successfully',
        data: result.testResults,
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
        message: 'Failed to retrieve test results',
        error: error.message
      });
    }
  };

  // GET /api/test-results/:id - Lấy test result theo ID
  getTestResultById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Gọi service để lấy data
      const testResult = await this.testResultsService.getTestResultById(id);

      res.status(200).json({
        success: true,
        message: 'Test result retrieved successfully',
        data: testResult
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
          message: 'Failed to retrieve test result',
          error: error.message
        });
      }
    }
  };

  // POST /api/test-results - Tạo test result mới (Doctor/Nursing staff only)
  createTestResult = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Validate input data
      const { appointmentId, profileId, doctorId, conclusion, recommendations } = req.body;

      if (!appointmentId) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required'
        });
        return;
      }

      if (!profileId) {
        res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
        return;
      }

      if (!doctorId) {
        res.status(400).json({
          success: false,
          message: 'Doctor ID is required'
        });
        return;
      }

      // Prepare data để pass vào service
      const data = {
        appointmentId: appointmentId.trim(),
        profileId: profileId.trim(),
        doctorId: doctorId.trim(),
        conclusion: conclusion?.trim(),
        recommendations: recommendations?.trim()
      };

      // Gọi service để tạo
      const newTestResult = await this.testResultsService.createTestResult(data, req.user?.role || 'guest');

      res.status(201).json({
        success: true,
        message: 'Test result created successfully',
        data: newTestResult
      });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('already exists') || 
          error.message.includes('required') || error.message.includes('permission')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create test result',
          error: error.message
        });
      }
    }
  };

  // PUT /api/test-results/:id - Cập nhật test result
  updateTestResult = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { conclusion, recommendations } = req.body;

      // Prepare update data
      const updateData: any = {};
      if (conclusion !== undefined) updateData.conclusion = conclusion;
      if (recommendations !== undefined) updateData.recommendations = recommendations;

      // Gọi service để update
      const updatedTestResult = await this.testResultsService.updateTestResult(id, updateData, req.user?.role || 'guest');

      res.status(200).json({
        success: true,
        message: 'Test result updated successfully',
        data: updatedTestResult
      });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('permission')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update test result',
          error: error.message
        });
      }
    }
  };

  // DELETE /api/test-results/:id - Xóa test result
  deleteTestResult = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Gọi service để xóa
      await this.testResultsService.deleteTestResult(id, req.user?.role || 'guest');

      res.status(200).json({
        success: true,
        message: 'Test result deleted successfully'
      });
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('permission') || error.message.includes('Cannot delete')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete test result',
          error: error.message
        });
      }
    }
  };

  // GET /api/test-results/appointment/:appointmentId - Lấy test results theo appointment ID
  getTestResultsByAppointmentId = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { appointmentId } = req.params;
      const testResults = await this.testResultsService.getTestResultsByAppointmentId(appointmentId);

      res.status(200).json({
        success: true,
        message: 'Test results retrieved successfully',
        data: testResults
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
          message: 'Failed to retrieve test results',
          error: error.message
        });
      }
    }
  };

  // GET /api/test-results/profile/:profileId - Lấy test results theo profile ID
  getTestResultsByProfileId = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { profileId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const result = await this.testResultsService.getTestResultsByProfileId(profileId, page, limit);


      res.status(200).json({
        success: true,
        message: 'Test results retrieved successfully',
        data: result.testResults,
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
      if (error.message.includes('Invalid')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve test results',
          error: error.message
        });
      }
    }
  };

  // GET /api/test-results/stats/:year/:month - Lấy thống kê test results theo tháng
  getTestResultStatsByMonth = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);

      const stats = await this.testResultsService.getTestResultStatsByMonth(year, month);

      res.status(200).json({
        success: true,
        message: 'Test result statistics retrieved successfully',
        data: stats
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
          message: 'Failed to retrieve statistics',
          error: error.message
        });
      }
    }
  };

  /**
   * Check if appointment already has test results
   * GET /api/test-results/check/:appointmentId
   */
  checkTestResultsByAppointment = async (req: AuthRequest, res: Response) => {
    try {
      const { appointmentId } = req.params;

      // Validate appointmentId
      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: 'appointmentId is required'
        });
      }

      // Check if TestResults exists for this appointment
      const TestResults = mongoose.model('TestResults');
      const testResult = await TestResults.findOne({ appointmentId });

      return res.status(200).json({
        success: true,
        exists: !!testResult,
        testResultId: testResult?._id || null,
        message: testResult ? 'Test results exist' : 'No test results found for this appointment'
      });

    } catch (error) {
      console.error('Error in checkTestResultsByAppointment:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export default new TestResultsController(); 