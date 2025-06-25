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
          { conclusion: { $regex: search, $options: 'i' } },
          { recommendations: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Thực hiện query với pagination và populate thông tin liên quan
    const [testResults, total] = await Promise.all([
      TestResults.find(filter)
        .populate({
          path: 'appointmentId',
          select: 'appointmentDate appointmentTime serviceId packageId status',
          populate: {
            path: 'serviceId',
            select: 'serviceName serviceType price'
          }
        })
        .populate({
          path: 'profileId',
          select: 'fullName gender phone year'
        })
        .populate({
          path: 'doctorId',
          select: 'bio specialization',
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
        select: 'appointmentDate appointmentTime serviceId status',
        populate: {
          path: 'serviceId',
          select: 'serviceName serviceType price'
        }
      })
      .populate({
        path: 'profileId',
        select: 'fullName gender phone year'
      })
      .populate({
        path: 'doctorId',
        select: 'bio specialization',
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
        select: 'appointmentDate appointmentTime serviceId packageId status description',
        populate: {
          path: 'serviceId',
          select: 'serviceName serviceType price description'
        }
      })
      .populate({
        path: 'profileId',
        select: 'fullName gender phone year'
      })
      .populate({
        path: 'doctorId',
        select: 'bio experience specialization',
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
    conclusion?: string;
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

    // Kiểm tra appointment, profile, doctor có tồn tại không
    const [appointment, profile, doctor] = await Promise.all([
      Appointments.findById(data.appointmentId),
      UserProfiles.findById(data.profileId),
      Doctor.findById(data.doctorId)
    ]);

    if (!appointment) {
      throw new Error('Appointment not found');
    }
    if (!profile) {
      throw new Error('User profile not found');
    }
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Kiểm tra appointment và profile có khớp không
    if (appointment.profileId.toString() !== data.profileId) {
      throw new Error('Profile does not match appointment');
    }

    // Kiểm tra đã có test result cho appointment này chưa
    const existingResult = await TestResults.findOne({
      appointmentId: data.appointmentId
    });

    if (existingResult) {
      throw new Error('Test result already exists for this appointment');
    }

    // Tạo test result mới
    const testResult = new TestResults({
      appointmentId: data.appointmentId,
      profileId: data.profileId,
      doctorId: data.doctorId,
      conclusion: data.conclusion?.trim(),
      recommendations: data.recommendations?.trim()
    });

    return await testResult.save();
  }

  // Cập nhật test result (Doctor và Staff được phép)
  async updateTestResult(id: string, data: {
    conclusion?: string;
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
    if (data.conclusion !== undefined) updateData.conclusion = data.conclusion?.trim();
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

  // Lấy test results theo profile ID (customer có thể xem kết quả của mình)
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

    // Thực hiện query
    const [testResults, total] = await Promise.all([
      TestResults.find({ profileId })
        .populate({
          path: 'appointmentId',
          select: 'appointmentDate appointmentTime serviceId',
          populate: {
            path: 'serviceId',
            select: 'serviceName serviceType'
          }
        })
        .populate({
          path: 'doctorId',
          select: 'specialization',
          populate: {
            path: 'userId',
            select: 'fullName'
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

  // Lấy test results theo doctor ID
  async getTestResultsByDoctorId(doctorId: string, page: number = 1, limit: number = 10): Promise<{
    testResults: ITestResults[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new Error('Invalid doctor ID format');
    }

    const skip = (page - 1) * limit;

    // Thực hiện query
    const [testResults, total] = await Promise.all([
      TestResults.find({ doctorId })
        .populate({
          path: 'appointmentId',
          select: 'appointmentDate appointmentTime serviceId',
          populate: {
            path: 'serviceId',
            select: 'serviceName serviceType'
          }
        })
        .populate({
          path: 'profileId',
          select: 'fullName gender phone'
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      TestResults.countDocuments({ doctorId })
    ]);

    return {
      testResults,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  // Thống kê test results theo tháng
  async getTestResultStatsByMonth(year: number, month: number): Promise<{
    totalResults: number;
    resultsWithConclusion: number;
    resultsWithRecommendations: number;
    completionRate: number;
  }> {
    // Tạo range cho tháng
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Aggregate để thống kê
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
          resultsWithConclusion: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$conclusion", null] }, { $ne: ["$conclusion", ""] }] },
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

    const result = stats[0] || {
      totalResults: 0,
      resultsWithConclusion: 0,
      resultsWithRecommendations: 0
    };

    // Tính completion rate
    const completionRate = result.totalResults > 0
      ? Math.round((result.resultsWithConclusion / result.totalResults) * 100)
      : 0;

    return {
      ...result,
      completionRate
    };
  }
} 