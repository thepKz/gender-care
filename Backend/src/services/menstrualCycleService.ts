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
        const cycleDays = await CycleDays.find({ month, year }).populate({
            path: 'cycleId',
            match: { createdByUserId: userId }
        });

        return cycleDays.filter(day => day.cycleId).map(day => ({
            date: day.date,
            symbol: day.isPeakDay ? 'X' : '•',
            isPeakDay: day.isPeakDay,
            fertilityProbability: day.fertilityProbability,
            mucusObservation: day.mucusObservation,
            feeling: day.feeling,
            notes: day.notes
        }));
    }
}

export default new MenstrualCycleService();
