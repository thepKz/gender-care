import { Request, Response } from "express";
import LoginHistory from "../models/LoginHistory";
import { AuthRequest } from "../types";

export const createLoginHistory = async (req: Request, res: Response) => {
  try {
    const { userId, ipAddress, userAgent, status, failReason } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ message: "Thiếu userId hoặc status" });
    }
    const history = await LoginHistory.create({
      userId,
      ipAddress,
      userAgent,
      status,
      failReason,
      loginAt: new Date(),
    });
    return res.status(201).json({ data: history });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLoginHistoryByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "Thiếu userId" });
    const history = await LoginHistory.find({ userId }).sort({ loginAt: -1 });
    return res.status(200).json({ data: history });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /login-history - Get all login history for management (Admin/Manager only)
export const getAllLoginHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    if (!userRole || !['admin', 'manager'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or Manager role required.'
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'loginAt', 
      sortOrder = 'desc',
      status,
      search,
      dateFrom,
      dateTo
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (dateFrom || dateTo) {
      filter.loginAt = {};
      if (dateFrom) {
        filter.loginAt.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        filter.loginAt.$lte = new Date(dateTo as string);
      }
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Get login history with user information
    const loginHistoryQuery = LoginHistory.find(filter)
      .populate('userId', 'fullName email phone avatar')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // If search is provided, we need to filter by user info
    let loginHistory;
    if (search && typeof search === 'string') {
      // Get all records first, then filter by populated user data
      const allRecords = await LoginHistory.find(filter)
        .populate('userId', 'fullName email phone avatar')
        .sort(sort);
      
      const searchLower = search.toLowerCase();
      const filteredRecords = allRecords.filter(record => {
        const user = record.userId as any;
        return (
          user?.fullName?.toLowerCase().includes(searchLower) ||
          user?.email?.toLowerCase().includes(searchLower) ||
          user?.phone?.includes(search) ||
          record.ipAddress?.includes(search)
        );
      });
      
      // Apply pagination to filtered results
      loginHistory = filteredRecords.slice(skip, skip + limitNum);
    } else {
      loginHistory = await loginHistoryQuery;
    }

    // Get total count for pagination
    const total = search ? 
      (await LoginHistory.find(filter).populate('userId', 'fullName email')).filter(record => {
        const user = record.userId as any;
        const searchLower = String(search).toLowerCase();
        return (
          user?.fullName?.toLowerCase().includes(searchLower) ||
          user?.email?.toLowerCase().includes(searchLower) ||
          user?.phone?.includes(String(search)) ||
          record.ipAddress?.includes(String(search))
        );
      }).length :
      await LoginHistory.countDocuments(filter);

    // Format the response
    const formattedHistory = loginHistory.map((record: any) => ({
      id: record._id,
      userId: record.userId?._id,
      username: record.userId?.email?.split('@')[0] || 'unknown',
      fullName: record.userId?.fullName || 'N/A',
      email: record.userId?.email || 'N/A',
      phone: record.userId?.phone || 'N/A',
      loginTime: record.loginAt,
      logoutTime: null, // We don't track logout time yet
      ipAddress: record.ipAddress || 'N/A',
      userAgent: record.userAgent || 'N/A',
      deviceType: getUserDeviceType(record.userAgent),
      browser: getUserBrowser(record.userAgent),
      os: getUserOS(record.userAgent),
      location: 'N/A', // Would need IP geolocation service
      status: record.status === 'success' ? 'active' : 'failed',
      failReason: record.failReason,
      sessionDuration: null // We don't track session duration yet
    }));

    res.json({
      success: true,
      data: formattedHistory,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper functions to parse user agent
const getUserDeviceType = (userAgent?: string): string => {
  if (!userAgent) return 'unknown';
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
  if (/Tablet|iPad/.test(userAgent)) return 'tablet';
  return 'desktop';
};

const getUserBrowser = (userAgent?: string): string => {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'unknown';
};

const getUserOS = (userAgent?: string): string => {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'unknown';
}; 