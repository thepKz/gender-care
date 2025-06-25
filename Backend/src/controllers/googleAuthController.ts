import { Request, Response } from 'express';
import googleCalendarService from '../services/googleCalendarService';
import { AuthRequest } from '../types/auth';
import mongoose from 'mongoose';

// Validate ObjectId helper
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * GET /api/google-auth/connect/:doctorId
 * Tạo OAuth URL cho doctor kết nối Google
 */
export const connectGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;

    if (!isValidObjectId(doctorId)) {
      res.status(400).json({ 
        message: 'Doctor ID không hợp lệ' 
      });
      return;
    }

    // Generate OAuth URL
    const authUrl = googleCalendarService.generateAuthUrl(doctorId);

    res.status(200).json({
      message: 'OAuth URL được tạo thành công. Hãy truy cập để kết nối Google.',
      data: {
        authUrl,
        doctorId
      }
    });

  } catch (error: any) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi tạo OAuth URL' 
    });
  }
};

/**
 * GET /api/google-auth/callback
 * Handle OAuth callback từ Google
 */
export const googleAuthCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state: doctorId, error } = req.query;

    // Check for OAuth errors
    if (error) {
      res.status(400).json({
        message: `OAuth error: ${error}`,
        error: req.query.error_description || 'Unknown OAuth error'
      });
      return;
    }

    if (!code || !doctorId) {
      res.status(400).json({ 
        message: 'Thiếu authorization code hoặc doctor ID' 
      });
      return;
    }

    if (!isValidObjectId(doctorId as string)) {
      res.status(400).json({ 
        message: 'Doctor ID không hợp lệ' 
      });
      return;
    }

    // Exchange code for tokens
    const success = await googleCalendarService.exchangeCodeForTokens(
      code as string, 
      doctorId as string
    );

    if (success) {
      // Redirect to frontend success page hoặc return JSON
      res.status(200).json({
        message: 'Kết nối Google thành công! Bác sĩ có thể tạo Google Meet.',
        data: {
          doctorId,
          connected: true,
          timestamp: new Date()
        }
      });
    } else {
      res.status(400).json({
        message: 'Không thể kết nối Google. Vui lòng thử lại.'
      });
    }

  } catch (error: any) {
    console.error('Error in OAuth callback:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server trong quá trình kết nối Google' 
    });
  }
};

/**
 * GET /api/google-auth/status/:doctorId
 * Kiểm tra trạng thái kết nối Google của doctor
 */
export const getConnectionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;

    if (!isValidObjectId(doctorId)) {
      res.status(400).json({ 
        message: 'Doctor ID không hợp lệ' 
      });
      return;
    }

    const status = await googleCalendarService.checkConnectionStatus(doctorId);

    res.status(200).json({
      message: 'Lấy trạng thái kết nối thành công',
      data: {
        doctorId,
        ...status
      }
    });

  } catch (error: any) {
    console.error('Error checking connection status:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi kiểm tra trạng thái kết nối' 
    });
  }
};

/**
 * POST /api/google-auth/disconnect/:doctorId
 * Ngắt kết nối Google của doctor
 */
export const disconnectGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;

    if (!isValidObjectId(doctorId)) {
      res.status(400).json({ 
        message: 'Doctor ID không hợp lệ' 
      });
      return;
    }

    const success = await googleCalendarService.disconnectGoogle(doctorId);

    if (success) {
      res.status(200).json({
        message: 'Ngắt kết nối Google thành công',
        data: {
          doctorId,
          connected: false,
          timestamp: new Date()
        }
      });
    } else {
      res.status(404).json({
        message: 'Không tìm thấy kết nối Google để ngắt'
      });
    }

  } catch (error: any) {
    console.error('Error disconnecting Google:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi ngắt kết nối Google' 
    });
  }
};

/**
 * GET /api/google-auth/test-meet/:doctorId
 * Test tạo Google Meet (chỉ để development/testing)
 */
export const testCreateMeet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const { title = 'Test Meeting', duration = 30 } = req.body;

    if (!isValidObjectId(doctorId)) {
      res.status(400).json({ 
        message: 'Doctor ID không hợp lệ' 
      });
      return;
    }

    // Test meeting time - 5 minutes from now
    const startTime = new Date(Date.now() + 5 * 60 * 1000);

    const meetData = await googleCalendarService.createGoogleMeet(
      title,
      startTime,
      duration,
      [], // No attendees for test
      doctorId
    );

    res.status(200).json({
      message: 'Test Google Meet tạo thành công',
      data: meetData
    });

  } catch (error: any) {
    console.error('Error testing Google Meet creation:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi test tạo Google Meet' 
    });
  }
}; 