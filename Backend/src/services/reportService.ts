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
}

export const reportService = new ReportService(); 