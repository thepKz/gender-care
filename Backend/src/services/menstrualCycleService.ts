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
            let cycleDayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

            // Đảm bảo cycleDayNumber luôn >= 1
            // Nếu ngày được chọn trước ngày bắt đầu chu kỳ, có thể đây là trường hợp cần cập nhật ngày bắt đầu
            if (cycleDayNumber < 1) {
                // Nếu đây là ngày có máu kinh và trước ngày bắt đầu hiện tại
                if (mucusObservation === 'có máu' || mucusObservation === 'lấm tấm máu') {
                    // Cập nhật ngày bắt đầu chu kỳ về ngày này
                    cycle.startDate = date;
                    await cycle.save();

                    // Tính toán lại cycleDayNumber = 1 cho ngày này
                    cycleDayNumber = 1;

                    // Cập nhật lại tất cả các ngày khác trong chu kỳ
                    await this.recalculateAllCycleDays(cycleId, date);
                } else {
                    // Nếu không phải ngày có máu, set cycleDayNumber = 1 để tránh lỗi validation
                    cycleDayNumber = 1;
                }
            }

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

    /**
     * Tính toán lại cycleDayNumber cho tất cả ngày trong chu kỳ
     */
    async recalculateAllCycleDays(cycleId: string, newStartDate: Date): Promise<void> {
        try {
            const cycleDays = await CycleDays.find({ cycleId });

            const bulkOps = cycleDays.map(day => {
                const diffTime = day.date.getTime() - newStartDate.getTime();
                const newCycleDayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

                return {
                    updateOne: {
                        filter: { _id: day._id },
                        update: {
                            cycleDayNumber: Math.max(newCycleDayNumber, 1) // Đảm bảo >= 1
                        }
                    }
                };
            });

            if (bulkOps.length > 0) {
                await CycleDays.bulkWrite(bulkOps);
            }

            console.log(`✅ Recalculated ${bulkOps.length} cycle days for cycle ${cycleId}`);
        } catch (error) {
            console.error('Error in recalculateAllCycleDays:', error);
            throw error;
        }
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

    /**
     * Phân tích chu kỳ hoàn chỉnh theo phương pháp Billings
     * @param cycleId ID của chu kỳ cần phân tích
     */
    async analyzeCycleCompletion(cycleId: string): Promise<any> {
        try {
            // Lấy tất cả cycle days của chu kỳ, sắp xếp theo ngày
            const cycleDays = await CycleDays.find({ cycleId })
                .sort({ date: 1 })
                .lean();

            if (cycleDays.length === 0) {
                return {
                    isComplete: false,
                    analysis: 'Chưa có dữ liệu nào được ghi nhận',
                    phase: 'no_data'
                };
            }

            // Tìm các ngày quan trọng
            const bloodDays = cycleDays.filter(day =>
                day.mucusObservation === 'có máu'
            );

            const spottingDays = cycleDays.filter(day =>
                day.mucusObservation === 'lấm tấm máu'
            );

            const peakDays = cycleDays.filter(day =>
                day.mucusObservation === 'trong và âm hộ căng'
            );

            const dryDays = cycleDays.filter(day =>
                day.mucusObservation === 'ít chất tiết' ||
                day.feeling === 'khô'
            );

            // Xác định ngày đỉnh (peak day)
            const peakDay = peakDays.length > 0 ? peakDays[peakDays.length - 1] : null;

            // Phân tích mẫu chu kỳ
            const pattern = this.identifyCyclePattern(cycleDays);

            // Kiểm tra chu kỳ hoàn chỉnh
            const completionCheck = this.checkCycleCompletion(cycleDays, pattern);

            return {
                isComplete: completionCheck.isComplete,
                analysis: completionCheck.analysis,
                phase: completionCheck.phase,
                peakDay: peakDay ? {
                    date: peakDay.date,
                    cycleDayNumber: peakDay.cycleDayNumber
                } : null,
                pattern: pattern,
                nextPeakPrediction: this.predictNextPeak(peakDay, cycleDays),
                recommendations: this.generateRecommendations(pattern, cycleDays)
            };
        } catch (error) {
            console.error('Error analyzing cycle completion:', error);
            throw error;
        }
    }

    /**
     * Xác định mẫu chu kỳ (Pattern Recognition)
     */
    private identifyCyclePattern(cycleDays: any[]): any {
        const sequence = cycleDays.map(day => day.mucusObservation).filter(obs => obs);

        // Trường hợp 1: Máu → Lấm tấm máu → Khô → Đục → Trong âm hộ căng
        const hasBlood = sequence.includes('có máu');
        const hasSpotting = sequence.includes('lấm tấm máu');
        const hasDry = sequence.includes('ít chất tiết') || cycleDays.some(d => d.feeling === 'khô');
        const hasCloudy = sequence.includes('đục');
        const hasPeak = sequence.includes('trong và âm hộ căng');

        if (hasBlood && hasSpotting && hasDry && hasCloudy && hasPeak) {
            return {
                type: 'normal_pattern',
                name: 'Chu kỳ bình thường',
                description: 'Máu → Lấm tấm máu → Khô → Đục → Trong âm hộ căng',
                confidence: 'high'
            };
        }

        // Trường hợp 2: Lấm tấm máu → Ít chất tiết
        if (hasSpotting && !hasBlood && (hasDry || sequence.includes('ít chất tiết'))) {
            return {
                type: 'irregular_pattern',
                name: 'Chu kỳ cần theo dõi',
                description: 'Lấm tấm máu → Ít chất tiết',
                confidence: 'low',
                needsMoreObservation: true
            };
        }

        // Các trường hợp khác
        return {
            type: 'unknown_pattern',
            name: 'Mẫu chưa rõ ràng',
            description: 'Cần thêm dữ liệu để phân tích',
            confidence: 'unknown'
        };
    }

    /**
     * Kiểm tra chu kỳ có hoàn chỉnh không
     */
    private checkCycleCompletion(cycleDays: any[], pattern: any): any {
        const sequence = cycleDays.map(day => ({
            date: day.date,
            mucus: day.mucusObservation,
            feeling: day.feeling,
            dayNumber: day.cycleDayNumber
        })).filter(day => day.mucus || day.feeling);

        // Tìm ngày bắt đầu có máu
        const bloodStart = sequence.find(day => day.mucus === 'có máu');

        // Tìm ngày đỉnh
        const peakDay = sequence.find(day => day.mucus === 'trong và âm hộ căng');

        // Tìm ngày khô sau đỉnh
        const dryAfterPeak = sequence.filter(day =>
            peakDay && day.dayNumber > peakDay.dayNumber &&
            (day.mucus === 'ít chất tiết' || day.feeling === 'khô')
        );

        if (pattern.type === 'normal_pattern') {
            if (bloodStart && peakDay && dryAfterPeak.length >= 3) {
                return {
                    isComplete: true,
                    phase: 'completed',
                    analysis: `Chu kỳ hoàn chỉnh. Ngày đỉnh: ${peakDay.dayNumber}. Thời gian khô sau đỉnh: ${dryAfterPeak.length} ngày.`
                };
            } else if (bloodStart && peakDay && dryAfterPeak.length < 3) {
                return {
                    isComplete: false,
                    phase: 'post_peak_tracking',
                    analysis: `Đã qua ngày đỉnh (ngày ${peakDay.dayNumber}). Cần theo dõi thêm ${3 - dryAfterPeak.length} ngày khô để hoàn thành chu kỳ.`
                };
            } else if (bloodStart && !peakDay) {
                return {
                    isComplete: false,
                    phase: 'pre_peak_tracking',
                    analysis: 'Đã có kinh nguyệt, đang chờ ngày đỉnh (trong và âm hộ căng).'
                };
            }
        }

        if (pattern.type === 'irregular_pattern') {
            return {
                isComplete: false,
                phase: 'needs_observation',
                analysis: 'Mẫu chưa rõ ràng. Cần theo dõi thêm 2 chu kỳ để xác định mẫu chính xác.'
            };
        }

        return {
            isComplete: false,
            phase: 'initial_tracking',
            analysis: 'Đang theo dõi, chưa đủ dữ liệu để phân tích.'
        };
    }

    /**
     * Dự đoán ngày đỉnh chu kỳ tiếp theo
     */
    private predictNextPeak(peakDay: any, cycleDays: any[]): any {
        if (!peakDay) {
            return {
                prediction: null,
                confidence: 'none',
                message: 'Chưa xác định được ngày đỉnh của chu kỳ hiện tại'
            };
        }

        // Dự đoán dựa trên chu kỳ trung bình 28 ngày (có thể điều chỉnh theo lịch sử user)
        const avgCycleLength = 28;
        const currentPeakDay = peakDay.cycleDayNumber;

        // Ngày đỉnh thường rơi vào khoảng ngày 12-16 của chu kỳ
        const nextCycleStart = new Date(cycleDays[0].date);
        nextCycleStart.setDate(nextCycleStart.getDate() + avgCycleLength);

        const predictedPeakDate = new Date(nextCycleStart);
        predictedPeakDate.setDate(predictedPeakDate.getDate() + currentPeakDay - 1);

        return {
            prediction: {
                date: predictedPeakDate,
                cycleDayNumber: currentPeakDay,
                range: {
                    earliest: new Date(predictedPeakDate.getTime() - 2 * 24 * 60 * 60 * 1000),
                    latest: new Date(predictedPeakDate.getTime() + 2 * 24 * 60 * 60 * 1000)
                }
            },
            confidence: 'medium',
            message: `Dự đoán ngày đỉnh chu kỳ tiếp theo vào khoảng ${predictedPeakDate.toLocaleDateString('vi-VN')} (±2 ngày)`
        };
    }

    /**
     * Tạo khuyến nghị dựa trên phân tích
     */
    private generateRecommendations(pattern: any, cycleDays: any[]): string[] {
        const recommendations: string[] = [];

        if (pattern.type === 'normal_pattern') {
            recommendations.push('✅ Chu kỳ của bạn theo mẫu bình thường theo phương pháp Billings');
            recommendations.push('📊 Tiếp tục theo dõi đều đặn để duy trì độ chính xác');

            // Tìm khoảng thời gian khô giữa lấm tấm máu và đục
            const spottingDay = cycleDays.find(d => d.mucusObservation === 'lấm tấm máu');
            const cloudyDay = cycleDays.find(d => d.mucusObservation === 'đục');

            if (spottingDay && cloudyDay && cloudyDay.cycleDayNumber > spottingDay.cycleDayNumber) {
                const dryPeriod = cloudyDay.cycleDayNumber - spottingDay.cycleDayNumber;
                recommendations.push(`🌟 Thời gian chu kỳ khô: ${dryPeriod} ngày (từ ngày ${spottingDay.cycleDayNumber} đến ${cloudyDay.cycleDayNumber})`);
            }
        }

        if (pattern.type === 'irregular_pattern') {
            recommendations.push('⚠️ Mẫu chu kỳ chưa rõ ràng, cần theo dõi thêm');
            recommendations.push('📝 Theo dõi thêm 2 chu kỳ nữa để xác định mẫu chính xác');
            recommendations.push('💡 Ghi nhận đầy đủ cảm giác và quan sát chất nhờn mỗi ngày');
        }

        if (pattern.type === 'unknown_pattern') {
            recommendations.push('📈 Cần thêm dữ liệu để phân tích chu kỳ');
            recommendations.push('🎯 Hãy ghi nhận đầy đủ thông tin mỗi ngày');
            recommendations.push('⏰ Theo dõi ít nhất 21-35 ngày để có một chu kỳ hoàn chỉnh');
        }

        return recommendations;
    }
}

export default new MenstrualCycleService();
