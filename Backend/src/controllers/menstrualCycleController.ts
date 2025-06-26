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

        const cycleDay = await menstrualCycleService.createOrUpdateCycleDay({
            cycleId,
            date: new Date(date),
            mucusObservation,
            feeling,
            notes
        });

        return res.status(201).json({
            success: true,
            message: 'Cập nhật dữ liệu ngày thành công',
            data: cycleDay
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
            'lấm tấm máu': ['ướt'],
            'đục': ['dính', 'ẩm'],
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
 * Tự động đánh dấu chu kỳ hoàn thành khi đủ điều kiện
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

        // Phân tích chu kỳ
        const analysis = await menstrualCycleService.analyzeCycleCompletion(id);

        if (analysis.isComplete) {
            // Đánh dấu chu kỳ hoàn thành
            cycle.isCompleted = true;
            cycle.status = 'completed';

            // Lưu ngày đỉnh nếu có
            if (analysis.peakDay) {
                cycle.peakDay = analysis.peakDay.date;
            }

            await cycle.save();

            return res.json({
                success: true,
                message: 'Chu kỳ đã được đánh dấu hoàn thành',
                data: {
                    cycle: cycle,
                    analysis: analysis
                }
            });
        } else {
            return res.json({
                success: false,
                message: 'Chu kỳ chưa đủ điều kiện để hoàn thành',
                data: {
                    analysis: analysis
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