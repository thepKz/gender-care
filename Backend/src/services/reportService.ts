import ExcelJS from 'exceljs';
import Appointments from '../models/Appointments';
import User from '../models/User';
import PaymentTracking from '../models/PaymentTracking';
import Service from '../models/Service';
import Doctor from '../models/Doctor';
import ServicePackages from '../models/ServicePackages';
import DoctorQA from '../models/DoctorQA';
import { NotFoundError } from '../errors/notFoundError';

export type ReportType =
  | 'APPOINTMENT_DETAIL'
  | 'REVENUE_BY_SERVICE'
  | 'USER_STATS'
  | 'DOCTOR_PERFORMANCE';

export interface ReportFilters {
  reportType: ReportType;
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  serviceId?: string;
  appointmentStatus?: string[];
}

class ReportService {
  /**
   * Generates a detailed report based on the provided filters.
   * @param filters - The filters to apply to the report.
   * @returns The generated report data.
   */
  public async getDetailedReport(filters: ReportFilters): Promise<any> {
    switch (filters.reportType) {
      case 'APPOINTMENT_DETAIL':
        return this.getAppointmentDetailReport(filters);
      // Add other report types here in the future
      default:
        throw new Error(`Report type '${filters.reportType}' is not supported.`);
    }
  }

  /**
   * Generates an Excel buffer for the given report data.
   * @param data - The data to include in the report.
   * @param columns - The columns configuration for the Excel sheet.
   * @returns A Buffer containing the Excel file.
   */
  public async generateExcelReport(data: any[], columns: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GenderHealthcareSystem';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Report');

    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 20
    }));

    // Add header row and style it
    worksheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' }
    };
    
    worksheet.addRows(data);

    // Auto-adjust column widths based on content
    worksheet.columns.forEach((column: any) => {
        let maxColumnLength = 0;
        if(column.eachCell) {
            column.eachCell({ includeEmpty: true }, (cell: any) => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxColumnLength) {
                    maxColumnLength = columnLength;
                }
            });
            column.width = maxColumnLength < 10 ? 10 : maxColumnLength + 2;
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }

  /**
   * Specific implementation for the Appointment Detail Report.
   * @param filters - The filters to apply.
   * @returns The appointment detail report data.
   */
  private async getAppointmentDetailReport(filters: ReportFilters): Promise<any> {
    const { dateFrom, dateTo, appointmentStatus, doctorId, serviceId } = filters;

    const query: any = {};

    if (dateFrom && dateTo) {
      query.appointmentDate = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo),
      };
    }

    if (appointmentStatus && appointmentStatus.length > 0) {
      query.status = { $in: appointmentStatus };
    }
    
    if (doctorId) {
        query.doctorId = doctorId;
    }

    if (serviceId) {
        query.serviceId = serviceId;
    }

    const appointments = await Appointments.find(query)
      .populate('createdByUserId', 'fullName email phone')
      .populate('doctorId', 'name specialization')
      .populate('serviceId', 'name')
      .sort({ appointmentDate: -1 });

    if (!appointments) {
      throw new NotFoundError('No appointments found for the selected criteria.');
    }

    return appointments.map(appt => ({
        id: appt._id,
        patientName: (appt.createdByUserId as any)?.fullName || 'N/A',
        patientPhone: (appt.createdByUserId as any)?.phone || 'N/A',
        doctorName: (appt.doctorId as any)?.name || 'Chưa phân công',
        serviceName: (appt.serviceId as any)?.name || 'N/A',
        appointmentDate: appt.appointmentDate.toISOString().split('T')[0],
        appointmentTime: appt.appointmentTime,
        status: appt.status,
        paymentStatus: appt.paymentStatus || 'unpaid',
        // Ensure totalAmount is always a valid number
        totalAmount: typeof appt.totalAmount === 'number' ? appt.totalAmount : 0,
        createdAt: appt.createdAt?.toISOString() || new Date().toISOString()
    }));
  }

  /**
   * Trả về dữ liệu analytics thật cho dashboard (doctor performance, service popularity, demographics, hourly, system stats)
   */
  public async getAnalyticsReports(): Promise<any> {
    // Doctor performance
    const doctorAgg = await Appointments.aggregate([
      {
        $group: {
          _id: '$doctorId',
          totalAppointments: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      { $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$doctorInfo.name', 'N/A'] },
          totalAppointments: 1,
          completed: 1,
          cancelled: 1,
          revenue: 1,
          completionRate: {
            $cond: [
              { $eq: ['$totalAppointments', 0] },
              0,
              { $divide: ['$completed', '$totalAppointments'] }
            ]
          }
        }
      }
    ]);

    // Service popularity
    const serviceAgg = await Appointments.aggregate([
      {
        $group: {
          _id: '$serviceId',
          totalBookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'serviceInfo'
        }
      },
      { $unwind: { path: '$serviceInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$serviceInfo.name', 'N/A'] },
          totalBookings: 1,
          revenue: 1
        }
      }
    ]);

    // Patient demographics (age, gender)
    const patientAgg = await User.aggregate([
      {
        $match: { role: 'customer', dateOfBirth: { $exists: true } }
      },
      {
        $project: {
          gender: 1,
          age: {
            $dateDiff: {
              startDate: '$dateOfBirth',
              endDate: new Date(),
              unit: 'year'
            }
          }
        }
      }
    ]);
    const ageGroups = [
      { label: '0-18', min: 0, max: 18 },
      { label: '19-30', min: 19, max: 30 },
      { label: '31-45', min: 31, max: 45 },
      { label: '46-60', min: 46, max: 60 },
      { label: '60+', min: 61, max: 200 }
    ];
    const demographics = ageGroups.map(group => ({
      ageGroup: group.label,
      male: patientAgg.filter(p => p.age >= group.min && p.age <= group.max && p.gender === 'male').length,
      female: patientAgg.filter(p => p.age >= group.min && p.age <= group.max && p.gender === 'female').length,
      other: patientAgg.filter(p => p.age >= group.min && p.age <= group.max && !['male','female'].includes(p.gender)).length,
      total: patientAgg.filter(p => p.age >= group.min && p.age <= group.max).length
    }));

    // Hourly distribution
    const hourlyAgg = await Appointments.aggregate([
      {
        $project: {
          hour: { $hour: '$appointmentDate' }
        }
      },
      {
        $group: {
          _id: '$hour',
          totalAppointments: { $sum: 1 }
        }
      }
    ]);
    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => {
      const found = hourlyAgg.find(h => h._id === i);
      return { hour: i, totalAppointments: found ? found.totalAppointments : 0 };
    });

    // System stats (mocked for now, cần bổ sung nếu có bảng log/monitoring)
    const systemStats = {
      uptime: 99.8,
      avgWaitTime: 15,
      resourceUtilization: 78.3
    };

    return {
      doctorPerformance: doctorAgg,
      servicePopularity: serviceAgg,
      patientDemographics: demographics,
      hourlyDistribution,
      systemStats
    };
  }

  /**
   * Lấy báo cáo doanh thu theo tuần/tháng/quý
   */
  public async getRevenueReports(period: 'week' | 'month' | 'quarter' = 'month', limit: number = 12): Promise<any> {
    const now = new Date();
    let groupBy: any;
    let dateFormat: string;
    let startDate: Date;

    switch (period) {
      case 'week':
        // Lấy 12 tuần gần nhất
        startDate = new Date(now.getTime() - (12 * 7 * 24 * 60 * 60 * 1000));
        groupBy = {
          year: { $year: '$paidAt' },
          week: { $week: '$paidAt' }
        };
        dateFormat = 'week';
        break;
      case 'quarter':
        // Lấy 4 quý gần nhất
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        groupBy = {
          year: { $year: '$paidAt' },
          quarter: {
            $ceil: { $divide: [{ $month: '$paidAt' }, 3] }
          }
        };
        dateFormat = 'quarter';
        break;
      default: // month
        // Lấy 12 tháng gần nhất
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        groupBy = {
          year: { $year: '$paidAt' },
          month: { $month: '$paidAt' }
        };
        dateFormat = 'month';
        break;
    }

    const revenueData = await PaymentTracking.aggregate([
      {
        $match: {
          status: 'success',
          paidAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, [`_id.${dateFormat === 'week' ? 'week' : dateFormat === 'quarter' ? 'quarter' : 'month'}`]: 1 }
      },
      { $limit: limit }
    ]);

    return revenueData.map(item => ({
      period: this.formatPeriodLabel(item._id, dateFormat),
      totalRevenue: item.totalRevenue,
      totalTransactions: item.totalTransactions,
      averageAmount: Math.round(item.averageAmount),
      periodData: item._id
    }));
  }

  /**
   * Lấy báo cáo tổng quan về appointments
   */
  public async getAppointmentOverview(): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Tổng số appointments
    const totalAppointments = await Appointments.countDocuments();

    // Appointments trong tháng này
    const monthlyAppointments = await Appointments.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Appointments trong tuần này
    const weeklyAppointments = await Appointments.countDocuments({
      createdAt: { $gte: startOfWeek }
    });

    // Phân tích theo status
    const statusAnalysis = await Appointments.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          percentage: { $sum: 1 }
        }
      }
    ]);

    const totalForPercentage = statusAnalysis.reduce((sum, item) => sum + item.count, 0);
    statusAnalysis.forEach(item => {
      item.percentage = totalForPercentage > 0 ? Math.round((item.count / totalForPercentage) * 100) : 0;
    });

    // Tỉ lệ hoàn thành và hủy
    const completedCount = statusAnalysis.find(s => s._id === 'completed')?.count || 0;
    const cancelledCount = statusAnalysis.find(s => ['cancelled', 'doctor_cancel', 'payment_cancelled'].includes(s._id))?.count || 0;

    const completionRate = totalForPercentage > 0 ? Math.round((completedCount / totalForPercentage) * 100) : 0;
    const cancellationRate = totalForPercentage > 0 ? Math.round((cancelledCount / totalForPercentage) * 100) : 0;

    return {
      totalAppointments,
      monthlyAppointments,
      weeklyAppointments,
      statusAnalysis,
      completionRate,
      cancellationRate,
      successfulAppointments: completedCount,
      cancelledAppointments: cancelledCount
    };
  }

  /**
   * Lấy thống kê về payments qua PayOS
   */
  public async getPaymentStatistics(): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Tổng tiền thu được qua PayOS
    const payosStats = await PaymentTracking.aggregate([
      {
        $match: {
          paymentGateway: 'payos',
          status: 'success'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Tiền thu được trong tháng này
    const monthlyPayosStats = await PaymentTracking.aggregate([
      {
        $match: {
          paymentGateway: 'payos',
          status: 'success',
          paidAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    // Thống kê refund
    const refundStats = await PaymentTracking.aggregate([
      {
        $match: {
          status: 'refunded'
        }
      },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: '$amount' },
          totalRefundTransactions: { $sum: 1 }
        }
      }
    ]);

    const payosData = payosStats[0] || { totalAmount: 0, totalTransactions: 0, averageAmount: 0 };
    const monthlyData = monthlyPayosStats[0] || { totalAmount: 0, totalTransactions: 0 };
    const refundData = refundStats[0] || { totalRefunded: 0, totalRefundTransactions: 0 };

    return {
      totalRevenue: payosData.totalAmount,
      totalTransactions: payosData.totalTransactions,
      averageTransactionAmount: Math.round(payosData.averageAmount),
      monthlyRevenue: monthlyData.totalAmount,
      monthlyTransactions: monthlyData.totalTransactions,
      totalRefunded: refundData.totalRefunded,
      totalRefundTransactions: refundData.totalRefundTransactions,
      refundRate: payosData.totalTransactions > 0 ?
        Math.round((refundData.totalRefundTransactions / payosData.totalTransactions) * 100) : 0
    };
  }

  /**
   * Lấy thống kê bác sĩ được đặt nhiều nhất
   */
  public async getDoctorRankings(): Promise<any> {
    // Ranking theo appointments
    const appointmentRankings = await Appointments.aggregate([
      {
        $match: {
          doctorId: { $exists: true, $ne: null },
          status: { $in: ['completed', 'confirmed', 'scheduled'] }
        }
      },
      {
        $group: {
          _id: '$doctorId',
          appointmentCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctorInfo.userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          doctorId: '$_id',
          appointmentCount: 1,
          totalRevenue: { $ifNull: ['$totalRevenue', 0] },
          doctorName: { $arrayElemAt: ['$userInfo.fullName', 0] },
          specialization: { $arrayElemAt: ['$doctorInfo.specialization', 0] },
          rating: { $arrayElemAt: ['$doctorInfo.rating', 0] }
        }
      },
      { $sort: { appointmentCount: -1 } },
      { $limit: 10 }
    ]);

    // Ranking theo consultations (DoctorQA)
    const consultationRankings = await DoctorQA.aggregate([
      {
        $match: {
          doctorId: { $exists: true, $ne: null },
          status: { $in: ['completed', 'answered'] }
        }
      },
      {
        $group: {
          _id: '$doctorId',
          consultationCount: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctorInfo.userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          doctorId: '$_id',
          consultationCount: 1,
          totalRevenue: { $ifNull: ['$totalRevenue', 0] },
          doctorName: { $arrayElemAt: ['$userInfo.fullName', 0] },
          specialization: { $arrayElemAt: ['$doctorInfo.specialization', 0] },
          rating: { $arrayElemAt: ['$doctorInfo.rating', 0] }
        }
      },
      { $sort: { consultationCount: -1 } },
      { $limit: 10 }
    ]);

    return {
      appointmentRankings,
      consultationRankings
    };
  }

  /**
   * Lấy thống kê thời gian được book nhiều nhất (cao điểm)
   */
  public async getPeakTimeAnalysis(): Promise<any> {
    // Phân tích theo giờ trong ngày
    const hourlyAnalysis = await Appointments.aggregate([
      {
        $match: {
          appointmentTime: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$appointmentTime',
          count: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          timeSlot: '$_id',
          totalBookings: '$count',
          completedBookings: '$completedCount',
          completionRate: {
            $cond: [
              { $gt: ['$count', 0] },
              { $multiply: [{ $divide: ['$completedCount', '$count'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalBookings: -1 } }
    ]);

    // Phân tích theo ngày trong tuần
    const weekdayAnalysis = await Appointments.aggregate([
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$appointmentDate' },
          status: 1
        }
      },
      {
        $group: {
          _id: '$dayOfWeek',
          count: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          dayOfWeek: '$_id',
          totalBookings: '$count',
          completedBookings: '$completedCount',
          completionRate: {
            $cond: [
              { $gt: ['$count', 0] },
              { $multiply: [{ $divide: ['$completedCount', '$count'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalBookings: -1 } }
    ]);

    // Map day numbers to names
    const dayNames = ['', 'Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    weekdayAnalysis.forEach(item => {
      item.dayName = dayNames[item.dayOfWeek];
    });

    return {
      hourlyAnalysis,
      weekdayAnalysis,
      peakHour: hourlyAnalysis[0]?.timeSlot || 'N/A',
      peakDay: weekdayAnalysis[0]?.dayName || 'N/A'
    };
  }

  /**
   * Lấy thống kê dịch vụ được đặt nhiều nhất/ít nhất
   */
  public async getServicePopularityAnalysis(): Promise<any> {
    const serviceStats = await Appointments.aggregate([
      {
        $match: {
          serviceId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$serviceId',
          bookingCount: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'serviceInfo'
        }
      },
      {
        $project: {
          serviceId: '$_id',
          serviceName: { $arrayElemAt: ['$serviceInfo.serviceName', 0] },
          serviceType: { $arrayElemAt: ['$serviceInfo.serviceType', 0] },
          price: { $arrayElemAt: ['$serviceInfo.price', 0] },
          bookingCount: 1,
          completedCount: 1,
          totalRevenue: { $ifNull: ['$totalRevenue', 0] },
          completionRate: {
            $cond: [
              { $gt: ['$bookingCount', 0] },
              { $multiply: [{ $divide: ['$completedCount', '$bookingCount'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { bookingCount: -1 } }
    ]);

    return {
      mostPopular: serviceStats.slice(0, 10),
      leastPopular: serviceStats.slice(-5).reverse(),
      totalServices: serviceStats.length
    };
  }

  /**
   * Lấy thống kê gói dịch vụ được đặt nhiều nhất/ít nhất và gói đang giảm giá
   */
  public async getPackageAnalysis(): Promise<any> {
    // Thống kê gói được đặt nhiều nhất
    const packageStats = await Appointments.aggregate([
      {
        $match: {
          packageId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$packageId',
          bookingCount: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'servicepackages',
          localField: '_id',
          foreignField: '_id',
          as: 'packageInfo'
        }
      },
      {
        $project: {
          packageId: '$_id',
          packageName: { $arrayElemAt: ['$packageInfo.name', 0] },
          price: { $arrayElemAt: ['$packageInfo.price', 0] },
          priceBeforeDiscount: { $arrayElemAt: ['$packageInfo.priceBeforeDiscount', 0] },
          bookingCount: 1,
          completedCount: 1,
          totalRevenue: { $ifNull: ['$totalRevenue', 0] },
          completionRate: {
            $cond: [
              { $gt: ['$bookingCount', 0] },
              { $multiply: [{ $divide: ['$completedCount', '$bookingCount'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { bookingCount: -1 } }
    ]);

    // Lấy các gói đang giảm giá
    const discountedPackages = await ServicePackages.find({
      isActive: true,
      $expr: { $lt: ['$price', '$priceBeforeDiscount'] }
    }).select('name price priceBeforeDiscount durationInDays').lean();

    const discountedPackagesWithStats = discountedPackages.map(pkg => ({
      ...pkg,
      discountAmount: pkg.priceBeforeDiscount - pkg.price,
      discountPercentage: Math.round(((pkg.priceBeforeDiscount - pkg.price) / pkg.priceBeforeDiscount) * 100)
    }));

    return {
      mostPopular: packageStats.slice(0, 10),
      leastPopular: packageStats.slice(-5).reverse(),
      discountedPackages: discountedPackagesWithStats,
      totalPackages: packageStats.length,
      totalDiscountedPackages: discountedPackagesWithStats.length
    };
  }

  /**
   * Lấy báo cáo tổng hợp cho admin dashboard
   */
  public async getAdminDashboardReports(): Promise<any> {
    const [
      revenueReports,
      appointmentOverview,
      paymentStats,
      doctorRankings,
      peakTimeAnalysis,
      servicePopularity,
      packageAnalysis
    ] = await Promise.all([
      this.getRevenueReports('month', 12),
      this.getAppointmentOverview(),
      this.getPaymentStatistics(),
      this.getDoctorRankings(),
      this.getPeakTimeAnalysis(),
      this.getServicePopularityAnalysis(),
      this.getPackageAnalysis()
    ]);

    return {
      revenue: {
        monthly: revenueReports,
        weekly: await this.getRevenueReports('week', 12),
        quarterly: await this.getRevenueReports('quarter', 4)
      },
      appointments: appointmentOverview,
      payments: paymentStats,
      doctors: doctorRankings,
      peakTimes: peakTimeAnalysis,
      services: servicePopularity,
      packages: packageAnalysis
    };
  }

  /**
   * Export admin dashboard reports to Excel/PDF
   */
  public async exportAdminDashboard(data: any, format: 'excel' | 'pdf', sections: string[] = []): Promise<Buffer> {
    if (format === 'excel') {
      return this.exportAdminDashboardToExcel(data, sections);
    } else {
      return this.exportAdminDashboardToPDF(data, sections);
    }
  }

  /**
   * Export admin dashboard to Excel
   */
  private async exportAdminDashboardToExcel(data: any, sections: string[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gender Healthcare System';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Tổng quan');
    this.addSummarySheetData(summarySheet, data);

    // Revenue sheet
    if (!sections.length || sections.includes('revenue')) {
      const revenueSheet = workbook.addWorksheet('Doanh thu');
      this.addRevenueSheetData(revenueSheet, data.revenue);
    }

    // Appointments sheet
    if (!sections.length || sections.includes('appointments')) {
      const appointmentsSheet = workbook.addWorksheet('Lịch hẹn');
      this.addAppointmentsSheetData(appointmentsSheet, data.appointments);
    }

    // Doctors sheet
    if (!sections.length || sections.includes('doctors')) {
      const doctorsSheet = workbook.addWorksheet('Bác sĩ');
      this.addDoctorsSheetData(doctorsSheet, data.doctors);
    }

    // Services sheet
    if (!sections.length || sections.includes('services')) {
      const servicesSheet = workbook.addWorksheet('Dịch vụ');
      this.addServicesSheetData(servicesSheet, data.services);
    }

    // Packages sheet
    if (!sections.length || sections.includes('packages')) {
      const packagesSheet = workbook.addWorksheet('Gói dịch vụ');
      this.addPackagesSheetData(packagesSheet, data.packages);
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Export revenue report to Excel/PDF
   */
  public async exportRevenueReport(revenueData: any[], period: string, format: 'excel' | 'pdf'): Promise<Buffer> {
    if (format === 'excel') {
      return this.exportRevenueToExcel(revenueData, period);
    } else {
      return this.exportRevenueToPDF(revenueData, period);
    }
  }

  /**
   * Export revenue data to Excel
   */
  private async exportRevenueToExcel(revenueData: any[], period: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gender Healthcare System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(`Doanh thu theo ${period}`);

    // Add headers
    worksheet.columns = [
      { header: 'Kỳ', key: 'period', width: 15 },
      { header: 'Tổng doanh thu', key: 'totalRevenue', width: 20 },
      { header: 'Số giao dịch', key: 'totalTransactions', width: 15 },
      { header: 'Trung bình/GD', key: 'averageAmount', width: 20 }
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    // Add data
    revenueData.forEach(item => {
      worksheet.addRow({
        period: item.period,
        totalRevenue: item.totalRevenue,
        totalTransactions: item.totalTransactions,
        averageAmount: item.averageAmount
      });
    });

    // Add totals row
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalTransactions = revenueData.reduce((sum, item) => sum + item.totalTransactions, 0);
    const avgAmount = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    worksheet.addRow({});
    const totalRow = worksheet.addRow({
      period: 'TỔNG CỘNG',
      totalRevenue: totalRevenue,
      totalTransactions: totalTransactions,
      averageAmount: avgAmount
    });
    totalRow.font = { bold: true };

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Add summary sheet data
   */
  private addSummarySheetData(worksheet: ExcelJS.Worksheet, data: any) {
    worksheet.columns = [
      { header: 'Chỉ số', key: 'metric', width: 30 },
      { header: 'Giá trị', key: 'value', width: 20 },
      { header: 'Đơn vị', key: 'unit', width: 15 }
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    // Add summary data
    const summaryData = [
      { metric: 'Tổng doanh thu', value: data.payments.totalRevenue, unit: 'VND' },
      { metric: 'Tổng giao dịch', value: data.payments.totalTransactions, unit: 'giao dịch' },
      { metric: 'Tổng lịch hẹn', value: data.appointments.totalAppointments, unit: 'lịch hẹn' },
      { metric: 'Tỷ lệ hoàn thành', value: data.appointments.completionRate, unit: '%' },
      { metric: 'Tỷ lệ hủy', value: data.appointments.cancellationRate, unit: '%' },
      { metric: 'Tỷ lệ hoàn tiền', value: data.payments.refundRate, unit: '%' },
      { metric: 'Tổng dịch vụ', value: data.services.totalServices, unit: 'dịch vụ' },
      { metric: 'Tổng gói dịch vụ', value: data.packages.totalPackages, unit: 'gói' },
      { metric: 'Gói đang giảm giá', value: data.packages.totalDiscountedPackages, unit: 'gói' }
    ];

    summaryData.forEach(item => {
      worksheet.addRow(item);
    });
  }

  /**
   * Placeholder methods for other sheet types
   */
  private addRevenueSheetData(worksheet: ExcelJS.Worksheet, revenueData: any) {
    // Implementation for revenue sheet
    worksheet.columns = [
      { header: 'Kỳ', key: 'period', width: 15 },
      { header: 'Doanh thu tháng', key: 'monthly', width: 20 },
      { header: 'Doanh thu tuần', key: 'weekly', width: 20 },
      { header: 'Doanh thu quý', key: 'quarterly', width: 20 }
    ];

    // Add data for each period type
    const maxLength = Math.max(
      revenueData.monthly?.length || 0,
      revenueData.weekly?.length || 0,
      revenueData.quarterly?.length || 0
    );

    for (let i = 0; i < maxLength; i++) {
      worksheet.addRow({
        period: i + 1,
        monthly: revenueData.monthly?.[i]?.totalRevenue || '',
        weekly: revenueData.weekly?.[i]?.totalRevenue || '',
        quarterly: revenueData.quarterly?.[i]?.totalRevenue || ''
      });
    }
  }

  private addAppointmentsSheetData(worksheet: ExcelJS.Worksheet, appointmentsData: any) {
    // Implementation for appointments sheet
    worksheet.columns = [
      { header: 'Trạng thái', key: 'status', width: 20 },
      { header: 'Số lượng', key: 'count', width: 15 },
      { header: 'Tỷ lệ', key: 'percentage', width: 15 }
    ];

    appointmentsData.statusAnalysis.forEach((status: any) => {
      worksheet.addRow({
        status: status._id,
        count: status.count,
        percentage: `${status.percentage}%`
      });
    });
  }

  private addDoctorsSheetData(worksheet: ExcelJS.Worksheet, doctorsData: any) {
    // Implementation for doctors sheet
    worksheet.columns = [
      { header: 'Tên bác sĩ', key: 'name', width: 25 },
      { header: 'Chuyên khoa', key: 'specialization', width: 20 },
      { header: 'Lịch hẹn', key: 'appointments', width: 15 },
      { header: 'Tư vấn', key: 'consultations', width: 15 },
      { header: 'Doanh thu', key: 'revenue', width: 20 },
      { header: 'Rating', key: 'rating', width: 10 }
    ];

    // Add appointment rankings
    doctorsData.appointmentRankings.forEach((doctor: any) => {
      worksheet.addRow({
        name: doctor.doctorName,
        specialization: doctor.specialization,
        appointments: doctor.appointmentCount,
        consultations: '',
        revenue: doctor.totalRevenue,
        rating: doctor.rating
      });
    });
  }

  private addServicesSheetData(worksheet: ExcelJS.Worksheet, servicesData: any) {
    // Implementation for services sheet
    worksheet.columns = [
      { header: 'Tên dịch vụ', key: 'name', width: 30 },
      { header: 'Loại', key: 'type', width: 15 },
      { header: 'Giá', key: 'price', width: 15 },
      { header: 'Số lượt đặt', key: 'bookings', width: 15 },
      { header: 'Hoàn thành', key: 'completed', width: 15 },
      { header: 'Tỷ lệ hoàn thành', key: 'completionRate', width: 15 }
    ];

    servicesData.mostPopular.forEach((service: any) => {
      worksheet.addRow({
        name: service.serviceName,
        type: service.serviceType,
        price: service.price,
        bookings: service.bookingCount,
        completed: service.completedCount,
        completionRate: `${service.completionRate.toFixed(1)}%`
      });
    });
  }

  private addPackagesSheetData(worksheet: ExcelJS.Worksheet, packagesData: any) {
    // Implementation for packages sheet
    worksheet.columns = [
      { header: 'Tên gói', key: 'name', width: 30 },
      { header: 'Giá hiện tại', key: 'price', width: 15 },
      { header: 'Giá gốc', key: 'originalPrice', width: 15 },
      { header: 'Giảm giá', key: 'discount', width: 15 },
      { header: 'Số lượt đặt', key: 'bookings', width: 15 },
      { header: 'Tỷ lệ hoàn thành', key: 'completionRate', width: 15 }
    ];

    packagesData.mostPopular.forEach((pkg: any) => {
      worksheet.addRow({
        name: pkg.packageName,
        price: pkg.price,
        originalPrice: pkg.priceBeforeDiscount,
        discount: pkg.priceBeforeDiscount > pkg.price ? `${Math.round(((pkg.priceBeforeDiscount - pkg.price) / pkg.priceBeforeDiscount) * 100)}%` : '0%',
        bookings: pkg.bookingCount,
        completionRate: `${pkg.completionRate.toFixed(1)}%`
      });
    });
  }

  /**
   * Placeholder for PDF export methods
   */
  private async exportAdminDashboardToPDF(data: any, sections: string[]): Promise<Buffer> {
    // For now, return Excel format as PDF export requires additional PDF library
    return this.exportAdminDashboardToExcel(data, sections);
  }

  private async exportRevenueToPDF(revenueData: any[], period: string): Promise<Buffer> {
    // For now, return Excel format as PDF export requires additional PDF library
    return this.exportRevenueToExcel(revenueData, period);
  }

  /**
   * Format period label cho display
   */
  private formatPeriodLabel(periodData: any, format: string): string {
    switch (format) {
      case 'week':
        return `${periodData.year}-W${periodData.week}`;
      case 'quarter':
        return `${periodData.year}-Q${periodData.quarter}`;
      case 'month':
        return `${periodData.year}-${String(periodData.month).padStart(2, '0')}`;
      default:
        return `${periodData.year}`;
    }
  }
}

export const reportService = new ReportService();