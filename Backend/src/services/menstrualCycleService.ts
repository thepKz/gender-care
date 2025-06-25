import { MenstrualCycles, CycleDays, MenstrualCycleReports } from '../models';
import { MUCUS_FEELING_RULES } from '../models/CycleSymptoms';

export interface CreateCycleDayData {
    cycleId: string;
    date: Date;
    mucusObservation?: string;
    feeling?: string;
    notes?: string;
}

class MenstrualCycleService {
    async createCycle(userId: string, startDate: Date): Promise<any> {
        const lastCycle = await MenstrualCycles.findOne({ createdByUserId: userId }).sort({ cycleNumber: -1 });
        const cycleNumber = lastCycle ? lastCycle.cycleNumber + 1 : 1;

        return await MenstrualCycles.create({
            createdByUserId: userId,
            startDate,
            cycleNumber,
            status: 'tracking'
        });
    }

    async createOrUpdateCycleDay(data: CreateCycleDayData): Promise<any> {
        const { cycleId, date, mucusObservation, feeling, notes } = data;

        let cycleDay = await CycleDays.findOne({ cycleId, date });

        if (cycleDay) {
            cycleDay.mucusObservation = mucusObservation;
            cycleDay.feeling = feeling;
            cycleDay.notes = notes;
        } else {
            const cycle = await MenstrualCycles.findById(cycleId);
            if (!cycle) throw new Error('Cycle not found');

            const diffTime = date.getTime() - cycle.startDate.getTime();
            const cycleDayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

            cycleDay = new CycleDays({
                cycleId,
                date,
                mucusObservation,
                feeling,
                notes,
                cycleDayNumber,
                month: date.getMonth() + 1,
                year: date.getFullYear()
            });
        }

        await cycleDay.save();

        if (mucusObservation === 'trong và âm hộ căng' && feeling === 'trơn') {
            cycleDay.isPeakDay = true;
            cycleDay.fertilityProbability = 100;
            await cycleDay.save();
        }

        return cycleDay;
    }

    async generateCycleReport(cycleId: string): Promise<any> {
        return { message: 'Report generation not implemented yet', cycleId };
    }

    async compareThreeCycles(userId: string): Promise<any> {
        return { message: 'Cycle comparison not implemented yet', userId };
    }

    async getCalendarData(userId: string, month: number, year: number): Promise<any> {
        // Lấy tất cả cycle days của user trong tháng
        const cycleDays = await CycleDays.find({
            month,
            year
        }).populate({
            path: 'cycleId',
            match: { createdByUserId: userId }
        }).sort({ date: 1 });

        // Filter chỉ lấy days thuộc về user
        const userCycleDays = cycleDays.filter(day => day.cycleId);

        return userCycleDays.map(day => {
            let symbol = '';
            let color = '';
            let description = '';

            // Logic tạo symbols theo phương pháp Billings
            if (day.mucusObservation === 'có máu' || day.mucusObservation === 'lấm tấm máu') {
                symbol = 'M';
                color = '#e53935'; // Đỏ cho kinh nguyệt
                description = 'Kinh nguyệt';
            } else if (day.isPeakDay) {
                symbol = 'X';
                color = '#ff9800'; // Cam cho ngày đỉnh
                description = 'Ngày đỉnh';
            } else if (day.peakDayRelative === 1) {
                symbol = '1';
                color = '#fdd835'; // Vàng cho ngày 1 sau đỉnh
                description = 'Ngày 1 sau đỉnh (75%)';
            } else if (day.peakDayRelative === 2) {
                symbol = '2';
                color = '#66bb6a'; // Xanh lá cho ngày 2 sau đỉnh
                description = 'Ngày 2 sau đỉnh (50%)';
            } else if (day.peakDayRelative === 3) {
                symbol = '3';
                color = '#42a5f5'; // Xanh dương cho ngày 3 sau đỉnh
                description = 'Ngày 3 sau đỉnh (20%)';
            } else if (day.mucusObservation === 'đục' || day.mucusObservation === 'đục nhiều sợi' || day.mucusObservation === 'trong nhiều sợi') {
                symbol = 'C';
                color = '#ab47bc'; // Tím cho có thể thụ thai
                description = 'Có thể thụ thai';
            } else if (day.feeling === 'khô' || day.mucusObservation === 'ít chất tiết') {
                symbol = 'D';
                color = '#78909c'; // Xám cho khô
                description = 'Khô';
            } else {
                symbol = 'S';
                color = '#26c6da'; // Xanh nhạt cho an toàn
                description = 'An toàn';
            }

            return {
                date: day.date.toISOString().split('T')[0], // YYYY-MM-DD format
                symbol,
                color,
                description,
                isPeakDay: day.isPeakDay || false,
                fertilityProbability: day.fertilityProbability || 0,
                cycleDay: {
                    _id: day._id,
                    mucusObservation: day.mucusObservation,
                    feeling: day.feeling,
                    notes: day.notes,
                    cycleDayNumber: day.cycleDayNumber,
                    isAutoGenerated: day.isAutoGenerated || false
                }
            };
        });
    }
}

export default new MenstrualCycleService();
