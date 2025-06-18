import AppointmentTests, { IAppointmentTests } from '../models/AppointmentTests';
import mongoose from 'mongoose';

// Service class để xử lý business logic cho AppointmentTests
export class AppointmentTestsService {

  // Lấy tất cả appointment tests với pagination và filtering
  async getAllAppointmentTests(page: number = 1, limit: number = 10, search?: string): Promise<{
    appointmentTests: IAppointmentTests[];
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
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Thực hiện query với pagination
    const [appointmentTests, total] = await Promise.all([
      AppointmentTests.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      AppointmentTests.countDocuments(filter)
    ]);

    return {
      appointmentTests,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  // Lấy appointment tests theo appointment ID
  async getAppointmentTestsByAppointmentId(appointmentId: string): Promise<IAppointmentTests[]> {
    // Không cần validate ObjectId nữa vì appointmentId là string
    const appointmentTests = await AppointmentTests.find({ appointmentId })
      .sort({ createdAt: -1 });

    return appointmentTests;
  }

  // Lấy appointment test theo ID
  async getAppointmentTestById(id: string): Promise<IAppointmentTests | null> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid appointment test ID format');
    }

    const appointmentTest = await AppointmentTests.findById(id);
    
    if (!appointmentTest) {
      throw new Error('Appointment test not found');
    }

    return appointmentTest;
  }

  // Tạo appointment test mới
  async createAppointmentTest(data: {
    appointmentId?: string;
    name: string;
    description?: string;
    price: number;
    preparationGuidelines?: string;
    resultWaitTime?: string;
  }): Promise<IAppointmentTests> {
    // Validate input data
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Test name is required');
    }

    if (data.price === undefined || data.price === null || data.price < 0) {
      throw new Error('Valid price is required');
    }

    // Nếu không có appointmentId hoặc là "none", không cần kiểm tra appointment existence
    const appointmentId = data.appointmentId || "none";
    
    if (appointmentId !== "none") {
      // Chỉ kiểm tra appointment existence nếu appointmentId không phải "none"
      // Và nếu appointmentId là ObjectId hợp lệ
      if (mongoose.Types.ObjectId.isValid(appointmentId)) {
        const Appointments = (await import('../models/Appointments')).default;
        const appointment = await Appointments.findById(appointmentId);
        
        if (!appointment) {
          throw new Error('Appointment not found');
        }
      }
    }

    // Kiểm tra không tạo duplicate test cho cùng appointment
    const existingTest = await AppointmentTests.findOne({
      appointmentId: appointmentId,
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') }
    });

    if (existingTest) {
      throw new Error('Test with this name already exists for this appointment');
    }

    // Tạo appointment test mới
    const appointmentTest = new AppointmentTests({
      appointmentId: appointmentId,
      name: data.name.trim(),
      description: data.description?.trim(),
      price: data.price,
      preparationGuidelines: data.preparationGuidelines?.trim(),
      resultWaitTime: data.resultWaitTime?.trim()
    });

    return await appointmentTest.save();
  }

  // Cập nhật appointment test
  async updateAppointmentTest(id: string, data: {
    name?: string;
    description?: string;
    price?: number;
    preparationGuidelines?: string;
    resultWaitTime?: string;
  }): Promise<IAppointmentTests> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid appointment test ID format');
    }

    // Kiểm tra tồn tại
    const existingTest = await AppointmentTests.findById(id);
    if (!existingTest) {
      throw new Error('Appointment test not found');
    }

    // Validate price nếu được update
    if (data.price !== undefined && data.price < 0) {
      throw new Error('Price must be non-negative');
    }

    // Kiểm tra duplicate name trong cùng appointment
    if (data.name && data.name.trim() !== existingTest.name) {
      const duplicateTest = await AppointmentTests.findOne({
        _id: { $ne: id },
        appointmentId: existingTest.appointmentId,
        name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') }
      });

      if (duplicateTest) {
        throw new Error('Test with this name already exists for this appointment');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim();
    if (data.price !== undefined) updateData.price = data.price;
    if (data.preparationGuidelines !== undefined) updateData.preparationGuidelines = data.preparationGuidelines?.trim();
    if (data.resultWaitTime !== undefined) updateData.resultWaitTime = data.resultWaitTime?.trim();

    // Thực hiện update
    const updatedTest = await AppointmentTests.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTest) {
      throw new Error('Failed to update appointment test');
    }

    return updatedTest;
  }

  // Xóa appointment test
  async deleteAppointmentTest(id: string): Promise<void> {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid appointment test ID format');
    }

    // Kiểm tra có test results liên quan không
    const TestResults = (await import('../models/TestResults')).default;
    const resultsCount = await TestResults.countDocuments({ appointmentTestId: id });
    
    if (resultsCount > 0) {
      throw new Error('Cannot delete appointment test as it has associated test results');
    }

    // Thực hiện xóa
    const deletedTest = await AppointmentTests.findByIdAndDelete(id);
    if (!deletedTest) {
      throw new Error('Appointment test not found or already deleted');
    }
  }

  // Tính tổng giá của tất cả tests trong một appointment
  async calculateTotalPriceByAppointment(appointmentId: string): Promise<number> {
    // Không cần validate ObjectId nữa vì appointmentId là string
    const result = await AppointmentTests.aggregate([
      { $match: { appointmentId: appointmentId } },
      { $group: { _id: null, totalPrice: { $sum: '$price' } } }
    ]);

    return result.length > 0 ? result[0].totalPrice : 0;
  }

  // Lấy thống kê appointment tests theo tháng
  async getTestStatsByMonth(year: number, month: number): Promise<{
    totalTests: number;
    totalRevenue: number;
    testsByName: Array<{ name: string; count: number; revenue: number }>;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const stats = await AppointmentTests.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$name',
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalStats = await AppointmentTests.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    return {
      totalTests: totalStats.length > 0 ? totalStats[0].totalTests : 0,
      totalRevenue: totalStats.length > 0 ? totalStats[0].totalRevenue : 0,
      testsByName: stats.map(item => ({
        name: item._id,
        count: item.count,
        revenue: item.revenue
      }))
    };
  }
} 