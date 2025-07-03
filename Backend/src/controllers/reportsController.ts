import { Response } from 'express';
import { AuthRequest } from '../types';
import PaymentTracking from '../models/PaymentTracking';
import User from '../models/User';
import Appointments from '../models/Appointments';
import { reportService, ReportFilters } from '../services/reportService';

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

    // Normalize to 12 months array with enhanced demo data
    const revenueByMonth: { month: string; total: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const match = (revenueAgg as any[]).find(
        (r) => r._id.year === date.getFullYear() && r._id.month === date.getMonth() + 1
      );
      const label = formatMonthLabel(date);
      const total = match ? match.total : 0;
      revenueByMonth.push({ month: label, total });
    }

    // User role distribution with enhanced demo data
    const roleAgg = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const userRoleDistribution: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (roleAgg as any[]).forEach((r) => {
      userRoleDistribution[r._id] = r.count;
    });
    
    // Ensure all roles are represented
    const allRoles = ['customer', 'staff', 'doctor', 'manager', 'admin'];
    allRoles.forEach(role => {
      if (!(role in userRoleDistribution)) {
        userRoleDistribution[role] = 0;
      }
    });

    // Appointment status counts (overall) with enhanced demo data
    const statusAgg = await Appointments.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const appointmentStatusCounts: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (statusAgg as any[]).forEach((s) => {
      appointmentStatusCounts[s._id] = s.count;
    });
    
    // Ensure proper fallback for status counts
    const statusLabels = ['completed', 'confirmed', 'pending', 'cancelled', 'in-progress'];
    statusLabels.forEach(status => {
      if (!(status in appointmentStatusCounts)) {
        appointmentStatusCounts[status] = 0;
      }
    });

    // Appointments last 7 days (daily totals) with enhanced data
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

    // Normalize 7-day array with enhanced demo data for better visualization
    const appointmentsLast7Days: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start7.getFullYear(), start7.getMonth(), start7.getDate() + i);
      const label = d.toISOString().split('T')[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const match = (appt7Agg as any[]).find((e) => e._id.day === label);
      const count = match ? match.count : 0;
      appointmentsLast7Days.push({ date: label, count });
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

/**
 * POST /reports/detailed
 * Lấy dữ liệu báo cáo chi tiết dựa trên bộ lọc.
 */
export const getDetailedReport = async (req: AuthRequest, res: Response) => {
  try {
    const filters: ReportFilters = req.body;
    const data = await reportService.getDetailedReport(filters);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching detailed report:', error);
    if (error instanceof Error && error.message.includes('not supported')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /reports/export
 * Xuất dữ liệu báo cáo chi tiết ra file Excel.
 */
export const exportDetailedReport = async (req: AuthRequest, res: Response) => {
  try {
    const filters: ReportFilters = req.body;
    const data = await reportService.getDetailedReport(filters);

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ success: false, message: 'No data to export for the selected criteria.' });
    }
    
    // Define columns based on report type
    // This can be expanded in the future
    const columns = [
        { header: 'ID Cuộc hẹn', key: 'id', width: 30 },
        { header: 'Bệnh nhân', key: 'patientName', width: 25 },
        { header: 'SĐT Bệnh nhân', key: 'patientPhone', width: 15 },
        { header: 'Bác sĩ', key: 'doctorName', width: 25 },
        { header: 'Dịch vụ', key: 'serviceName', width: 30 },
        { header: 'Ngày hẹn', key: 'appointmentDate', width: 15 },
        { header: 'Giờ hẹn', key: 'appointmentTime', width: 15 },
        { header: 'Trạng thái', key: 'status', width: 15 },
        { header: 'Thanh toán', key: 'paymentStatus', width: 15 },
        { header: 'Tổng tiền', key: 'totalAmount', width: 15 },
        { header: 'Ngày tạo', key: 'createdAt', width: 20 },
    ];

    const excelBuffer = await reportService.generateExcelReport(data, columns);
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
    res.send(excelBuffer);

  } catch (error) {
    console.error('Error exporting detailed report:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /reports/seed-sample-data
 * Generate sample data for dashboard demonstration (Admin only)
 */
export const seedSampleData = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    if (!role || role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const now = new Date();
    let created = {
      users: 0,
      appointments: 0,
      payments: 0
    };

    // Create sample users for different roles
    const sampleUsers = [
      { fullName: 'Nguyễn Văn A', email: 'nguyenvana@example.com', phone: '0901234567', role: 'customer', password: 'hashedpassword' },
      { fullName: 'Trần Thị B', email: 'tranthib@example.com', phone: '0901234568', role: 'customer', password: 'hashedpassword' },
      { fullName: 'Lê Thị C', email: 'lethic@example.com', phone: '0901234569', role: 'customer', password: 'hashedpassword' },
      { fullName: 'Phạm Văn D', email: 'phamvand@example.com', phone: '0901234570', role: 'staff', password: 'hashedpassword' },
      { fullName: 'Dr. Hoàng Thị E', email: 'drhoangthie@example.com', phone: '0901234571', role: 'doctor', password: 'hashedpassword' },
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create(userData);
        created.users++;
      }
    }

    // Get some existing user IDs for appointments
    const existingUsers = await User.find({ role: 'customer' }).limit(3);
    
    // Create sample appointments for last 30 days
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'in-progress'];
    
    for (let i = 0; i < 25; i++) {
      const appointmentDate = new Date(now.getTime() - (Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000));
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const amount = Math.floor(Math.random() * 500000) + 100000; // 100k-600k VND
      
      if (existingUsers.length > 0) {
        const randomUser = existingUsers[Math.floor(Math.random() * existingUsers.length)];
        
        const appointment = await Appointments.create({
          createdByUserId: randomUser._id,
          appointmentDate,
          appointmentTime: ['09:00', '10:00', '14:00', '15:00', '16:00'][Math.floor(Math.random() * 5)],
          status,
          totalAmount: amount,
          paymentStatus: status === 'completed' ? 'paid' : 'unpaid',
          symptoms: 'Sample symptoms for demo',
          createdAt: appointmentDate
        });
        
        created.appointments++;

        // Create payment tracking if appointment is completed
        if (status === 'completed') {
          await PaymentTracking.create({
            appointmentId: appointment._id,
            amount,
            status: 'success',
            method: 'card',
            transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
            createdAt: appointmentDate
          });
          created.payments++;
        }
      }
    }

    // Create additional payment records for revenue history
    for (let i = 0; i < 12; i++) {
      const paymentDate = new Date(now.getFullYear(), now.getMonth() - i, Math.floor(Math.random() * 28) + 1);
      const amount = Math.floor(Math.random() * 20000000) + 5000000; // 5M-25M VND per month
      
      await PaymentTracking.create({
        amount,
        status: 'success',
        method: 'transfer',
        transactionId: `MONTHLY_${paymentDate.getTime()}`,
        createdAt: paymentDate
      });
      created.payments++;
    }

    res.json({
      success: true,
      message: 'Sample data created successfully',
      data: created
    });

  } catch (error) {
    console.error('Error seeding sample data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /reports/analytics
 * Trả về dữ liệu analytics thật cho dashboard (doctor performance, service popularity, demographics, hourly, system stats)
 */
export const getAnalyticsReports = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    if (!role || !['admin', 'manager'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const data = await reportService.getAnalyticsReports();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching analytics reports:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Helper to format month label YYYY-MM
const formatMonthLabel = (date: Date) => {
  const m = date.getMonth() + 1;
  const monthStr = m < 10 ? `0${m}` : `${m}`;
  return `${date.getFullYear()}-${monthStr}`;
};