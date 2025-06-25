import { Request, Response } from 'express';
import { TestResultsService } from '../services/testResultsService';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';
import { TestResults } from '../models';

// Controller class để xử lý HTTP requests cho TestResults
class TestResultsController {
  private testResultsService: TestResultsService;

  constructor() {
    this.testResultsService = new TestResultsService();
  }

  // GET /api/test-results - Lấy tất cả test results với pagination
  getAllTestResults = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const search = req.query.search as string;

      const result = await this.testResultsService.getAllTestResults(page, limit, search);

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

  // POST /api/test-results - Tạo test result mới (Doctor và Staff)
  createTestResult = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { appointmentId, profileId, doctorId, conclusion, recommendations } = req.body;
      const userRole = req.user?.role || '';

      if (!appointmentId || !profileId || !doctorId) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID, Profile ID, and Doctor ID are required'
        });
        return;
      }

      const data = {
        appointmentId,
        profileId,
        doctorId,
        conclusion: conclusion?.trim(),
        recommendations: recommendations?.trim()
      };

      const newTestResult = await this.testResultsService.createTestResult(data, userRole);

      res.status(201).json({
        success: true,
        message: 'Test result created successfully',
        data: newTestResult
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
      const userRole = req.user?.role || '';

      const updateData = {
        conclusion,
        recommendations
      };

      const updatedTestResult = await this.testResultsService.updateTestResult(id, updateData, userRole);

      res.status(200).json({
        success: true,
        message: 'Test result updated successfully',
        data: updatedTestResult
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
      const userRole = req.user?.role || '';

      await this.testResultsService.deleteTestResult(id, userRole);

      res.status(200).json({
        success: true,
        message: 'Test result deleted successfully'
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
      } else if (error.message.includes('Cannot delete') || error.message.includes('associated')) {
        res.status(409).json({
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

  // GET /api/test-results/customer/:customerId - Lấy test results theo customer ID
  getTestResultsByCustomerId = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

      // Kiểm tra quyền: customer chỉ được xem kết quả của mình
      if (req.user?.role === 'customer' && req.user?._id !== customerId) {
        res.status(403).json({
          success: false,
          message: 'You can only view your own test results'
        });
        return;
      }

      const result = await this.testResultsService.getTestResultsByProfileId(customerId, page, limit);

      res.status(200).json({
        success: true,
        message: 'Customer test results retrieved successfully',
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
          message: 'Failed to retrieve customer test results',
          error: error.message
        });
      }
    }
  };

  // GET /api/test-results/appointment-test/:appointmentTestId - Lấy test results theo appointment test ID
  getTestResultsByAppointmentTestId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentTestId } = req.params;
      const testResults = await this.testResultsService.getTestResultsByAppointmentId(appointmentTestId);

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

  // GET /api/test-results/stats/:year/:month - Thống kê test results theo tháng
  getTestResultStatsByMonth = async (req: Request, res: Response): Promise<void> => {
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

      const stats = await this.testResultsService.getTestResultStatsByMonth(year, month);

      res.status(200).json({
        success: true,
        message: 'Test result statistics retrieved successfully',
        data: {
          year,
          month,
          ...stats
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve test result statistics',
        error: error.message
      });
    }
  };

  /**
   * Check if appointment already has test results
   * GET /api/test-results/check/:appointmentId
   */
  checkTestResultsByAppointment = async (req: Request, res: Response) => {
    try {
      const { appointmentId } = req.params;

      // Validate appointmentId
      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: 'appointmentId is required'
        });
      }

      // Directly check if TestResults exists for this appointment
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