import SystemLog, { ISystemLog, LogAction, LogLevel } from '../models/SystemLogs';
import { AuthRequest } from '../types';

interface CreateLogOptions {
  action: LogAction;
  level?: LogLevel;
  message: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  targetId?: string;
  targetType?: string;
  targetData?: any;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  metadata?: any;
}

interface GetLogsOptions {
  userRole: string;
  page?: number;
  limit?: number;
  level?: LogLevel;
  action?: LogAction;
  userId?: string;
  userEmail?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

class SystemLogService {
  /**
   * Tạo log mới
   */
  async createLog(options: CreateLogOptions): Promise<ISystemLog> {
    try {
      const log = new SystemLog({
        action: options.action,
        level: options.level || LogLevel.PUBLIC,
        message: options.message,
        userId: options.userId,
        userEmail: options.userEmail,
        userRole: options.userRole,
        targetId: options.targetId,
        targetType: options.targetType,
        targetData: options.targetData,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        endpoint: options.endpoint,
        method: options.method,
        metadata: options.metadata
      });

      await log.save();
      return log;
    } catch (error) {
      console.error('[SystemLogService] Error creating log:', error);
      throw error;
    }
  }

  /**
   * Lấy logs theo phân quyền
   */
  async getLogs(options: GetLogsOptions): Promise<{
    logs: ISystemLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        userRole,
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
      } = options;

      // Build query với phân quyền
      const query: any = {};

      // Phân quyền xem logs
      if (userRole === 'admin') {
        // Admin xem tất cả
      } else if (userRole === 'manager') {
        // Manager chỉ xem public và manager level
        query.level = { $in: [LogLevel.PUBLIC, LogLevel.MANAGER] };
      } else {
        // Các role khác không được xem logs
        throw new Error('Insufficient permissions to view logs');
      }

      // Apply filters
      if (level) query.level = level;
      if (action) query.action = action;
      if (userId) query.userId = userId;
      if (userEmail) query.userEmail = new RegExp(userEmail, 'i');
      if (targetType) query.targetType = targetType;

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      // Search filter
      if (search) {
        query.$or = [
          { message: new RegExp(search, 'i') },
          { userEmail: new RegExp(search, 'i') },
          { action: new RegExp(search, 'i') },
          { targetType: new RegExp(search, 'i') }
        ];
      }

      // Execute query với pagination
      const skip = (page - 1) * limit;
      const logs = await SystemLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email role')
        .lean();

      const total = await SystemLog.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        logs,
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('[SystemLogService] Error getting logs:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê logs
   */
  async getLogStats(userRole: string): Promise<{
    totalLogs: number;
    todayLogs: number;
    loginCount: number;
    errorCount: number;
    actionStats: Array<{ action: string; count: number }>;
    levelStats: Array<{ level: string; count: number }>;
  }> {
    try {
      // Build query với phân quyền
      const baseQuery: any = {};
      
      if (userRole === 'manager') {
        baseQuery.level = { $in: [LogLevel.PUBLIC, LogLevel.MANAGER] };
      }
      // Admin không có restrict

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalLogs,
        todayLogs,
        loginCount,
        errorCount,
        actionStats,
        levelStats
      ] = await Promise.all([
        SystemLog.countDocuments(baseQuery),
        
        SystemLog.countDocuments({
          ...baseQuery,
          createdAt: { $gte: today }
        }),
        
        SystemLog.countDocuments({
          ...baseQuery,
          action: LogAction.LOGIN
        }),
        
        SystemLog.countDocuments({
          ...baseQuery,
          action: { $in: [LogAction.UNAUTHORIZED_ACCESS, LogAction.SUSPICIOUS_ACTIVITY] }
        }),
        
        SystemLog.aggregate([
          { $match: baseQuery },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $project: { action: '$_id', count: 1, _id: 0 } }
        ]),
        
        SystemLog.aggregate([
          { $match: baseQuery },
          { $group: { _id: '$level', count: { $sum: 1 } } },
          { $project: { level: '$_id', count: 1, _id: 0 } }
        ])
      ]);

      return {
        totalLogs,
        todayLogs,
        loginCount,
        errorCount,
        actionStats,
        levelStats
      };
    } catch (error) {
      console.error('[SystemLogService] Error getting stats:', error);
      throw error;
    }
  }

  /**
   * Helper function để log từ request
   */
  async logFromRequest(
    req: AuthRequest,
    action: LogAction,
    message: string,
    options: {
      level?: LogLevel;
      targetId?: string;
      targetType?: string;
      targetData?: any;
      metadata?: any;
    } = {}
  ): Promise<ISystemLog> {
    return this.createLog({
      action,
      level: options.level || LogLevel.PUBLIC,
      message,
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      targetId: options.targetId,
      targetType: options.targetType,
      targetData: options.targetData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method as any,
      metadata: options.metadata
    });
  }

  /**
   * Xóa logs cũ (manual cleanup)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await SystemLog.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      console.log(`[SystemLogService] Cleaned up ${result.deletedCount} old logs`);
      return result.deletedCount;
    } catch (error) {
      console.error('[SystemLogService] Error cleaning up logs:', error);
      throw error;
    }
  }
}

export default new SystemLogService(); 