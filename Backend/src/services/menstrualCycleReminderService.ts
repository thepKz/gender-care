import { MenstrualCycleReminders, CycleDays, MenstrualCycles } from '../models';
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
            }).populate('userId');

            for (const reminder of reminders) {
                // Kiểm tra xem user đã cập nhật dữ liệu hôm nay chưa
                const hasUpdatedToday = await this.hasUpdatedToday(reminder.userId.toString());

                if (!hasUpdatedToday) {
                    await this.sendReminderNotification(reminder.userId.toString());

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
        // Tạm thời log, có thể tích hợp với email service hoặc push notification
        console.log(`📱 Sending reminder to user ${userId}: "Bạn quên chưa cập nhật trạng thái chu kỳ kinh nguyệt ạ"`);

        // TODO: Tích hợp với email service hoặc push notification service
        // await emailService.sendReminderEmail(user.email, 'Nhắc nhở cập nhật chu kỳ kinh nguyệt');
        // await pushNotificationService.send(userId, { title: 'Nhắc nhở', body: 'Bạn quên chưa cập nhật trạng thái ạ' });
    }

    /**
     * Gửi nhắc nhở thủ công cho user cụ thể
     */
    async sendManualReminder(userId: string): Promise<{ success: boolean; message: string }> {
        try {
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
            const allReminders = await MenstrualCycleReminders.find({
                reminderEnabled: true
            });

            for (const reminder of allReminders) {
                try {
                    const hasUpdated = await this.hasUpdatedToday(reminder.userId.toString());

                    if (!hasUpdated) {
                        await this.sendReminderNotification(reminder.userId.toString());
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
        const totalUsers = await MenstrualCycleReminders.countDocuments();
        const enabledUsers = await MenstrualCycleReminders.countDocuments({ reminderEnabled: true });
        const disabledUsers = totalUsers - enabledUsers;

        // Thống kê theo giờ nhắc nhở phổ biến
        const timeStats = await MenstrualCycleReminders.aggregate([
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
            popularReminderTimes: timeStats
        };
    }
}

export const menstrualCycleReminderService = new MenstrualCycleReminderService(); 