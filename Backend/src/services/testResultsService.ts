import TestResults, { ITestResults } from '../models/TestResults';
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
          path: 'appointmentTestId',
          select: 'name description price appointmentId',
          populate: {
            path: 'appointmentId',
            select: 'appointmentDate appointmentTime customerId',
            populate: {
              path: 'customerId', 
              select: 'fullName email phoneNumber'
            }
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

  // Lấy test results theo appointment test ID
  async getTestResultsByAppointmentTestId(appointmentTestId: string): Promise<ITestResults[]> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(appointmentTestId)) {
      throw new Error('Invalid appointment test ID format');
    }

    const testResults = await TestResults.find({ appointmentTestId })
      .populate({
        path: 'appointmentTestId',
        select: 'name description price appointmentId',
        populate: {
          path: 'appointmentId',
          select: 'appointmentDate appointmentTime customerId',
          populate: {
            path: 'customerId',
            select: 'fullName email phoneNumber'
          }
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
        path: 'appointmentTestId',
        select: 'name description price appointmentId',
        populate: {
          path: 'appointmentId',
          select: 'appointmentDate appointmentTime customerId',
          populate: {
            path: 'customerId',
            select: 'fullName email phoneNumber dateOfBirth gender'
          }
        }
      });
    
    if (!testResult) {
      throw new Error('Test result not found');
    }

    return testResult;
  }

  // Tạo test result mới (chỉ Doctor mới được tạo)
  async createTestResult(data: {
    appointmentTestId: string;
    conclusion?: string;
    recommendations?: string;
  }, createdByRole: string): Promise<ITestResults> {
    // Kiểm tra quyền hạn - chỉ doctor và nursing staff
    if (!['doctor', 'nursing_staff'].includes(createdByRole)) {
      throw new Error('Only doctors and nursing staff can create test results');
    }

    // Validate input data
    if (!data.appointmentTestId || !mongoose.Types.ObjectId.isValid(data.appointmentTestId)) {
      throw new Error('Valid appointment test ID is required');
    }

    // Kiểm tra appointment test có tồn tại không
    const AppointmentTests = (await import('../models/AppointmentTests')).default;
    const appointmentTest = await AppointmentTests.findById(data.appointmentTestId);
    
    if (!appointmentTest) {
      throw new Error('Appointment test not found');
    }

    // Kiểm tra đã có test result cho appointment test này chưa
    const existingResult = await TestResults.findOne({
      appointmentTestId: data.appointmentTestId
    });

    if (existingResult) {
      throw new Error('Test result already exists for this appointment test');
    }

    // Tạo test result mới
    const testResult = new TestResults({
      appointmentTestId: data.appointmentTestId,
      conclusion: data.conclusion?.trim(),
      recommendations: data.recommendations?.trim()
    });

    return await testResult.save();
  }

  // Cập nhật test result (chỉ Doctor được phép)
  async updateTestResult(id: string, data: {
    conclusion?: string;
    recommendations?: string;
  }, updatedByRole: string): Promise<ITestResults> {
    // Kiểm tra quyền hạn - chỉ doctor và nursing staff
    if (!['doctor', 'nursing_staff'].includes(updatedByRole)) {
      throw new Error('Only doctors and nursing staff can update test results');
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
    );

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

    // Kiểm tra có test result items liên quan không
    const TestResultItems = (await import('../models/TestResultItems')).default;
    const itemsCount = await TestResultItems.countDocuments({ testResultId: id });
    
    if (itemsCount > 0) {
      throw new Error('Cannot delete test result as it has associated test result items');
    }

    // Thực hiện xóa
    const deletedResult = await TestResults.findByIdAndDelete(id);
    if (!deletedResult) {
      throw new Error('Test result not found or already deleted');
    }
  }

  // Lấy test results theo customer ID (để customer xem kết quả của mình)
  async getTestResultsByCustomerId(customerId: string, page: number = 1, limit: number = 10): Promise<{
    testResults: ITestResults[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      throw new Error('Invalid customer ID format');
    }

    const skip = (page - 1) * limit;

    // Aggregate để filter theo customerId thông qua appointmentTest -> appointment
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'appointmenttests',
          localField: 'appointmentTestId',
          foreignField: '_id',
          as: 'appointmentTest'
        }
      },
      { $unwind: '$appointmentTest' },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointmentTest.appointmentId',
          foreignField: '_id',
          as: 'appointment'
        }
      },
      { $unwind: '$appointment' },
      {
        $match: {
          'appointment.customerId': new mongoose.Types.ObjectId(customerId)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'appointment.customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          _id: 1,
          appointmentTestId: 1,
          conclusion: 1,
          recommendations: 1,
          createdAt: 1,
          appointmentTest: {
            _id: '$appointmentTest._id',
            name: '$appointmentTest.name',
            description: '$appointmentTest.description',
            price: '$appointmentTest.price'
          },
          appointment: {
            _id: '$appointment._id',
            appointmentDate: '$appointment.appointmentDate',
            appointmentTime: '$appointment.appointmentTime'
          },
          customer: {
            _id: '$customer._id',
            fullName: '$customer.fullName',
            email: '$customer.email'
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    // Get paginated results
    const [testResults, totalCount] = await Promise.all([
      TestResults.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
      TestResults.aggregate([...pipeline, { $count: 'total' }])
    ]);

    const total = totalCount.length > 0 ? totalCount[0].total : 0;

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
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const stats = await TestResults.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          resultsWithConclusion: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$conclusion', null] }, { $ne: ['$conclusion', ''] }] },
                1,
                0
              ]
            }
          },
          resultsWithRecommendations: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$recommendations', null] }, { $ne: ['$recommendations', ''] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalResults: 0,
      resultsWithConclusion: 0,
      resultsWithRecommendations: 0
    };

    const completionRate = result.totalResults > 0 
      ? Math.round((result.resultsWithConclusion / result.totalResults) * 100 * 100) / 100
      : 0;

    return {
      ...result,
      completionRate
    };
  }
} 