import { Request, Response } from 'express';
import {
    MenstrualCycles,
    CycleDays,
    MenstrualCycleReminders,
    MenstrualCycleReports
} from '../models';
import menstrualCycleService from '../services/menstrualCycleService';
import { menstrualCycleReminderService } from '../services/menstrualCycleReminderService';
import { ValidationError } from '../errors/validationError';
import { NotFoundError } from '../errors/notFoundError';

// Interface cho AuthRequest
interface AuthRequest extends Request {
    user?: {
        _id: string;
        email: string;
        role: string;
    };
}

/**
 * Tạo chu kỳ mới
 * POST /api/menstrual-cycles
 */
export const createCycle = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate } = req.body;
        const userId = req.user!._id;

        if (!startDate) {
            throw new ValidationError({ startDate: 'Ngày bắt đầu chu kỳ là bắt buộc' });
        }

        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            throw new ValidationError({ startDate: 'Định dạng ngày không hợp lệ' });
        }

        const newCycle = await menstrualCycleService.createCycle(userId, start);

        return res.status(201).json({
            success: true,
            message: 'Tạo chu kỳ mới thành công',
            data: newCycle
        });
    } catch (error: any) {
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        console.error('Create cycle error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Lấy danh sách chu kỳ của user
 * GET /api/menstrual-cycles
 */
export const getCycles = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;
        const { page = 1, limit = 10, status } = req.query;

        const query: any = { createdByUserId: userId };
        if (status) {
            query.status = status;
        }

        const cycles = await MenstrualCycles
            .find(query)
            .sort({ cycleNumber: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .populate('cycleDays');

        const total = await MenstrualCycles.countDocuments(query);

        return res.json({
            success: true,
            data: {
                cycles,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(total / Number(limit)),
                    totalRecords: total
                }
            }
        });
    } catch (error: any) {
        console.error('Get cycles error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Lấy chi tiết chu kỳ
 * GET /api/menstrual-cycles/:id
 */
export const getCycleDetail = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        const cycle = await MenstrualCycles
            .findOne({ _id: id, createdByUserId: userId })
            .populate('cycleDays');

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ');
        }

        return res.json({
            success: true,
            data: cycle
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Get cycle detail error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Thêm/cập nhật dữ liệu ngày trong chu kỳ
 * POST /api/cycle-days
 */
export const createOrUpdateCycleDay = async (req: AuthRequest, res: Response) => {
    try {
        const { cycleId, date, mucusObservation, feeling, notes } = req.body;
        const userId = req.user!._id;

        // Validate required fields
        const errors: any = {};
        if (!cycleId) errors.cycleId = 'ID chu kỳ là bắt buộc';
        if (!date) errors.date = 'Ngày là bắt buộc';

        if (Object.keys(errors).length > 0) {
            throw new ValidationError(errors);
        }

        // Kiểm tra cycle thuộc về user
        const cycle = await MenstrualCycles.findOne({
            _id: cycleId,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        const result = await menstrualCycleService.createOrUpdateCycleDay({
            cycleId,
            date: new Date(date),
            mucusObservation,
            feeling,
            notes
        });

        // Kiểm tra xem có tạo chu kỳ mới không
        if (result.newCycleCreated) {
            return res.status(201).json({
                success: true,
                message: '🎉 Chu kỳ cũ đã hoàn thành và tự động tạo chu kỳ mới!',
                data: {
                    cycleDay: result.cycleDay,
                    newCycleCreated: true,
                    completedCycle: result.completedCycle,
                    newCycle: result.newCycle,
                    oldCycleId: result.oldCycleId,
                    newCycleId: result.newCycleId
                }
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Cập nhật dữ liệu ngày thành công',
            data: result
        });
    } catch (error: any) {
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Create/Update cycle day error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Lấy dữ liệu calendar theo tháng
 * GET /api/menstrual-cycles/calendar
 */
export const getCalendarData = async (req: AuthRequest, res: Response) => {
    try {
        const { month, year } = req.query;
        const userId = req.user!._id;

        if (!month || !year) {
            throw new ValidationError({
                month: 'Tháng là bắt buộc',
                year: 'Năm là bắt buộc'
            });
        }

        const calendarData = await menstrualCycleService.getCalendarData(
            userId,
            Number(month),
            Number(year)
        );

        return res.json({
            success: true,
            data: {
                month: Number(month),
                year: Number(year),
                days: calendarData
            }
        });
    } catch (error: any) {
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        console.error('Get calendar data error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Tạo báo cáo cho chu kỳ
 * POST /api/reports/generate/:cycleId
 */
export const generateCycleReport = async (req: AuthRequest, res: Response) => {
    try {
        const { cycleId } = req.params;
        const userId = req.user!._id;

        // Kiểm tra cycle thuộc về user
        const cycle = await MenstrualCycles.findOne({
            _id: cycleId,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        const report = await menstrualCycleService.generateCycleReport(cycleId);

        return res.json({
            success: true,
            message: 'Tạo báo cáo chu kỳ thành công',
            data: report
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Generate cycle report error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * So sánh 3 chu kỳ gần nhất
 * GET /api/reports/comparison
 */
export const compareThreeCycles = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;

        const comparison = await menstrualCycleService.compareThreeCycles(userId);

        return res.json({
            success: true,
            data: comparison
        });
    } catch (error: any) {
        console.error('Compare cycles error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Cài đặt nhắc nhở
 * PUT /api/reminders
 */
export const updateReminderSettings = async (req: AuthRequest, res: Response) => {
    try {
        const { reminderEnabled, reminderTime } = req.body;
        const userId = req.user!._id;

        // Validate reminderTime format
        if (reminderTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
            throw new ValidationError({
                reminderTime: 'Định dạng thời gian phải là HH:mm (ví dụ: 20:00)'
            });
        }

        let settings = await MenstrualCycleReminders.findOne({ userId });

        if (!settings) {
            settings = await MenstrualCycleReminders.create({
                userId,
                reminderEnabled: reminderEnabled ?? true,
                reminderTime: reminderTime || '20:00'
            });
        } else {
            if (reminderEnabled !== undefined) settings.reminderEnabled = reminderEnabled;
            if (reminderTime) settings.reminderTime = reminderTime;
            await settings.save();
        }

        return res.json({
            success: true,
            message: 'Cập nhật cài đặt nhắc nhở thành công',
            data: settings
        });
    } catch (error: any) {
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        console.error('Update reminder settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Lấy cài đặt nhắc nhở
 * GET /api/reminders
 */
export const getReminderSettings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;

        let settings = await MenstrualCycleReminders.findOne({ userId });

        if (!settings) {
            // Tạo setting mặc định
            settings = await MenstrualCycleReminders.create({
                userId,
                reminderEnabled: true,
                reminderTime: '20:00'
            });
        }

        return res.json({
            success: true,
            data: settings
        });
    } catch (error: any) {
        console.error('Get reminder settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Xóa cycle day
 * DELETE /api/cycle-days/:id
 */
export const deleteCycleDay = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        // Tìm cycle day và verify ownership
        const cycleDay = await CycleDays.findById(id).populate('cycleId');

        if (!cycleDay) {
            throw new NotFoundError('Không tìm thấy dữ liệu ngày');
        }

        // Check ownership through cycle
        const cycle = cycleDay.cycleId as any;
        if (cycle.createdByUserId.toString() !== userId) {
            throw new NotFoundError('Bạn không có quyền xóa dữ liệu này');
        }

        // Bảo vệ ngày bắt đầu chu kỳ khỏi bị xóa
        const isSameDate = cycleDay.date.toDateString() === cycle.startDate.toDateString();
        if (isSameDate) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa ngày bắt đầu chu kỳ',
                detail: 'Ngày bắt đầu chu kỳ không thể xóa để đảm bảo tính toàn vẹn dữ liệu. Sử dụng chức năng "Đổi ngày bắt đầu" nếu cần thay đổi.'
            });
        }

        // Kiểm tra xem có phải ngày đầu tiên có dữ liệu không
        const allCycleDays = await CycleDays.find({ cycleId: cycle._id }).sort({ date: 1 });
        const isFirstDataDay = allCycleDays.length > 0 && allCycleDays[0]._id.toString() === id;

        if (isFirstDataDay && allCycleDays.length > 1) {
            // Cảnh báo nhưng vẫn cho phép xóa
            await CycleDays.findByIdAndDelete(id);

            return res.json({
                success: true,
                message: 'Đã xóa ngày đầu tiên có dữ liệu',
                warning: 'Đây là ngày đầu tiên có dữ liệu trong chu kỳ. Hãy kiểm tra lại tính chính xác của chu kỳ.'
            });
        }

        await CycleDays.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: 'Xóa dữ liệu ngày thành công'
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Delete cycle day error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Lấy báo cáo của một chu kỳ
 * GET /api/reports/:cycleId
 */
export const getCycleReport = async (req: AuthRequest, res: Response) => {
    try {
        const { cycleId } = req.params;
        const userId = req.user!._id;

        // Kiểm tra cycle thuộc về user
        const cycle = await MenstrualCycles.findOne({
            _id: cycleId,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        const report = await MenstrualCycleReports.findOne({ cycleId });

        if (!report) {
            throw new NotFoundError('Chưa có báo cáo cho chu kỳ này');
        }

        return res.json({
            success: true,
            data: report
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Get cycle report error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Trigger gửi nhắc nhở thủ công (cho cronjob hoặc admin)
 * POST /api/reminders/notify
 */
export const triggerReminders = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await menstrualCycleReminderService.notifyAllUsers();

        return res.json({
            success: true,
            message: 'Đã gửi nhắc nhở thành công',
            data: stats
        });
    } catch (error: any) {
        console.error('Trigger reminders error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Lấy thống kê reminder (Admin only)
 * GET /api/reminders/stats
 */
export const getReminderStats = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await menstrualCycleReminderService.getReminderStats();

        return res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('Get reminder stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Cập nhật chu kỳ
 * PUT /api/menstrual-cycles/:id
 */
export const updateCycle = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, isCompleted, status } = req.body;
        const userId = req.user!._id;

        const cycle = await MenstrualCycles.findOne({
            _id: id,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        // Lưu ngày bắt đầu cũ để so sánh
        const oldStartDate = cycle.startDate;
        let needRecalculateCycleDays = false;

        // Cập nhật các trường
        if (startDate) {
            const newStartDate = new Date(startDate);
            if (isNaN(newStartDate.getTime())) {
                throw new ValidationError({ startDate: 'Định dạng ngày không hợp lệ' });
            }

            // Kiểm tra nếu ngày bắt đầu thay đổi
            if (oldStartDate.getTime() !== newStartDate.getTime()) {
                cycle.startDate = newStartDate;
                needRecalculateCycleDays = true;
            }
        }

        if (endDate) cycle.endDate = new Date(endDate);
        if (isCompleted !== undefined) cycle.isCompleted = isCompleted;
        if (status) cycle.status = status;

        await cycle.save();

        // Nếu ngày bắt đầu thay đổi, cần tính toán lại cycleDayNumber cho tất cả cycle days
        if (needRecalculateCycleDays) {
            await recalculateCycleDayNumbers(id, cycle.startDate);
        }

        return res.json({
            success: true,
            message: 'Cập nhật chu kỳ thành công',
            data: cycle
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        console.error('Update cycle error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Tính toán lại cycleDayNumber cho tất cả ngày trong chu kỳ
 * @param cycleId ID của chu kỳ
 * @param newStartDate Ngày bắt đầu mới
 */
const recalculateCycleDayNumbers = async (cycleId: string, newStartDate: Date) => {
    try {
        // Lấy tất cả cycle days của chu kỳ này
        const cycleDays = await CycleDays.find({ cycleId });

        // Cập nhật từng ngày
        const bulkOps = cycleDays.map(day => {
            const diffTime = day.date.getTime() - newStartDate.getTime();
            const newCycleDayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

            return {
                updateOne: {
                    filter: { _id: day._id },
                    update: {
                        cycleDayNumber: newCycleDayNumber >= 1 ? newCycleDayNumber : 1
                    }
                }
            };
        });

        if (bulkOps.length > 0) {
            await CycleDays.bulkWrite(bulkOps);
        }

        console.log(`✅ Recalculated cycleDayNumber for ${bulkOps.length} days in cycle ${cycleId}`);
    } catch (error) {
        console.error('Error recalculating cycle day numbers:', error);
        throw error;
    }
};

/**
 * Xóa chu kỳ
 * DELETE /api/menstrual-cycles/:id
 */
export const deleteCycle = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        const cycle = await MenstrualCycles.findOne({
            _id: id,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        // Xóa tất cả cycle days trước
        await CycleDays.deleteMany({ cycleId: id });

        // Xóa reports
        await MenstrualCycleReports.deleteMany({ cycleId: id });

        // Xóa cycle
        await MenstrualCycles.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: 'Xóa chu kỳ thành công'
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Delete cycle error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Lấy danh sách ngày theo chu kỳ
 * GET /api/menstrual-cycles/:id/cycle-days
 */
export const getCycleDays = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        // Kiểm tra cycle thuộc về user
        const cycle = await MenstrualCycles.findOne({
            _id: id,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        const cycleDays = await CycleDays.find({ cycleId: id })
            .sort({ date: 1 });

        return res.json({
            success: true,
            data: cycleDays
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Get cycle days error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Lấy chi tiết một ngày
 * GET /api/cycle-days/:id
 */
export const getCycleDayDetail = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        const cycleDay = await CycleDays.findById(id).populate('cycleId');

        if (!cycleDay) {
            throw new NotFoundError('Không tìm thấy dữ liệu ngày');
        }

        // Check ownership through cycle
        const cycle = cycleDay.cycleId as any;
        if (cycle.createdByUserId.toString() !== userId) {
            throw new NotFoundError('Bạn không có quyền xem dữ liệu này');
        }

        return res.json({
            success: true,
            data: cycleDay
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Get cycle day detail error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Cập nhật cycle day
 * PUT /api/cycle-days/:id
 */
export const updateCycleDay = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { mucusObservation, feeling, notes } = req.body;
        const userId = req.user!._id;

        const cycleDay = await CycleDays.findById(id).populate('cycleId');

        if (!cycleDay) {
            throw new NotFoundError('Không tìm thấy dữ liệu ngày');
        }

        // Check ownership through cycle
        const cycle = cycleDay.cycleId as any;
        if (cycle.createdByUserId.toString() !== userId) {
            throw new NotFoundError('Bạn không có quyền chỉnh sửa dữ liệu này');
        }

        // Update fields
        if (mucusObservation) cycleDay.mucusObservation = mucusObservation;
        if (feeling) cycleDay.feeling = feeling;
        if (notes !== undefined) cycleDay.notes = notes;

        await cycleDay.save();

        return res.json({
            success: true,
            message: 'Cập nhật dữ liệu ngày thành công',
            data: cycleDay
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Update cycle day error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Tự động đánh dấu các ngày sau ngày X
 * POST /api/logic/generate-post-peak
 */
export const generatePostPeakDays = async (req: AuthRequest, res: Response) => {
    try {
        const { cycleId, peakDate } = req.body;
        const userId = req.user!._id;

        if (!cycleId || !peakDate) {
            throw new ValidationError({
                cycleId: 'ID chu kỳ là bắt buộc',
                peakDate: 'Ngày đỉnh là bắt buộc'
            });
        }

        // Verify cycle ownership
        const cycle = await MenstrualCycles.findOne({
            _id: cycleId,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        const peakDayDate = new Date(peakDate);
        const postPeakDays = [];

        // Tạo 3 ngày sau ngày X
        for (let i = 1; i <= 3; i++) {
            const nextDate = new Date(peakDayDate);
            nextDate.setDate(nextDate.getDate() + i);

            const existingDay = await CycleDays.findOne({
                cycleId,
                date: nextDate
            });

            if (!existingDay) {
                const fertilityProbs = [75, 50, 20];
                const cycleDay = await CycleDays.create({
                    cycleId,
                    date: nextDate,
                    isPeakDay: false,
                    peakDayRelative: i,
                    fertilityProbability: fertilityProbs[i - 1],
                    babyGenderHint: i <= 2 ? 'nam' : undefined,
                    isAutoGenerated: true,
                    month: nextDate.getMonth() + 1,
                    year: nextDate.getFullYear(),
                    notes: `Ngày ${i} sau đỉnh - tự động tạo bởi hệ thống`
                });

                postPeakDays.push(cycleDay);
            }
        }

        return res.json({
            success: true,
            message: 'Tạo các ngày sau đỉnh thành công',
            data: postPeakDays
        });
    } catch (error: any) {
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Generate post peak days error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Kiểm tra validation ngày nhập
 * POST /api/logic/validate-day
 */
export const validateDayInput = async (req: AuthRequest, res: Response) => {
    try {
        const { mucusObservation, feeling } = req.body;

        if (!mucusObservation || !feeling) {
            throw new ValidationError({
                mucusObservation: 'Quan sát chất nhờn là bắt buộc',
                feeling: 'Cảm giác là bắt buộc'
            });
        }

        // Import validation rules
        const MUCUS_FEELING_RULES: Record<string, string[]> = {
            'có máu': ['ướt'],
            'lấm tấm máu': ['ướt', 'khô'],
            'đục': ['dính', 'ẩm', 'khô'],
            'đục nhiều sợi': ['ướt', 'trơn'],
            'trong nhiều sợi': ['ướt', 'trơn'],
            'trong và âm hộ căng': ['trơn'],
            'ít chất tiết': ['ẩm', 'ướt']
        };

        const allowedFeelings = MUCUS_FEELING_RULES[mucusObservation];
        let isValid = true;
        let warning = '';

        if (allowedFeelings && !allowedFeelings.includes(feeling)) {
            isValid = false;
            warning = `Cảm giác "${feeling}" không phù hợp với quan sát chất nhờn "${mucusObservation}". Các cảm giác hợp lệ: ${allowedFeelings.join(', ')}`;
        }

        return res.json({
            success: true,
            data: {
                isValid,
                warning,
                allowedFeelings: allowedFeelings || [],
                isPeakDay: mucusObservation === 'trong và âm hộ căng' && feeling === 'trơn'
            }
        });
    } catch (error: any) {
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                errors: error.errors
            });
        }
        console.error('Validate day input error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Dự đoán giới tính thai
 * GET /api/logic/gender-prediction/:cycleId
 */
export const getGenderPrediction = async (req: AuthRequest, res: Response) => {
    try {
        const { cycleId } = req.params;
        const userId = req.user!._id;

        // Verify cycle ownership
        const cycle = await MenstrualCycles.findOne({
            _id: cycleId,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        // Tìm ngày X
        const peakDay = await CycleDays.findOne({
            cycleId,
            isPeakDay: true
        });

        if (!peakDay) {
            return res.json({
                success: true,
                message: 'Chưa xác định được ngày đỉnh (X) để dự đoán',
                data: null
            });
        }

        // Lấy các ngày xung quanh ngày X
        const surroundingDays = await CycleDays.find({
            cycleId,
            date: {
                $gte: new Date(peakDay.date.getTime() - 2 * 24 * 60 * 60 * 1000),
                $lte: new Date(peakDay.date.getTime() + 2 * 24 * 60 * 60 * 1000)
            }
        }).sort({ date: 1 });

        const predictions: any[] = [];

        surroundingDays.forEach(day => {
            const daysDiff = Math.floor((day.date.getTime() - peakDay.date.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff === -2 || daysDiff === -1) {
                // 2 ngày trước X: khả năng bé gái cao
                predictions.push({
                    date: day.date,
                    genderPrediction: 'nữ',
                    probability: daysDiff === -1 ? 70 : 60,
                    description: `${Math.abs(daysDiff)} ngày trước đỉnh - khả năng bé gái cao`
                });
            } else if (daysDiff === 1 || daysDiff === 2) {
                // 2 ngày sau X: khả năng bé trai cao  
                predictions.push({
                    date: day.date,
                    genderPrediction: 'nam',
                    probability: daysDiff === 1 ? 70 : 60,
                    description: `${daysDiff} ngày sau đỉnh - khả năng bé trai cao`
                });
            } else if (daysDiff === 0) {
                predictions.push({
                    date: day.date,
                    genderPrediction: 'cân bằng',
                    probability: 50,
                    description: 'Ngày đỉnh - khả năng cân bằng'
                });
            }
        });

        return res.json({
            success: true,
            data: {
                peakDay: peakDay.date,
                predictions,
                note: 'Dự đoán giới tính chỉ mang tính tham khảo theo phương pháp Billings'
            }
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Get gender prediction error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Lấy báo cáo phân tích chu kỳ hoàn chỉnh
 * GET /api/menstrual-cycles/:id/analysis
 */
export const getCycleAnalysis = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        // Kiểm tra cycle thuộc về user
        const cycle = await MenstrualCycles.findOne({
            _id: id,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        // Phân tích chu kỳ
        const analysis = await menstrualCycleService.analyzeCycleCompletion(id);

        return res.json({
            success: true,
            message: 'Lấy báo cáo phân tích chu kỳ thành công',
            data: {
                cycleId: id,
                cycleNumber: cycle.cycleNumber,
                startDate: cycle.startDate,
                endDate: cycle.endDate,
                isCompleted: cycle.isCompleted,
                analysis: analysis
            }
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Get cycle analysis error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Tự động đánh dấy chu kỳ hoàn thành khi đủ điều kiện theo phương pháp Billings
 * POST /api/menstrual-cycles/:id/auto-complete
 */
export const autoCompleteCycle = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        // Kiểm tra cycle thuộc về user
        const cycle = await MenstrualCycles.findOne({
            _id: id,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        // Phân tích chu kỳ theo logic mới
        const analysis = await menstrualCycleService.analyzeCycleCompletion(id);

        if (analysis.isComplete) {
            // Đánh dấu chu kỳ hoàn thành
            cycle.isCompleted = true;
            cycle.status = 'completed';

            // Lưu thông tin chu kỳ dựa trên phân tích
            if (analysis.peakDay) {
                cycle.peakDay = analysis.peakDay.date;
            }

            // Lưu ngày kết thúc chu kỳ
            if (analysis.phase === 'completed_case_1' && analysis.nextCycleStart) {
                // Trường hợp 1: Ngày kết thúc là ngày trước khi có máu mới
                const endDate = new Date(analysis.nextCycleStart);
                endDate.setDate(endDate.getDate() - 1);
                cycle.endDate = endDate;
            } else if (analysis.phase === 'cross_month_drying' && analysis.firstDryDay) {
                // Trường hợp 2: Ngày kết thúc là khi chuyển sang khô
                cycle.endDate = analysis.firstDryDay;
            }

            await cycle.save();

            // Tự động tạo chu kỳ mới nếu đã có máu mới
            if (analysis.phase === 'completed_case_1' && analysis.nextCycleStart) {
                const newCycle = await menstrualCycleService.createCycle(userId, analysis.nextCycleStart);

                return res.json({
                    success: true,
                    message: 'Chu kỳ đã hoàn thành và tự động tạo chu kỳ mới',
                    data: {
                        completedCycle: cycle,
                        newCycle: newCycle,
                        analysis: analysis,
                        cycleType: analysis.cycleType,
                        cycleLength: analysis.cycleLength
                    }
                });
            }

            return res.json({
                success: true,
                message: `Chu kỳ đã được đánh dấu hoàn thành (${analysis.cycleType === 'same_month_completion' ? 'Trường hợp 1' : 'Trường hợp 2'})`,
                data: {
                    cycle: cycle,
                    analysis: analysis,
                    cycleType: analysis.cycleType
                }
            });
        } else {
            // Chu kỳ chưa hoàn thành - cung cấp hướng dẫn chi tiết
            let guidance = '';

            switch (analysis.phase) {
                case 'waiting_for_menstruation':
                    guidance = 'Hãy ghi nhận ngày đầu có máu kinh nguyệt để bắt đầu chu kỳ.';
                    break;
                case 'pre_peak_tracking':
                    guidance = 'Tiếp tục theo dõi hàng ngày cho đến khi xuất hiện "cảm giác chất nhờn là trong và âm hộ căng".';
                    break;
                case 'post_peak_tracking':
                    guidance = `Cần theo dõi thêm ${analysis.nextRequiredDays} ngày sau ngày đỉnh để hoàn thành chu kỳ.`;
                    break;
                case 'waiting_for_next_menstruation':
                    guidance = 'Đã qua giai đoạn khô. Chờ kinh nguyệt chu kỳ tiếp theo để hoàn thành chu kỳ hiện tại.';
                    break;
                case 'cross_month_drying':
                    guidance = 'Chu kỳ đã lấn sang tháng sau. Tiếp tục theo dõi cho đến khi hoàn toàn khô.';
                    break;
                case 'extended_post_peak_tracking':
                    guidance = analysis.instruction || 'Tiếp tục theo dõi hàng ngày đến khi có cảm giác khô.';
                    break;
                case 'post_peak_not_dry':
                    guidance = analysis.instruction || 'Tiếp tục theo dõi đến khi có cảm giác khô.';
                    break;
                default:
                    guidance = 'Tiếp tục theo dõi hàng ngày và ghi nhận đầy đủ thông tin.';
            }

            return res.json({
                success: false,
                message: 'Chu kỳ chưa đủ điều kiện để hoàn thành',
                data: {
                    analysis: analysis,
                    phase: analysis.phase,
                    guidance: guidance,
                    currentStatus: analysis.analysis
                }
            });
        }
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Auto complete cycle error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Test gửi email nhắc nhở
 * POST /api/reminders/test-email
 */
export const testEmailReminder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;

        const result = await menstrualCycleReminderService.sendManualReminder(userId);

        return res.json({
            success: true,
            message: 'Test email đã được gửi',
            data: result
        });
    } catch (error: any) {
        console.error('Test email reminder error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Tự động sửa chữa dữ liệu chu kỳ bị lỗi
 * POST /api/menstrual-cycles/auto-fix
 */
export const autoFixCycleData = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;

        const result = await menstrualCycleService.autoFixCycleData(userId);

        return res.json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error: any) {
        console.error('Auto fix cycle data error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server',
            error: error.message
        });
    }
};

/**
 * Validation nâng cao cho dữ liệu ngày chu kỳ
 * POST /api/menstrual-cycles/validate-advanced
 */
export const validateAdvancedCycleDay = async (req: AuthRequest, res: Response) => {
    try {
        const { cycleId, date, mucusObservation, feeling } = req.body;
        const userId = req.user!._id;

        // Verify cycle ownership
        const cycle = await MenstrualCycles.findOne({
            _id: cycleId,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        const validation = await menstrualCycleService.validateCycleDayInput(
            cycleId,
            new Date(date),
            mucusObservation,
            feeling
        );

        return res.json({
            success: true,
            data: validation
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Advanced validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Lấy hướng dẫn chi tiết về trạng thái chu kỳ hiện tại
 * GET /api/menstrual-cycles/:id/guidance
 */
export const getCycleGuidance = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        // Kiểm tra cycle thuộc về user
        const cycle = await MenstrualCycles.findOne({
            _id: id,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        // Phân tích chu kỳ
        const analysis = await menstrualCycleService.analyzeCycleCompletion(id);

        // Tạo hướng dẫn chi tiết
        const guidance = generateDetailedGuidance(analysis, cycle);

        return res.json({
            success: true,
            message: 'Lấy hướng dẫn chu kỳ thành công',
            data: guidance
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Get cycle guidance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Tạo hướng dẫn chi tiết dựa trên phân tích chu kỳ
 */

// ==================== ADVANCED CYCLE REPORTS ====================

/**
 * Lấy báo cáo chi tiết cho 1 chu kỳ với biểu đồ
 * GET /api/menstrual-cycles/:id/detailed-report
 */
export const getDetailedCycleReport = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        // Kiểm tra cycle thuộc về user
        const cycle = await MenstrualCycles.findOne({
            _id: id,
            createdByUserId: userId
        });

        if (!cycle) {
            throw new NotFoundError('Không tìm thấy chu kỳ hoặc bạn không có quyền truy cập');
        }

        const report = await menstrualCycleService.getDetailedCycleReport(id);

        return res.json({
            success: true,
            message: 'Lấy báo cáo chi tiết chu kỳ thành công',
            data: report
        });
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        console.error('Get detailed cycle report error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Lấy báo cáo so sánh 3 chu kỳ gần nhất với health assessment
 * GET /api/menstrual-cycles/three-cycle-comparison
 */
export const getThreeCycleComparison = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;

        const comparison = await menstrualCycleService.getThreeCycleComparison(userId);

        return res.json({
            success: true,
            message: 'Lấy báo cáo so sánh 3 chu kỳ thành công',
            data: comparison
        });
    } catch (error: any) {
        console.error('Get three cycle comparison error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Dự đoán chu kỳ tiếp theo dựa trên pattern phân tích
 * GET /api/menstrual-cycles/predictive-analysis
 */
export const getPredictiveAnalysis = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;

        // Lấy 3 chu kỳ gần nhất để dự đoán
        const comparison = await menstrualCycleService.getThreeCycleComparison(userId);

        if (comparison.cycles.length < 2) {
            return res.json({
                success: true,
                message: 'Chưa đủ dữ liệu để dự đoán',
                data: {
                    nextCycle: null,
                    basedOn: {
                        cycles: comparison.cycles.length,
                        message: 'Cần ít nhất 2 chu kỳ hoàn chỉnh để thực hiện dự đoán'
                    },
                    warnings: ['Tiếp tục theo dõi để có dự đoán chính xác hơn']
                }
            });
        }

        // Tính toán dự đoán dựa trên pattern
        const avgLength = comparison.pattern.averageLength;
        const avgResult = comparison.pattern.averageResult;
        const lastCycle = comparison.cycles[comparison.cycles.length - 1];

        // Dự đoán ngày bắt đầu chu kỳ tiếp theo
        const lastEndDate = new Date(lastCycle.endDate || new Date());
        const predictedStartDate = new Date(lastEndDate);
        predictedStartDate.setDate(predictedStartDate.getDate() + 1);

        // Dự đoán ngày đỉnh dựa trên pattern
        const cyclesWithPeak = comparison.cycles.filter((c: any) => c.peakDay);
        const avgPeakDay = cyclesWithPeak.length > 0 ?
            cyclesWithPeak.reduce((sum: number, c: any) => sum + (c.peakDay || 0), 0) / cyclesWithPeak.length : 14;

        const predictedPeakDay = Math.round(avgPeakDay);

        // Xác định confidence level
        let confidenceLevel: 'high' | 'medium' | 'low';
        if (comparison.pattern.consistency === 'stable' && comparison.cycles.length >= 3) {
            confidenceLevel = 'high';
        } else if (comparison.pattern.consistency === 'variable') {
            confidenceLevel = 'medium';
        } else {
            confidenceLevel = 'low';
        }

        // Range dự đoán
        const earliest = new Date(predictedStartDate);
        earliest.setDate(earliest.getDate() - 3);
        const latest = new Date(predictedStartDate);
        latest.setDate(latest.getDate() + 3);

        const predictiveData = {
            nextCycle: {
                predictedStartDate: predictedStartDate.toISOString().split('T')[0],
                predictedPeakDay,
                confidenceLevel,
                range: {
                    earliest: earliest.toISOString().split('T')[0],
                    latest: latest.toISOString().split('T')[0]
                }
            },
            basedOn: {
                cycles: comparison.cycles.length,
                averageLength: avgLength,
                averageResultValue: avgResult,
                patternRecognition: `Chu kỳ ${comparison.pattern.consistency === 'stable' ? 'ổn định' : comparison.pattern.consistency === 'variable' ? 'thay đổi' : 'không đều'}`
            },
            warnings: confidenceLevel === 'low' ? ['Dự đoán có độ tin cậy thấp do chu kỳ không đều'] : undefined
        };

        return res.json({
            success: true,
            message: 'Lấy phân tích dự đoán thành công',
            data: predictiveData
        });
    } catch (error: any) {
        console.error('Get predictive analysis error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

/**
 * Đánh giá sức khỏe dựa trên chu kỳ
 * GET /api/menstrual-cycles/health-assessment
 */
export const getHealthAssessment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;

        const comparison = await menstrualCycleService.getThreeCycleComparison(userId);

        if (comparison.cycles.length === 0) {
            return res.json({
                success: true,
                message: 'Chưa có dữ liệu chu kỳ',
                data: {
                    overall: {
                        status: 'needs_monitoring',
                        score: 0,
                        summary: 'Chưa có dữ liệu chu kỳ để đánh giá sức khỏe'
                    },
                    factors: {
                        cycleRegularity: {
                            score: 0,
                            status: 'unknown',
                            notes: 'Chưa có dữ liệu'
                        },
                        peakDayConsistency: {
                            score: 0,
                            status: 'unknown',
                            notes: 'Chưa có dữ liệu'
                        },
                        lengthVariation: {
                            score: 0,
                            status: 'unknown',
                            notes: 'Chưa có dữ liệu'
                        }
                    },
                    recommendations: ['Bắt đầu theo dõi chu kỳ kinh nguyệt đều đặn'],
                    redFlags: []
                }
            });
        }

        // Tính điểm sức khỏe tổng thể
        let totalScore = 0;
        const factors: any = {};
        const redFlags: string[] = [];
        const recommendations: string[] = [];

        // 1. Đánh giá tính đều đặn của chu kỳ
        const normalCycles = comparison.cycles.filter((c: any) => c.status === 'normal').length;
        const cycleRegularityScore = (normalCycles / comparison.cycles.length) * 100;

        factors.cycleRegularity = {
            score: Math.round(cycleRegularityScore),
            status: cycleRegularityScore >= 80 ? 'good' : cycleRegularityScore >= 60 ? 'fair' : 'poor',
            notes: `${normalCycles}/${comparison.cycles.length} chu kỳ bình thường`
        };

        // 2. Đánh giá tính nhất quán của ngày đỉnh
        const cyclesWithPeak = comparison.cycles.filter((c: any) => c.peakDay);
        let peakConsistencyScore = 0;

        if (cyclesWithPeak.length >= 2) {
            const peakDays = cyclesWithPeak.map((c: any) => c.peakDay!);
            const avgPeak = peakDays.reduce((a: number, b: number) => a + b, 0) / peakDays.length;
            const variance = peakDays.reduce((acc: number, val: number) => acc + Math.pow(val - avgPeak, 2), 0) / peakDays.length;

            if (variance <= 4) {
                peakConsistencyScore = 100;
            } else if (variance <= 9) {
                peakConsistencyScore = 75;
            } else if (variance <= 16) {
                peakConsistencyScore = 50;
            } else {
                peakConsistencyScore = 25;
            }

            factors.peakDayConsistency = {
                score: Math.round(peakConsistencyScore),
                status: peakConsistencyScore >= 80 ? 'good' : peakConsistencyScore >= 60 ? 'fair' : 'poor',
                notes: `Ngày đỉnh thay đổi trong khoảng ${Math.round(Math.sqrt(variance))} ngày`
            };
        } else {
            factors.peakDayConsistency = {
                score: 0,
                status: 'unknown',
                notes: 'Chưa đủ dữ liệu ngày đỉnh'
            };
        }

        // 3. Đánh giá độ biến thiên chiều dài chu kỳ
        const completedCycles = comparison.cycles.filter((c: any) => c.length);
        let lengthVariationScore = 0;

        if (completedCycles.length >= 2) {
            const lengths = completedCycles.map((c: any) => c.length!);
            const avgLength = lengths.reduce((a: number, b: number) => a + b, 0) / lengths.length;
            const variance = lengths.reduce((acc: number, val: number) => acc + Math.pow(val - avgLength, 2), 0) / lengths.length;

            if (variance <= 9) {
                lengthVariationScore = 100;
            } else if (variance <= 25) {
                lengthVariationScore = 75;
            } else if (variance <= 49) {
                lengthVariationScore = 50;
            } else {
                lengthVariationScore = 25;
            }

            factors.lengthVariation = {
                score: Math.round(lengthVariationScore),
                status: lengthVariationScore >= 80 ? 'good' : lengthVariationScore >= 60 ? 'fair' : 'poor',
                notes: `Chu kỳ thay đổi trong khoảng ${Math.round(Math.sqrt(variance))} ngày`
            };
        } else {
            factors.lengthVariation = {
                score: 0,
                status: 'unknown',
                notes: 'Chưa đủ dữ liệu chiều dài chu kỳ'
            };
        }

        // Tính điểm tổng
        const scores = [cycleRegularityScore, peakConsistencyScore, lengthVariationScore].filter(s => s > 0);
        totalScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        // Xác định trạng thái sức khỏe tổng thể
        let overallStatus: 'healthy' | 'needs_monitoring' | 'consult_doctor';
        let summary: string;

        if (totalScore >= 80) {
            overallStatus = 'healthy';
            summary = 'Chu kỳ kinh nguyệt của bạn rất tốt và ổn định';
            recommendations.push('Tiếp tục duy trì lối sống lành mạnh');
        } else if (totalScore >= 60) {
            overallStatus = 'needs_monitoring';
            summary = 'Chu kỳ kinh nguyệt cần được theo dõi thêm';
            recommendations.push('Theo dõi thêm 2-3 chu kỳ nữa');
            recommendations.push('Chú ý đến chế độ ăn uống và nghỉ ngơi');
        } else {
            overallStatus = 'consult_doctor';
            summary = 'Nên tham khảo ý kiến bác sĩ chuyên khoa';
            recommendations.push('Đặt lịch khám với bác sĩ phụ khoa');
            redFlags.push('Chu kỳ không đều đặn');
        }

        // Kiểm tra red flags
        const shortCycles = comparison.cycles.filter((c: any) => c.status === 'short').length;
        const longCycles = comparison.cycles.filter((c: any) => c.status === 'long').length;

        if (shortCycles >= 2) {
            redFlags.push('Nhiều chu kỳ ngắn bất thường');
        }
        if (longCycles >= 2) {
            redFlags.push('Nhiều chu kỳ dài bất thường');
        }
        if (comparison.pattern.consistency === 'irregular') {
            redFlags.push('Chu kỳ không có tính quy luật');
        }

        const healthAssessment = {
            overall: {
                status: overallStatus,
                score: Math.round(totalScore),
                summary
            },
            factors,
            recommendations,
            redFlags: redFlags.length > 0 ? redFlags : undefined
        };

        return res.json({
            success: true,
            message: 'Lấy đánh giá sức khỏe thành công',
            data: healthAssessment
        });
    } catch (error: any) {
        console.error('Get health assessment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server'
        });
    }
};

const generateDetailedGuidance = (analysis: any, cycle: any) => {
    const baseInfo = {
        cycleId: cycle._id,
        cycleNumber: cycle.cycleNumber,
        startDate: cycle.startDate,
        isCompleted: cycle.isCompleted,
        currentPhase: analysis.phase,
        analysis: analysis.analysis
    };

    switch (analysis.phase) {
        case 'waiting_for_menstruation':
            return {
                ...baseInfo,
                status: 'waiting',
                title: '🩸 Chờ ghi nhận kinh nguyệt',
                description: 'Hãy ghi nhận ngày đầu có máu kinh nguyệt để bắt đầu chu kỳ mới.',
                actions: [
                    {
                        type: 'record',
                        text: 'Ghi nhận "có máu" khi kinh nguyệt bắt đầu',
                        priority: 'high'
                    }
                ],
                tips: [
                    'Theo dõi cơ thể hàng ngày để không bỏ lỡ ngày đầu kinh',
                    'Ghi nhận ngay khi thấy dấu hiệu đầu tiên của máu kinh'
                ]
            };

        case 'pre_peak_tracking':
            return {
                ...baseInfo,
                status: 'tracking',
                title: '🔍 Đang theo dõi đến ngày đỉnh',
                description: 'Đã có kinh nguyệt, hiện đang chờ ngày đỉnh (cảm giác chất nhờn là trong và âm hộ căng).',
                actions: [
                    {
                        type: 'observe',
                        text: 'Quan sát chất nhờn hàng ngày',
                        priority: 'high'
                    },
                    {
                        type: 'record',
                        text: 'Ghi nhận khi có "trong và âm hộ căng" + "trơn"',
                        priority: 'high'
                    }
                ],
                tips: [
                    'Chú ý quan sát thay đổi từ khô → đục → trong',
                    'Ngày đỉnh thường xuất hiện khoảng ngày 12-16 của chu kỳ',
                    'Khi thấy "trong và âm hộ căng", hãy chọn cảm giác "trơn"'
                ]
            };

        case 'post_peak_tracking':
            return {
                ...baseInfo,
                status: 'critical',
                title: '⏰ Đang theo dõi sau ngày đỉnh',
                description: `Đã qua ngày đỉnh. Cần theo dõi thêm ${analysis.nextRequiredDays || 0} ngày để hoàn thành chu kỳ.`,
                peakDay: analysis.peakDay?.date,
                actions: [
                    {
                        type: 'continue',
                        text: `Tiếp tục ghi nhận ${analysis.nextRequiredDays || 0} ngày nữa`,
                        priority: 'high'
                    },
                    {
                        type: 'observe',
                        text: 'Chú ý sự chuyển đổi sang trạng thái khô',
                        priority: 'medium'
                    }
                ],
                tips: [
                    'Đây là giai đoạn quan trọng để xác định chu kỳ hoàn chỉnh',
                    'Ghi nhận chính xác cảm giác "khô" hoặc "ít chất tiết"',
                    'Không bỏ sót bất kỳ ngày nào trong giai đoạn này'
                ]
            };

        case 'waiting_for_next_menstruation':
            return {
                ...baseInfo,
                status: 'waiting',
                title: '🕰️ Chờ kinh nguyệt chu kỳ mới',
                description: 'Đã hoàn thành 3 ngày khô sau đỉnh. Đang chờ kinh nguyệt chu kỳ tiếp theo.',
                peakDay: analysis.peakDay?.date,
                actions: [
                    {
                        type: 'wait',
                        text: 'Chờ xuất hiện máu kinh nguyệt mới',
                        priority: 'medium'
                    },
                    {
                        type: 'record',
                        text: 'Ghi nhận ngay khi có máu mới',
                        priority: 'high'
                    }
                ],
                tips: [
                    'Chu kỳ sẽ tự động hoàn thành khi có máu mới',
                    'Hệ thống sẽ tự động tạo chu kỳ mới',
                    'Tiếp tục theo dõi để không bỏ lỡ chu kỳ tiếp theo'
                ]
            };

        case 'cross_month_drying':
        case 'extended_post_peak_tracking':
            return {
                ...baseInfo,
                status: 'extended',
                title: '📅 Chu kỳ lấn sang tháng sau',
                description: 'Trường hợp 2: Chu kỳ đã lấn sang tháng sau. Cần tiếp tục theo dõi đến khi hoàn toàn khô.',
                peakDay: analysis.peakDay?.date,
                cycleType: 'cross_month',
                actions: [
                    {
                        type: 'continue',
                        text: 'Tiếp tục theo dõi hàng ngày',
                        priority: 'high'
                    },
                    {
                        type: 'observe',
                        text: 'Chờ chuyển sang trạng thái khô hoàn toàn',
                        priority: 'high'
                    }
                ],
                tips: [
                    'Đây là hiện tượng bình thường, không cần lo lắng',
                    'Một số chu kỳ có thể kéo dài hơn và lấn sang tháng sau',
                    'Kiên nhẫn theo dõi đến khi chuyển sang khô',
                    'Chu kỳ sẽ hoàn thành khi đã khô hoàn toàn'
                ]
            };

        case 'completed_case_1':
            return {
                ...baseInfo,
                status: 'completed',
                title: '✅ Chu kỳ hoàn thành (Trường hợp 1)',
                description: 'Chu kỳ đã hoàn thành trong cùng tháng. Hệ thống đã tự động tạo chu kỳ mới.',
                peakDay: analysis.peakDay?.date,
                cycleLength: analysis.cycleLength,
                cycleType: 'same_month',
                actions: [
                    {
                        type: 'start_new',
                        text: 'Bắt đầu theo dõi chu kỳ mới',
                        priority: 'medium'
                    }
                ],
                tips: [
                    'Chúc mừng! Chu kỳ của bạn theo mẫu bình thường',
                    'Hệ thống đã tự động tạo chu kỳ mới',
                    'Tiếp tục theo dõi đều đặn cho chu kỳ tiếp theo'
                ]
            };

        default:
            return {
                ...baseInfo,
                status: 'unknown',
                title: '📝 Đang thu thập dữ liệu',
                description: 'Tiếp tục ghi nhận dữ liệu hàng ngày để hệ thống có thể phân tích.',
                actions: [
                    {
                        type: 'record',
                        text: 'Ghi nhận đầy đủ thông tin mỗi ngày',
                        priority: 'high'
                    }
                ],
                tips: [
                    'Hãy ghi nhận đầy đủ cảm giác và quan sát chất nhờn',
                    'Theo dõi liên tục để có dữ liệu chính xác',
                    'Hệ thống sẽ phân tích khi có đủ dữ liệu'
                ]
            };
    }
}; 