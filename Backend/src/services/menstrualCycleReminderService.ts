import { MenstrualCycleReminders, CycleDays, MenstrualCycles } from '../models';
import { User } from '../models';
import { sendMenstrualCycleReminderEmail } from './emails';
import cron from 'node-cron';

class MenstrualCycleReminderService {

    /**
     * Khởi tạo cron job để gửi nhắc nhở hàng ngày
     */
    initializeDailyReminders() {
        // Chạy mỗi phút để kiểm tra reminder (trong production có thể điều chỉnh)
        cron.schedule('* * * * *', async () => {
            await this.checkAndSendReminders();
        });

        console.log('📅 Menstrual cycle daily reminders initialized');
    }

    /**
     * Kiểm tra và gửi nhắc nhở cho users
     */
    private async checkAndSendReminders() {
        try {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            // Tìm users có reminder enabled và đến giờ nhắc nhở
            const reminders = await MenstrualCycleReminders.find({
                reminderEnabled: true,
                reminderTime: currentTime
            }).populate({
                path: 'userId',
                select: 'gender email fullName',
                match: { gender: 'female' } // Chỉ lấy user nữ
            });

            for (const reminder of reminders) {
                // Skip nếu user không phải nữ hoặc không tồn tại (do match filter)
                if (!reminder.userId || (reminder.userId as any).gender !== 'female') {
                    continue;
                }

                // Lấy userId - từ populated object  
                const userId = (reminder.userId as any)._id ? (reminder.userId as any)._id.toString() : reminder.userId.toString();

                // Kiểm tra xem user đã cập nhật dữ liệu hôm nay chưa
                const hasUpdatedToday = await this.hasUpdatedToday(userId);

                if (!hasUpdatedToday) {
                    await this.sendReminderNotification(userId);

                    // Cập nhật lastNotifiedAt
                    reminder.lastNotifiedAt = now;
                    await reminder.save();
                }
            }
        } catch (error) {
            console.error('Error checking reminders:', error);
        }
    }

    /**
     * Kiểm tra user đã cập nhật dữ liệu hôm nay chưa
     */
    private async hasUpdatedToday(userId: string): Promise<boolean> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Tìm chu kỳ đang tracking
        const activeCycle = await MenstrualCycles.findOne({
            createdByUserId: userId,
            status: 'tracking'
        });

        if (!activeCycle) return true; // Không có chu kỳ đang tracking thì không cần nhắc

        // Kiểm tra đã có dữ liệu cho hôm nay chưa
        const todayData = await CycleDays.findOne({
            cycleId: activeCycle._id,
            date: {
                $gte: today,
                $lt: tomorrow
            }
        });

        return !!todayData;
    }

    /**
     * Gửi notification nhắc nhở (có thể tích hợp với email, push notification, etc.)
     */
    private async sendReminderNotification(userId: string) {
        try {
            // Lấy thông tin user để có email và tên
            const user = await User.findById(userId).select('email fullName');

            if (!user) {
                console.error(`User not found: ${userId}`);
                return;
            }

            // Gửi email nhắc nhở
            await sendMenstrualCycleReminderEmail(user.email, user.fullName);

            console.log(`📧 Email reminder sent to ${user.email} (${user.fullName}): "Nhắc nhở cập nhật chu kỳ kinh nguyệt"`);

        } catch (error) {
            console.error(`Error sending reminder notification to user ${userId}:`, error);

            // Fallback: chỉ log nếu gửi email thất bại
            console.log(`📱 Fallback reminder log for user ${userId}: "Bạn quên chưa cập nhật trạng thái chu kỳ kinh nguyệt ạ"`);
        }
    }

    /**
     * Gửi nhắc nhở thủ công cho user cụ thể
     */
    async sendManualReminder(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            // Kiểm tra user có phải nữ không
            const user = await User.findById(userId).select('gender');
            if (!user) {
                return {
                    success: false,
                    message: 'Không tìm thấy user'
                };
            }

            if (user.gender !== 'female') {
                return {
                    success: false,
                    message: 'Tính năng nhắc nhở chu kỳ kinh nguyệt chỉ dành cho phụ nữ'
                };
            }

            const hasUpdated = await this.hasUpdatedToday(userId);

            if (hasUpdated) {
                return {
                    success: false,
                    message: 'User đã cập nhật dữ liệu hôm nay rồi'
                };
            }

            await this.sendReminderNotification(userId);

            // Cập nhật lastNotifiedAt
            await MenstrualCycleReminders.findOneAndUpdate(
                { userId },
                { lastNotifiedAt: new Date() }
            );

            return {
                success: true,
                message: 'Đã gửi nhắc nhở thành công'
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Lỗi khi gửi nhắc nhở: ${error.message}`
            };
        }
    }

    /**
     * Trigger gửi nhắc nhở cho tất cả users (cho cronjob)
     */
    async notifyAllUsers(): Promise<{ notified: number; skipped: number; errors: number }> {
        const stats = { notified: 0, skipped: 0, errors: 0 };

        try {
            // Chỉ lấy reminders của user nữ có chu kỳ kinh nguyệt
            const allReminders = await MenstrualCycleReminders.find({
                reminderEnabled: true
            }).populate({
                path: 'userId',
                select: 'gender email fullName',
                match: { gender: 'female' } // Chỉ lấy user nữ
            });

            for (const reminder of allReminders) {
                try {
                    // Skip nếu user không phải nữ hoặc không tồn tại (do match filter)
                    if (!reminder.userId || (reminder.userId as any).gender !== 'female') {
                        stats.skipped++;
                        continue;
                    }

                    // Lấy userId - từ populated object
                    const userId = (reminder.userId as any)._id ? (reminder.userId as any)._id.toString() : reminder.userId.toString();

                    const hasUpdated = await this.hasUpdatedToday(userId);

                    if (!hasUpdated) {
                        await this.sendReminderNotification(userId);
                        stats.notified++;

                        // Cập nhật lastNotifiedAt
                        reminder.lastNotifiedAt = new Date();
                        await reminder.save();
                    } else {
                        stats.skipped++;
                    }
                } catch (error) {
                    stats.errors++;
                    console.error(`Error sending reminder to user ${reminder.userId}:`, error);
                }
            }
        } catch (error) {
            console.error('Error in notifyAllUsers:', error);
        }

        return stats;
    }

    /**
     * Lấy thống kê reminder
     */
    async getReminderStats(): Promise<any> {
        // Chỉ thống kê user nữ có chu kỳ kinh nguyệt
        const femaleReminders = await MenstrualCycleReminders.find({}).populate({
            path: 'userId',
            select: 'gender',
            match: { gender: 'female' }
        });

        // Filter ra những reminder thuộc về user nữ
        const validReminders = femaleReminders.filter(reminder => reminder.userId);

        const totalUsers = validReminders.length;
        const enabledUsers = validReminders.filter(reminder => reminder.reminderEnabled).length;
        const disabledUsers = totalUsers - enabledUsers;

        // Thống kê theo giờ nhắc nhở phổ biến (chỉ user nữ có reminder enabled)
        const timeStats = await MenstrualCycleReminders.aggregate([
            // Lookup user information
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            // Match chỉ user nữ có reminder enabled
            {
                $match: {
                    'user.gender': 'female',
                    reminderEnabled: true
                }
            },
            // Group theo reminderTime
            {
                $group: {
                    _id: '$reminderTime',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        return {
            totalUsers,
            enabledUsers,
            disabledUsers,
            popularReminderTimes: timeStats,
            note: 'Thống kê chỉ bao gồm user nữ có chu kỳ kinh nguyệt'
        };
    }
}

export const menstrualCycleReminderService = new MenstrualCycleReminderService(); 