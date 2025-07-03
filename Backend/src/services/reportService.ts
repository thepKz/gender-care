import ExcelJS from 'exceljs';
import Appointments from '../models/Appointments';
import User from '../models/User';
import PaymentTracking from '../models/PaymentTracking';
import Service from '../models/Service';
import Doctor from '../models/Doctor';
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
    worksheet.columns.forEach(column => {
        let maxColumnLength = 0;
        if(column.eachCell) {
            column.eachCell({ includeEmpty: true }, (cell) => {
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
}

export const reportService = new ReportService(); 