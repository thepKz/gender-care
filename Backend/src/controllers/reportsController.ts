import { Response } from 'express';
import { AuthRequest } from '../types';
import PaymentTracking from '../models/PaymentTracking';
import User from '../models/User';
import Appointments from '../models/Appointments';

/**
 * GET /reports/management
 * Return aggregated data for Admin/Manager reports section.
 *  - revenueByMonth: last 12 months revenue (successful payments)
 *  - userRoleDistribution: number of users per role
 *  - appointmentStatusCounts: count of appointments by status
 *  - appointmentsLast7Days: total appointments per day (last 7 days)
 */
export const getManagementReports = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    if (!role || !['admin', 'manager'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const now = new Date();

    // Revenue last 12 months
    const startOfPeriod = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const revenueAgg = await PaymentTracking.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: startOfPeriod }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Normalize to 12 months array
    const revenueByMonth: { month: string; total: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const match = (revenueAgg as any[]).find(
        (r) => r._id.year === date.getFullYear() && r._id.month === date.getMonth() + 1
      );
      const label = formatMonthLabel(date);
      revenueByMonth.push({ month: label, total: match ? match.total : 0 });
    }

    // User role distribution
    const roleAgg = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const userRoleDistribution: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (roleAgg as any[]).forEach((r) => {
      userRoleDistribution[r._id] = r.count;
    });

    // Appointment status counts (overall)
    const statusAgg = await Appointments.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const appointmentStatusCounts: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (statusAgg as any[]).forEach((s) => {
      appointmentStatusCounts[s._id] = s.count;
    });

    // Appointments last 7 days (daily totals)
    const start7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const appt7Agg = await Appointments.aggregate([
      {
        $match: { createdAt: { $gte: start7 } }
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.day': 1 } }
    ]);

    // Normalize 7-day array
    const appointmentsLast7Days: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start7.getFullYear(), start7.getMonth(), start7.getDate() + i);
      const label = d.toISOString().split('T')[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const match = (appt7Agg as any[]).find((e) => e._id.day === label);
      appointmentsLast7Days.push({ date: label, count: match ? match.count : 0 });
    }

    res.json({
      success: true,
      data: {
        revenueByMonth,
        userRoleDistribution,
        appointmentStatusCounts,
        appointmentsLast7Days
      }
    });
  } catch (error) {
    console.error('Error fetching management reports:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Helper to format month label YYYY-MM
const formatMonthLabel = (date: Date) => {
  const m = date.getMonth() + 1;
  const monthStr = m < 10 ? `0${m}` : `${m}`;
  return `${date.getFullYear()}-${monthStr}`;
};