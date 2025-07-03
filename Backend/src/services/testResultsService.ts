import TestResults, { ITestResults } from '../models/TestResults';
import Appointments from '../models/Appointments';
import UserProfiles from '../models/UserProfiles';
import Doctor from '../models/Doctor';
import mongoose from 'mongoose';

// Service class để xử lý business logic cho TestResults
export class TestResultsService {

  // Lấy tất cả test results với pagination và filtering
  async getAllTestResults(page: number = 1, limit: number = 10, search?: string): Promise<{
    testResults: ITestResults[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const skip = (page - 1) * limit;
    
    // Tạo filter query nếu có search
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { diagnosis: { $regex: search, $options: 'i' } },
          { recommendations: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Thực hiện query với pagination và populate thông tin liên quan
    const [testResults, total] = await Promise.all([
      TestResults.find(filter)
        .populate({
          path: 'appointmentId',
          select: 'appointmentDate appointmentTime serviceId appointmentType'
        })
        .populate({
          path: 'profileId',
          select: 'fullName gender phone year'
        })
        .populate({
          path: 'doctorId',
          select: 'specialization',
          populate: {
            path: 'userId',
            select: 'fullName email'
          }
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      TestResults.countDocuments(filter)
    ]);

    return {
      testResults,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  // Lấy test results theo appointment ID
  async getTestResultsByAppointmentId(appointmentId: string): Promise<ITestResults[]> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new Error('Invalid appointment ID format');
    }

    const testResults = await TestResults.find({ appointmentId })
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate appointmentTime serviceId appointmentType'
      })
      .populate({
        path: 'profileId',
        select: 'fullName gender phone year'
      })
      .populate({
        path: 'doctorId',
        select: 'specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      })
      .sort({ createdAt: -1 });

    return testResults;
  }

  // Lấy test result theo ID
  async getTestResultById(id: string): Promise<ITestResults | null> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid test result ID format');
    }

    const testResult = await TestResults.findById(id)
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate appointmentTime serviceId appointmentType'
      })
      .populate({
        path: 'profileId',
        select: 'fullName gender phone year'
      })
      .populate({
        path: 'doctorId',
        select: 'specialization',
        populate: {
          path: 'userId',
          select: 'fullName email'
        }
      });
    
    if (!testResult) {
      throw new Error('Test result not found');
    }

    return testResult;
  }

  // Tạo test result mới (Doctor và Staff được tạo)
  async createTestResult(data: {
    appointmentId: string;
    profileId: string;
    doctorId: string;
    diagnosis?: string;
    recommendations?: string;
  }, createdByRole: string): Promise<ITestResults> {
    // Kiểm tra quyền hạn - chỉ doctor và staff
    if (!['doctor', 'staff', 'admin'].includes(createdByRole)) {
      throw new Error('Only doctors and staff can create test results');
    }

    // Validate input data
    if (!data.appointmentId || !mongoose.Types.ObjectId.isValid(data.appointmentId)) {
      throw new Error('Valid appointment ID is required');
    }
    if (!data.profileId || !mongoose.Types.ObjectId.isValid(data.profileId)) {
      throw new Error('Valid profile ID is required');
    }
    if (!data.doctorId || !mongoose.Types.ObjectId.isValid(data.doctorId)) {
      throw new Error('Valid doctor ID is required');
    }

    // Kiểm tra appointment có tồn tại không
    const Appointments = (await import('../models/Appointments')).default;
    const appointment = await Appointments.findById(data.appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    // Kiểm tra đã có test result cho appointment này chưa
    const existingResult = await TestResults.findOne({
      appointmentId: data.appointmentId
    });

    if (existingResult) {
      throw new Error('Test result already exists for this appointment');
    }

    // Trước khi tạo testResult mới:
    const TestResultItems = (await import('../models/TestResultItems')).default;
    const items = await TestResultItems.find({ appointmentId: data.appointmentId });
    const testResultItemsId = items.map(item => item._id);

    // Tạo test result mới
    const testResult = new TestResults({
      appointmentId: data.appointmentId,
      profileId: data.profileId,
      doctorId: data.doctorId,
      diagnosis: data.diagnosis?.trim(),
      recommendations: data.recommendations?.trim(),
      testResultItemsId
    });

    return await testResult.save();
  }

  // Cập nhật test result (Doctor và Staff được phép)
  async updateTestResult(id: string, data: {
    diagnosis?: string;
    recommendations?: string;
  }, updatedByRole: string): Promise<ITestResults> {
    // Kiểm tra quyền hạn - chỉ doctor và staff
    if (!['doctor', 'staff', 'admin'].includes(updatedByRole)) {
      throw new Error('Only doctors and staff can update test results');
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid test result ID format');
    }

    // Kiểm tra tồn tại
    const existingResult = await TestResults.findById(id);
    if (!existingResult) {
      throw new Error('Test result not found');
    }

    // Prepare update data
    const updateData: any = {};
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis?.trim();
    if (data.recommendations !== undefined) updateData.recommendations = data.recommendations?.trim();

    // Thực hiện update
    const updatedResult = await TestResults.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      {
        path: 'appointmentId',
        select: 'appointmentDate appointmentTime serviceId',
        populate: {
          path: 'serviceId',
          select: 'serviceName serviceType'
        }
      },
      {
        path: 'profileId',
        select: 'fullName gender'
      },
      {
        path: 'doctorId',
        select: 'specialization',
        populate: {
          path: 'userId',
          select: 'fullName'
        }
      }
    ]);

    if (!updatedResult) {
      throw new Error('Failed to update test result');
    }

    return updatedResult;
  }

  // Xóa test result (chỉ admin hoặc doctor có thể xóa)
  async deleteTestResult(id: string, deletedByRole: string): Promise<void> {
    // Kiểm tra quyền hạn - chỉ admin và doctor
    if (!['admin', 'doctor'].includes(deletedByRole)) {
      throw new Error('Only admin and doctors can delete test results');
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid test result ID format');
    }

    // Kiểm tra tồn tại
    const existingResult = await TestResults.findById(id);
    if (!existingResult) {
      throw new Error('Test result not found');
    }

    // Kiểm tra xem có test result items nào liên quan không
    const TestResultItems = (await import('../models/TestResultItems')).default;
    const relatedItems = await TestResultItems.find({ testResultId: id });
    
    if (relatedItems.length > 0) {
      throw new Error('Cannot delete test result with associated test result items');
    }

    // Thực hiện xóa
    await TestResults.findByIdAndDelete(id);
  }

  // Lấy test results theo profile ID (để customer xem kết quả của profile)
  async getTestResultsByProfileId(profileId: string, page: number = 1, limit: number = 10): Promise<{
    testResults: ITestResults[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      throw new Error('Invalid profile ID format');
    }

    const skip = (page - 1) * limit;
    const [testResults, total] = await Promise.all([
      TestResults.find({ profileId })
        .populate({
          path: 'appointmentId',
          select: 'appointmentDate appointmentTime serviceId appointmentType'
        })
        .populate({
          path: 'profileId',
          select: 'fullName gender phone year'
        })
        .populate({
          path: 'doctorId',
          select: 'specialization',
          populate: {
            path: 'userId',
            select: 'fullName email'
          }
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      TestResults.countDocuments({ profileId })
    ]);
    return {
      testResults,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  // Get test result statistics by month
  async getTestResultStatsByMonth(year: number, month: number): Promise<{
    totalResults: number;
    resultsWithDiagnosis: number;
    resultsWithRecommendations: number;
    completionRate: number;
  }> {

    // Validate input
    if (year < 2000 || year > 3000) {
      throw new Error('Invalid year');
    }
    if (month < 1 || month > 12) {
      throw new Error('Invalid month');
    }

    // Tạo date range cho tháng đó
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Aggregate để tính statistics
    const stats = await TestResults.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          resultsWithDiagnosis: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$diagnosis", null] }, { $ne: ["$diagnosis", ""] }] },
                1,
                0
              ]
            }
          },
          resultsWithRecommendations: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$recommendations", null] }, { $ne: ["$recommendations", ""] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalResults: 0,
        resultsWithDiagnosis: 0,
        resultsWithRecommendations: 0,
        completionRate: 0
      };
    }

    const result = stats[0];
    const completionRate = result.totalResults > 0 
      ? ((result.resultsWithDiagnosis + result.resultsWithRecommendations) / (result.totalResults * 2)) * 100
      : 0;

    return {
      totalResults: result.totalResults,
      resultsWithDiagnosis: result.resultsWithDiagnosis,
      resultsWithRecommendations: result.resultsWithRecommendations,
      completionRate: Math.round(completionRate * 100) / 100
    };
  }
}

export default TestResultsService; 