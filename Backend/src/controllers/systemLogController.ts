import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import systemLogService from '../services/systemLogService';
import { LogLevel, LogAction } from '../models/SystemLogs';

/**
 * Lấy danh sách logs theo phân quyền
 * Manager: xem public + manager
 * Admin: xem tất cả
 */
export const getSystemLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    if (!userRole || !['manager', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem system logs'
      });
    }

    const {
      page = 1,
      limit = 50,
      level,
      action,
      userId,
      userEmail,
      targetType,
      startDate,
      endDate,
      search
    } = req.query;

    const options = {
      userRole,
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 100), // Max 100 per page
      level: level as LogLevel,
      action: action as LogAction,
      userId: userId as string,
      userEmail: userEmail as string,
      targetType: targetType as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string
    };

    const result = await systemLogService.getLogs(options);

    // Log this access
    await systemLogService.logFromRequest(
      req,
      LogAction.DATA_EXPORT,
      `User viewed system logs (page ${page}, ${result.logs.length} logs)`,
      { 
        level: LogLevel.MANAGER,
        targetType: 'system_logs',
        metadata: { filters: options }
      }
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[SystemLogController] Error getting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy system logs'
    });
  }
};

/**
 * Lấy thống kê logs
 */
export const getSystemLogStats = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    if (!userRole || !['manager', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem thống kê logs'
      });
    }

    const stats = await systemLogService.getLogStats(userRole);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[SystemLogController] Error getting log stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê logs'
    });
  }
};

/**
 * Xóa logs cũ (chỉ admin)
 */
export const cleanupOldLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền cleanup logs'
      });
    }

    const { daysToKeep = 90 } = req.body;
    const deletedCount = await systemLogService.cleanupOldLogs(daysToKeep);

    // Log this admin action
    await systemLogService.logFromRequest(
      req,
      LogAction.SYSTEM_CONFIG_CHANGE,
      `Admin cleaned up ${deletedCount} old logs (kept ${daysToKeep} days)`,
      { 
        level: LogLevel.ADMIN,
        targetType: 'system_logs',
        metadata: { deletedCount, daysToKeep }
      }
    );

    res.json({
      success: true,
      message: `Đã xóa ${deletedCount} logs cũ`,
      data: { deletedCount }
    });
  } catch (error) {
    console.error('[SystemLogController] Error cleaning up logs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cleanup logs'
    });
  }
};

/**
 * Tạo log thủ công (testing/debugging)
 */
export const createTestLog = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền tạo test log'
      });
    }

    const { action, level, message, targetType, metadata } = req.body;

    const log = await systemLogService.logFromRequest(
      req,
      action as LogAction,
      message,
      {
        level: level as LogLevel,
        targetType,
        metadata
      }
    );

    res.json({
      success: true,
      message: 'Đã tạo test log',
      data: log
    });
  } catch (error) {
    console.error('[SystemLogController] Error creating test log:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo test log'
    });
  }
};

/**
 * Export logs to CSV (chỉ admin)
 */
export const exportLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền export logs'
      });
    }

    const {
      startDate,
      endDate,
      level,
      action
    } = req.query;

    const options = {
      userRole: 'admin',
      page: 1,
      limit: 10000, // Large limit for export
      level: level as LogLevel,
      action: action as LogAction,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const result = await systemLogService.getLogs(options);

    // Convert to CSV format
    const csvHeaders = ['Timestamp', 'Action', 'Level', 'User', 'Message', 'IP', 'Target'];
    const csvRows = result.logs.map(log => [
      log.createdAt.toISOString(),
      log.action,
      log.level,
      log.userEmail || 'N/A',
      log.message.replace(/"/g, '""'), // Escape quotes
      log.ipAddress || 'N/A',
      log.targetType || 'N/A'
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Log this export
    await systemLogService.logFromRequest(
      req,
      LogAction.DATA_EXPORT,
      `Admin exported ${result.logs.length} logs to CSV`,
      { 
        level: LogLevel.ADMIN,
        targetType: 'system_logs',
        metadata: { exportCount: result.logs.length, filters: options }
      }
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="system_logs_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('[SystemLogController] Error exporting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi export logs'
    });
  }
}; 