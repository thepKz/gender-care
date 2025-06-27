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

        // Validation nâng cao trước khi lưu
        const validation = await this.validateCycleDayInput(cycleId, date, mucusObservation, feeling);

        // Nếu có lỗi nghiêm trọng, từ chối lưu
        if (!validation.isValid && validation.errors.some(e => e.includes('Ngày đỉnh đã tồn tại'))) {
            throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
        }

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
                // Nếu đây là ngày có máu kinh nguyệt và trước ngày bắt đầu hiện tại
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

        // Đánh dấu ngày đỉnh
        if (mucusObservation === 'trong và âm hộ căng' && feeling === 'trơn') {
            cycleDay.isPeakDay = true;
            cycleDay.fertilityProbability = 100;
            await cycleDay.save();
        }

        // ✨ LOGIC MỚI: Tự động phát hiện chu kỳ mới khi có máu sau chu kỳ hoàn thành
        if (mucusObservation === 'có máu') {
            console.log(`🩸 [AUTO-CYCLE] Phát hiện máu mới ngày ${date.toISOString().split('T')[0]}, kiểm tra điều kiện tạo chu kỳ mới...`);
            const shouldCreateNewCycle = await this.checkForNewCycleCreation(cycleId, date);
            console.log(`🔍 [AUTO-CYCLE] Kết quả kiểm tra:`, shouldCreateNewCycle);

            if (shouldCreateNewCycle.shouldCreate) {
                // Hoàn thành chu kỳ cũ
                const oldCycle = await MenstrualCycles.findById(cycleId);
                if (oldCycle && !oldCycle.isCompleted) {
                    oldCycle.isCompleted = true;
                    oldCycle.status = 'completed';
                    oldCycle.endDate = shouldCreateNewCycle.endDate;
                    if (shouldCreateNewCycle.peakDay) {
                        oldCycle.peakDay = shouldCreateNewCycle.peakDay;
                    }
                    await oldCycle.save();
                }

                // Tạo chu kỳ mới
                const newCycle = await this.createCycle(oldCycle!.createdByUserId.toString(), date);

                // Chuyển cycle day này sang chu kỳ mới
                cycleDay.cycleId = newCycle._id;
                cycleDay.cycleDayNumber = 1; // Đây là ngày đầu của chu kỳ mới
                await cycleDay.save();

                return {
                    cycleDay,
                    newCycleCreated: true,
                    oldCycleId: cycleId,
                    newCycleId: newCycle._id,
                    completedCycle: oldCycle,
                    newCycle: newCycle
                };
            }
        }

        return {
            cycleDay,
            validation: validation
        };
    }

    /**
     * Kiểm tra xem có nên tạo chu kỳ mới không khi phát hiện máu
     */
    private async checkForNewCycleCreation(currentCycleId: string, bloodDate: Date): Promise<{
        shouldCreate: boolean;
        endDate?: Date;
        peakDay?: Date;
        reason?: string;
    }> {
        try {
            // Phân tích chu kỳ hiện tại
            const analysis = await this.analyzeCycleCompletion(currentCycleId);

            // Lấy tất cả cycle days để phân tích
            const cycleDays = await CycleDays.find({ cycleId: currentCycleId })
                .sort({ date: 1 })
                .lean();

            if (cycleDays.length === 0) {
                return { shouldCreate: false, reason: 'Không có dữ liệu chu kỳ' };
            }

            // Tìm ngày đỉnh - kiểm tra cả isPeakDay và mucusObservation
            const peakDay = cycleDays.find(day =>
                day.mucusObservation === 'trong và âm hộ căng' || day.isPeakDay === true
            );

            console.log(`🔍 [AUTO-CYCLE] Tìm ngày đỉnh trong ${cycleDays.length} ngày:`,
                cycleDays.map(d => ({
                    date: d.date.toISOString().split('T')[0],
                    mucus: d.mucusObservation,
                    feeling: d.feeling,
                    isPeakDay: d.isPeakDay
                }))
            );

            if (!peakDay) {
                return { shouldCreate: false, reason: 'Chưa có ngày đỉnh (kiểm tra cả mucusObservation và isPeakDay)' };
            }

            console.log(`✅ [AUTO-CYCLE] Đã tìm thấy ngày đỉnh: ${peakDay.date.toISOString().split('T')[0]}`);


            // Kiểm tra xem đã có ít nhất 3 ngày sau đỉnh chưa
            const postPeakDays = cycleDays.filter(day =>
                day.date.getTime() > peakDay.date.getTime()
            ).sort((a, b) => a.date.getTime() - b.date.getTime());

            if (postPeakDays.length < 3) {
                return { shouldCreate: false, reason: 'Chưa đủ 3 ngày sau đỉnh' };
            }

            // Kiểm tra 3 ngày sau đỉnh có khô không
            const first3PostPeakDays = postPeakDays.slice(0, 3);
            console.log(`🔍 [AUTO-CYCLE] Kiểm tra 3 ngày sau đỉnh:`,
                first3PostPeakDays.map(d => ({
                    date: d.date.toISOString().split('T')[0],
                    mucus: d.mucusObservation,
                    feeling: d.feeling,
                    isDry: this.isDryDay(d.feeling, d.mucusObservation)
                }))
            );

            const hasAllDryDays = first3PostPeakDays.every(day =>
                this.isDryDay(day.feeling, day.mucusObservation)
            );

            if (!hasAllDryDays) {
                const notDryDays = first3PostPeakDays.filter(day => !this.isDryDay(day.feeling, day.mucusObservation));
                return {
                    shouldCreate: false,
                    reason: `3 ngày sau đỉnh chưa hoàn toàn khô. Ngày chưa khô: ${notDryDays.map(d => d.date.toISOString().split('T')[0]).join(', ')}`
                };
            }

            console.log(`✅ [AUTO-CYCLE] 3 ngày sau đỉnh đều khô`);


            // Kiểm tra ngày máu mới có sau 3 ngày khô không
            const day3AfterPeak = first3PostPeakDays[2];
            if (bloodDate.getTime() <= day3AfterPeak.date.getTime()) {
                return { shouldCreate: false, reason: 'Máu xuất hiện trước khi hoàn thành 3 ngày khô' };
            }

            // Kiểm tra có khoảng cách hợp lý không (ít nhất 1 ngày sau ngày khô thứ 3)
            const daysSinceLastDry = Math.ceil((bloodDate.getTime() - day3AfterPeak.date.getTime()) / (24 * 60 * 60 * 1000));
            if (daysSinceLastDry < 1) {
                return { shouldCreate: false, reason: 'Cần có ít nhất 1 ngày khoảng cách sau ngày khô thứ 3' };
            }

            // ✅ Đủ điều kiện tạo chu kỳ mới
            // Ngày kết thúc chu kỳ cũ = ngày trước khi có máu mới
            const endDate = new Date(bloodDate);
            endDate.setDate(endDate.getDate() - 1);

            return {
                shouldCreate: true,
                endDate: endDate,
                peakDay: peakDay.date,
                reason: 'Chu kỳ đã hoàn thành đủ điều kiện và có máu mới xuất hiện'
            };

        } catch (error) {
            console.error('Error checking for new cycle creation:', error);
            return { shouldCreate: false, reason: 'Lỗi khi phân tích chu kỳ' };
        }
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
            } else if (this.isDryDay(day.feeling, day.mucusObservation)) {
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
                this.isDryDay(day.feeling, day.mucusObservation)
            );

            // Xác định ngày đỉnh (peak day)
            const peakDay = peakDays.length > 0 ? peakDays[peakDays.length - 1] : null;

            // Phân tích mẫu chu kỳ
            const pattern = this.identifyCyclePattern(cycleDays);

            // Kiểm tra chu kỳ hoàn chỉnh theo phương pháp Billings chính xác
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
     * Kiểm tra chu kỳ có hoàn chỉnh không theo phương pháp Billings chính xác
     * 
     * Định nghĩa chu kỳ hoàn chỉnh:
     * 1. Bắt đầu: Cảm giác chất nhờn là máu (có máu)
     * 2. Tùy chọn: Lấm tấm máu  
     * 3. Ngày đỉnh: Cảm giác chất nhờn là trong và âm hộ căng
     * 4. Kết thúc: Cảm giác chất nhờn là khô (sau ít nhất 3 ngày sau đỉnh)
     * 
     * Trường hợp 1: Tất cả diễn ra trong 1 tháng (sau ngày 1,2,3 sau ngày đỉnh là khô → có máu mới)
     * Trường hợp 2: Lấn sang tháng sau (sau ngày 1,2,3 sau ngày đỉnh vẫn ít chất tiết chưa chuyển sang khô)
     */
    private checkCycleCompletion(cycleDays: any[], pattern: any): any {
        const sequence = cycleDays.map(day => ({
            date: new Date(day.date),
            mucus: day.mucusObservation,
            feeling: day.feeling,
            dayNumber: day.cycleDayNumber,
            month: day.month,
            year: day.year
        })).sort((a, b) => a.date.getTime() - b.date.getTime());

        // Bước 1: Tìm ngày bắt đầu có máu kinh nguyệt
        const bloodDays = sequence.filter(day => day.mucus === 'có máu');
        const firstBloodDay = bloodDays.length > 0 ? bloodDays[0] : null;

        // Bước 2: Tìm ngày đỉnh (trong và âm hộ căng)
        const peakDays = sequence.filter(day => day.mucus === 'trong và âm hộ căng');
        const peakDay = peakDays.length > 0 ? peakDays[peakDays.length - 1] : null; // Lấy ngày đỉnh cuối cùng

        if (!firstBloodDay) {
            return {
                isComplete: false,
                phase: 'waiting_for_menstruation',
                analysis: 'Chưa ghi nhận ngày đầu kinh nguyệt. Hãy ghi nhận khi có máu kinh nguyệt.'
            };
        }

        if (!peakDay) {
            return {
                isComplete: false,
                phase: 'pre_peak_tracking',
                analysis: 'Đã có kinh nguyệt, đang chờ ngày đỉnh (cảm giác chất nhờn là trong và âm hộ căng).'
            };
        }

        // Bước 3: Phân tích giai đoạn sau ngày đỉnh
        const postPeakDays = sequence.filter(day =>
            day.date.getTime() > peakDay.date.getTime()
        ).sort((a, b) => a.date.getTime() - b.date.getTime());

        // Tìm 3 ngày liên tiếp sau ngày đỉnh
        const dayAfterPeak1 = postPeakDays.find(day =>
            Math.abs(day.date.getTime() - peakDay.date.getTime()) <= 24 * 60 * 60 * 1000 * 1.5 &&
            day.date.getTime() > peakDay.date.getTime()
        );

        const dayAfterPeak2 = postPeakDays.find(day =>
            dayAfterPeak1 && Math.abs(day.date.getTime() - dayAfterPeak1.date.getTime()) <= 24 * 60 * 60 * 1000 * 1.5 &&
            day.date.getTime() > dayAfterPeak1.date.getTime()
        );

        const dayAfterPeak3 = postPeakDays.find(day =>
            dayAfterPeak2 && Math.abs(day.date.getTime() - dayAfterPeak2.date.getTime()) <= 24 * 60 * 60 * 1.5 &&
            day.date.getTime() > dayAfterPeak2.date.getTime()
        );

        // Kiểm tra xem có đủ 3 ngày sau đỉnh không
        if (!dayAfterPeak1 || !dayAfterPeak2 || !dayAfterPeak3) {
            const existingDays = [dayAfterPeak1, dayAfterPeak2, dayAfterPeak3].filter(d => d).length;
            return {
                isComplete: false,
                phase: 'post_peak_tracking',
                analysis: `Đã qua ngày đỉnh (${peakDay.date.toLocaleDateString('vi-VN')}). Cần theo dõi thêm ${3 - existingDays} ngày để hoàn thành chu kỳ.`,
                peakDay: peakDay,
                nextRequiredDays: 3 - existingDays
            };
        }

        // Bước 4: Kiểm tra trạng thái 3 ngày sau đỉnh
        const postPeakStatus = [dayAfterPeak1, dayAfterPeak2, dayAfterPeak3].map(day => ({
            date: day.date,
            isDry: this.isDryDay(day.feeling, day.mucus),
            mucus: day.mucus,
            feeling: day.feeling,
            month: day.month
        }));

        // Kiểm tra ngày thứ 3 sau đỉnh có khô không
        const day3AfterPeak = postPeakStatus[2];
        const isDay3Dry = day3AfterPeak.isDry;

        if (isDay3Dry) {
            // TRƯỜNG HỢP 1: Ngày 3 sau đỉnh đã khô
            // Kiểm tra xem có máu mới (chu kỳ tiếp theo) xuất hiện không
            const daysAfterDay3 = sequence.filter(day =>
                day.date.getTime() > day3AfterPeak.date.getTime()
            );

            const nextBloodDay = daysAfterDay3.find(day => day.mucus === 'có máu');

            if (nextBloodDay) {
                // Có máu mới xuất hiện → Chu kỳ hoàn chỉnh (Trường hợp 1)
                const cycleLength = Math.ceil((nextBloodDay.date.getTime() - firstBloodDay.date.getTime()) / (24 * 60 * 60 * 1000));

                return {
                    isComplete: true,
                    phase: 'completed_case_1',
                    analysis: `Chu kỳ hoàn chỉnh (Trường hợp 1 - trong cùng tháng). Ngày đỉnh: ${peakDay.date.toLocaleDateString('vi-VN')}. Chu kỳ dài ${cycleLength} ngày. Ngày 3 sau đỉnh đã khô và có máu mới xuất hiện.`,
                    cycleType: 'same_month_completion',
                    peakDay: peakDay,
                    cycleLength: cycleLength,
                    nextCycleStart: nextBloodDay.date
                };
            } else {
                // Chưa có máu mới, cần chờ thêm để xác định
                return {
                    isComplete: false,
                    phase: 'waiting_for_next_menstruation',
                    analysis: `Đã qua ngày đỉnh và 3 ngày sau đỉnh đã khô. Đang chờ kinh nguyệt chu kỳ tiếp theo để hoàn thành chu kỳ hiện tại.`,
                    peakDay: peakDay,
                    postPeakDryDays: 3,
                    waitingFor: 'next_menstruation'
                };
            }
        } else {
            // TRƯỜNG HỢP 2: Ngày 3 sau đỉnh vẫn chưa khô (ít chất tiết)
            // Kiểm tra xem có lấn sang tháng sau không
            const day3Month = day3AfterPeak.month;
            const peakMonth = peakDay.month;

            if (day3Month > peakMonth || (day3Month === 1 && peakMonth === 12)) {
                // Đã lấn sang tháng sau và vẫn chưa khô
                // Cần tiếp tục theo dõi để chuyển sang trạng thái khô
                const daysAfterDay3 = sequence.filter(day =>
                    day.date.getTime() > day3AfterPeak.date.getTime()
                );

                const firstDryDayAfter = daysAfterDay3.find(day =>
                    this.isDryDay(day.feeling, day.mucus)
                );

                if (firstDryDayAfter) {
                    // Đã tìm thấy ngày khô đầu tiên sau khi lấn sang tháng mới
                    const additionalDays = Math.ceil((firstDryDayAfter.date.getTime() - day3AfterPeak.date.getTime()) / (24 * 60 * 60 * 1000));

                    return {
                        isComplete: false,
                        phase: 'cross_month_drying',
                        analysis: `Trường hợp 2 - Lấn sang tháng sau. Ngày 3 sau đỉnh vẫn có ít chất tiết. Đã tìm thấy ngày khô đầu tiên sau ${additionalDays} ngày. Cần theo dõi thêm để xác nhận hoàn thành chu kỳ.`,
                        cycleType: 'cross_month_drying',
                        peakDay: peakDay,
                        firstDryDay: firstDryDayAfter.date,
                        additionalDaysNeeded: additionalDays
                    };
                } else {
                    // Vẫn chưa khô, cần tiếp tục theo dõi
                    return {
                        isComplete: false,
                        phase: 'extended_post_peak_tracking',
                        analysis: `Trường hợp 2 - Lấn sang tháng sau. Ngày 3 sau đỉnh vẫn có ít chất tiết. Cần tiếp tục theo dõi đến khi chuyển sang trạng thái khô.`,
                        cycleType: 'cross_month_incomplete',
                        peakDay: peakDay,
                        currentStatus: 'still_secreting',
                        instruction: 'Tiếp tục theo dõi hàng ngày đến khi có cảm giác khô'
                    };
                }
            } else {
                // Vẫn trong cùng tháng nhưng chưa khô
                return {
                    isComplete: false,
                    phase: 'post_peak_not_dry',
                    analysis: `Đã qua ngày đỉnh nhưng ngày thứ 3 sau đỉnh vẫn chưa khô (${day3AfterPeak.mucus || day3AfterPeak.feeling}). Cần tiếp tục theo dõi.`,
                    peakDay: peakDay,
                    day3Status: day3AfterPeak,
                    instruction: 'Tiếp tục theo dõi đến khi có cảm giác khô'
                };
            }
        }
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

    /**
     * Xác định ngày có phải là ngày khô không
     * Ngày khô bao gồm:
     * - feeling === 'khô' 
     * - mucusObservation === 'ít chất tiết'
     * - Cả hai đều undefined (không có ghi nhận = khô)
     */
    private isDryDay(feeling?: string, mucusObservation?: string): boolean {
        // Trường hợp rõ ràng là khô
        if (feeling === 'khô' || mucusObservation === 'ít chất tiết') {
            return true;
        }

        // Trường hợp không có ghi nhận gì (undefined) - coi như khô
        if (!feeling && !mucusObservation) {
            return true;
        }

        // Trường hợp có ghi nhận nhưng không phải khô
        return false;
    }

    /**
     * Tái sắp xếp cycle numbers sau khi xóa chu kỳ
     * Đảm bảo cycle numbers liên tục: 1, 2, 3, 4...
     */
    async reorderCycleNumbers(userId: string): Promise<void> {
        try {
            // Lấy tất cả chu kỳ của user, sắp xếp theo startDate
            const cycles = await MenstrualCycles.find({ createdByUserId: userId })
                .sort({ startDate: 1 });

            const bulkOps = cycles.map((cycle, index) => ({
                updateOne: {
                    filter: { _id: cycle._id },
                    update: { cycleNumber: index + 1 }
                }
            }));

            if (bulkOps.length > 0) {
                await MenstrualCycles.bulkWrite(bulkOps);
                console.log(`✅ Reordered ${bulkOps.length} cycles for user ${userId}`);
            }
        } catch (error) {
            console.error('Error reordering cycle numbers:', error);
            throw error;
        }
    }

    /**
     * Khôi phục chu kỳ bị xóa nhầm bằng cách tạo lại từ cycle days
     * Tìm các cycle days không thuộc cycle nào và tạo chu kỳ mới cho chúng
     */
    async recoverOrphanedCycleDays(userId: string): Promise<any> {
        try {
            // Tìm tất cả cycle days của user
            const allCycleDays = await CycleDays.find({})
                .populate({
                    path: 'cycleId',
                    match: { createdByUserId: userId }
                });

            // Lọc ra các cycle days thuộc về user nhưng cycle đã bị xóa
            const orphanedDays = allCycleDays.filter(day =>
                day.cycleId === null || day.cycleId === undefined
            );

            if (orphanedDays.length === 0) {
                return { recovered: false, message: 'Không tìm thấy dữ liệu bị mất' };
            }

            // Nhóm các ngày theo tháng và tìm ngày bắt đầu tiềm năng
            const groupedByMonth = orphanedDays.reduce((groups, day) => {
                const month = `${day.year}-${day.month.toString().padStart(2, '0')}`;
                if (!groups[month]) groups[month] = [];
                groups[month].push(day);
                return groups;
            }, {} as Record<string, any[]>);

            const recoveredCycles = [];

            for (const [monthKey, monthDays] of Object.entries(groupedByMonth)) {
                // Sắp xếp theo ngày
                monthDays.sort((a, b) => a.date.getTime() - b.date.getTime());

                // Tìm ngày đầu có máu hoặc ngày đầu tiên
                const startDay = monthDays.find(day =>
                    day.mucusObservation === 'có máu' ||
                    day.mucusObservation === 'lấm tấm máu'
                ) || monthDays[0];

                // Tạo chu kỳ mới
                const newCycle = await this.createCycle(userId, startDay.date);

                // Cập nhật tất cả cycle days trong tháng này về chu kỳ mới
                await CycleDays.updateMany(
                    { _id: { $in: monthDays.map(d => d._id) } },
                    { cycleId: newCycle._id }
                );

                // Tính lại cycle day numbers
                await this.recalculateAllCycleDays(newCycle._id.toString(), startDay.date);

                recoveredCycles.push({
                    cycleNumber: newCycle.cycleNumber,
                    startDate: startDay.date,
                    recoveredDays: monthDays.length
                });
            }

            // Tái sắp xếp cycle numbers
            await this.reorderCycleNumbers(userId);

            return {
                recovered: true,
                message: `Đã khôi phục ${recoveredCycles.length} chu kỳ`,
                cycles: recoveredCycles
            };

        } catch (error) {
            console.error('Error recovering orphaned cycle days:', error);
            throw error;
        }
    }

    /**
     * Tính toán result theo công thức Billings
     * Result = (Ngày X + 1) - Ngày Y
     * X: ngày đỉnh, Y: 1 ngày trước khi có máu của chu kỳ tiếp theo
     */
    async calculateCycleResult(cycleId: string): Promise<{
        peakDayX?: number;
        dayXPlus1?: number;
        dayY?: number;
        result?: number;
        status: 'normal' | 'short' | 'long' | 'incomplete';
        message: string;
        nextCycleId?: string;
    }> {
        try {
            const cycle = await MenstrualCycles.findById(cycleId);
            if (!cycle) {
                throw new Error('Cycle not found');
            }

            // Tìm ngày X (ngày đỉnh)
            const cycleDays = await CycleDays.find({ cycleId })
                .sort({ date: 1 })
                .lean();

            const peakDay = cycleDays.find(day =>
                day.mucusObservation === 'trong và âm hộ căng' && day.feeling === 'trơn'
            );

            if (!peakDay) {
                return {
                    status: 'incomplete',
                    message: 'Chưa xác định được ngày đỉnh (X) trong chu kỳ này'
                };
            }

            const peakDayX = peakDay.cycleDayNumber;
            const dayXPlus1 = peakDayX! + 1;

            // Tìm chu kỳ tiếp theo
            const nextCycle = await MenstrualCycles.findOne({
                createdByUserId: cycle.createdByUserId,
                cycleNumber: cycle.cycleNumber + 1
            });

            if (!nextCycle) {
                return {
                    peakDayX,
                    dayXPlus1,
                    status: 'incomplete',
                    message: 'Chưa có chu kỳ tiếp theo để tính toán result'
                };
            }

            // Tìm ngày đầu có máu của chu kỳ tiếp theo
            const nextCycleDays = await CycleDays.find({ cycleId: nextCycle._id })
                .sort({ date: 1 })
                .lean();

            const firstBloodDay = nextCycleDays.find(day =>
                day.mucusObservation === 'có máu'
            );

            if (!firstBloodDay) {
                return {
                    peakDayX,
                    dayXPlus1,
                    status: 'incomplete',
                    message: 'Chưa có dữ liệu máu kinh nguyệt của chu kỳ tiếp theo'
                };
            }

            // Tính dayY = 1 ngày trước ngày có máu của chu kỳ tiếp theo
            // Vì chu kỳ mới bắt đầu từ ngày có máu, dayY sẽ là ngày cuối của chu kỳ hiện tại
            const dayY = firstBloodDay.cycleDayNumber! - 1;

            // Tính result = (X + 1) - Y
            const result = dayXPlus1 - dayY;

            // Xác định trạng thái dựa trên result
            let status: 'normal' | 'short' | 'long' | 'incomplete';
            let message: string;

            // Kiểm tra trường hợp đặc biệt: sau ngày X có cảm giác "khô" và không có "dầy"
            const postPeakDays = cycleDays.filter(day =>
                day.cycleDayNumber! > peakDayX! &&
                day.cycleDayNumber! <= peakDayX! + 3
            );

            const hasDryAfterPeak = postPeakDays.some(day =>
                day.feeling === 'khô' && day.mucusObservation !== 'dầy'
            );

            if (hasDryAfterPeak) {
                status = 'short';
                message = 'Chu kỳ ngắn - có cảm giác "khô" sau ngày X mà không có quan sát "dầy"';
            } else if ((result >= -16 && result <= -11) || (result >= 11 && result <= 16)) {
                status = 'normal';
                message = `Chu kỳ bình thường (result = ${result})`;
            } else if (Math.abs(result) < 11) {
                status = 'short';
                message = `Chu kỳ ngắn (result = ${result})`;
            } else if (Math.abs(result) > 16) {
                status = 'long';
                message = `Chu kỳ dài (result = ${result})`;
            } else {
                status = 'normal';
                message = `Chu kỳ bình thường (result = ${result})`;
            }

            return {
                peakDayX,
                dayXPlus1,
                dayY,
                result,
                status,
                message,
                nextCycleId: nextCycle._id.toString()
            };

        } catch (error) {
            console.error('Error calculating cycle result:', error);
            throw error;
        }
    }

    /**
     * Lấy báo cáo chi tiết cho 1 chu kỳ
     */
    async getDetailedCycleReport(cycleId: string): Promise<any> {
        try {
            const cycle = await MenstrualCycles.findById(cycleId);
            if (!cycle) {
                throw new Error('Cycle not found');
            }

            const cycleDays = await CycleDays.find({ cycleId })
                .sort({ date: 1 })
                .lean();

            // Tạo chart data
            const chartData = cycleDays.map(day => {
                let symbol = '';
                let fertilityProbability = 0;

                if (day.mucusObservation === 'có máu' || day.mucusObservation === 'lấm tấm máu') {
                    symbol = 'M';
                    fertilityProbability = 10;
                } else if (day.isPeakDay || (day.mucusObservation === 'trong và âm hộ căng' && day.feeling === 'trơn')) {
                    symbol = 'X';
                    fertilityProbability = 100;
                } else if (day.peakDayRelative === 1) {
                    symbol = '1';
                    fertilityProbability = 75;
                } else if (day.peakDayRelative === 2) {
                    symbol = '2';
                    fertilityProbability = 50;
                } else if (day.peakDayRelative === 3) {
                    symbol = '3';
                    fertilityProbability = 20;
                } else if (day.mucusObservation === 'đục' || day.mucusObservation === 'đục nhiều sợi' || day.mucusObservation === 'trong nhiều sợi') {
                    symbol = 'C';
                    fertilityProbability = 60;
                } else if (this.isDryDay(day.feeling, day.mucusObservation)) {
                    symbol = 'D';
                    fertilityProbability = 5;
                } else {
                    symbol = 'S';
                    fertilityProbability = 15;
                }

                return {
                    date: day.date.toISOString().split('T')[0],
                    dayNumber: day.cycleDayNumber || 0,
                    mucusObservation: day.mucusObservation,
                    feeling: day.feeling,
                    symbol,
                    fertilityProbability,
                    isPeakDay: day.isPeakDay || false
                };
            });

            // Tính toán result
            const resultCalculation = await this.calculateCycleResult(cycleId);

            // Thống kê
            const statistics = {
                totalDays: cycleDays.length,
                peakDay: cycleDays.find(d => d.isPeakDay || (d.mucusObservation === 'trong và âm hộ căng' && d.feeling === 'trơn'))?.cycleDayNumber,
                fertileDays: chartData.filter(d => d.fertilityProbability >= 60).length,
                dryDays: chartData.filter(d => d.symbol === 'D').length
            };

            return {
                cycle,
                chartData,
                resultCalculation,
                statistics
            };

        } catch (error) {
            console.error('Error getting detailed cycle report:', error);
            throw error;
        }
    }

    /**
     * So sánh 3 chu kỳ gần nhất và đánh giá sức khỏe
     */
    async getThreeCycleComparison(userId: string): Promise<any> {
        try {
            const cycles = await MenstrualCycles.find({ createdByUserId: userId })
                .sort({ cycleNumber: -1 })
                .limit(3)
                .lean();

            if (cycles.length < 3) {
                return {
                    cycles: [],
                    pattern: {
                        averageLength: 0,
                        averageResult: 0,
                        consistency: 'insufficient_data',
                        trend: 'insufficient_data'
                    },
                    healthAssessment: {
                        overall: 'needs_attention',
                        message: 'Cần ít nhất 3 chu kỳ hoàn chỉnh để thực hiện phân tích so sánh chính xác',
                        recommendations: ['Tiếp tục theo dõi chu kỳ đều đặn', 'Ghi nhận đầy đủ dữ liệu hàng ngày']
                    }
                };
            }

            const cycleResults = [];
            const results: number[] = [];
            const lengths: number[] = [];

            for (const cycle of cycles.reverse()) { // Sắp xếp lại theo thứ tự thời gian
                const result = await this.calculateCycleResult(cycle._id.toString());
                const length = cycle.endDate ?
                    Math.ceil((cycle.endDate.getTime() - cycle.startDate.getTime()) / (24 * 60 * 60 * 1000)) :
                    undefined;

                cycleResults.push({
                    cycleNumber: cycle.cycleNumber,
                    startDate: cycle.startDate.toISOString().split('T')[0],
                    endDate: cycle.endDate?.toISOString().split('T')[0],
                    peakDay: result.peakDayX,
                    result: result.result,
                    status: result.status,
                    length
                });

                if (result.result !== undefined) {
                    results.push(result.result);
                }
                if (length !== undefined) {
                    lengths.push(length);
                }
            }

            // Tính toán pattern
            const averageLength = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 28;
            const averageResult = results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0;

            // Xác định consistency
            let consistency: 'stable' | 'variable' | 'irregular';
            if (results.length >= 3) {
                const variance = results.reduce((acc, val) => acc + Math.pow(val - averageResult, 2), 0) / results.length;
                if (variance <= 4) {
                    consistency = 'stable';
                } else if (variance <= 16) {
                    consistency = 'variable';
                } else {
                    consistency = 'irregular';
                }
            } else {
                consistency = 'variable';
            }

            // Xác định trend
            let trend: 'normal' | 'getting_shorter' | 'getting_longer';
            if (lengths.length >= 3) {
                const firstHalf = lengths.slice(0, Math.floor(lengths.length / 2));
                const secondHalf = lengths.slice(Math.ceil(lengths.length / 2));
                const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
                const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

                if (secondAvg - firstAvg > 3) {
                    trend = 'getting_longer';
                } else if (firstAvg - secondAvg > 3) {
                    trend = 'getting_shorter';
                } else {
                    trend = 'normal';
                }
            } else {
                trend = 'normal';
            }

            // Health assessment
            const healthAssessment = this.assessHealth(cycleResults, consistency, trend, averageResult);

            return {
                cycles: cycleResults,
                pattern: {
                    averageLength,
                    averageResult,
                    consistency,
                    trend
                },
                healthAssessment
            };

        } catch (error) {
            console.error('Error in three cycle comparison:', error);
            throw error;
        }
    }

    /**
     * Đánh giá sức khỏe dựa trên pattern chu kỳ
     */
    private assessHealth(cycleResults: any[], consistency: string, trend: string, averageResult: number): any {
        let overall: 'healthy' | 'needs_attention' | 'consult_doctor';
        let message: string;
        const recommendations: string[] = [];

        // Đếm số chu kỳ bình thường
        const normalCycles = cycleResults.filter(c => c.status === 'normal').length;
        const shortCycles = cycleResults.filter(c => c.status === 'short').length;
        const longCycles = cycleResults.filter(c => c.status === 'long').length;

        if (normalCycles >= 2 && consistency === 'stable') {
            overall = 'healthy';
            message = 'Chu kỳ kinh nguyệt bình thường và ổn định. Tiếp tục duy trì lối sống lành mạnh.';
            recommendations.push('Tiếp tục theo dõi đều đặn');
            recommendations.push('Duy trì chế độ ăn uống và tập luyện cân bằng');
        } else if (shortCycles >= 2 || longCycles >= 2) {
            overall = 'consult_doctor';
            message = 'Phát hiện nhiều chu kỳ bất thường. Nên tham khảo ý kiến bác sĩ chuyên khoa.';
            recommendations.push('Đặt lịch khám với bác sĩ phụ khoa');
            recommendations.push('Tiếp tục theo dõi chi tiết để cung cấp thông tin cho bác sĩ');
        } else if (consistency === 'irregular') {
            overall = 'needs_attention';
            message = 'Chu kỳ không đều đặn. Cần theo dõi thêm và điều chỉnh lối sống.';
            recommendations.push('Giảm stress và đảm bảo giấc ngủ đủ');
            recommendations.push('Cân nhắc điều chỉnh chế độ ăn uống');
            recommendations.push('Theo dõi thêm 2-3 chu kỳ nữa');
        } else {
            overall = 'needs_attention';
            message = 'Chu kỳ cần được theo dõi thêm để đánh giá chính xác.';
            recommendations.push('Tiếp tục ghi nhận dữ liệu đầy đủ');
            recommendations.push('Theo dõi thêm ít nhất 2 chu kỳ nữa');
        }

        return {
            overall,
            message,
            recommendations
        };
    }

    /**
     * Tự động sửa chữa dữ liệu chu kỳ bị lỗi
     */
    async autoFixCycleData(userId: string): Promise<any> {
        try {
            const fixes = [];

            // 1. Khôi phục cycle days bị mất
            const recoveryResult = await this.recoverOrphanedCycleDays(userId);
            if (recoveryResult.recovered) {
                fixes.push(recoveryResult);
            }

            // 2. Tái sắp xếp cycle numbers
            await this.reorderCycleNumbers(userId);
            fixes.push({ action: 'reorder', message: 'Đã sắp xếp lại số thứ tự chu kỳ' });

            // 3. Kiểm tra và sửa cycle days không có cycleId hợp lệ
            const invalidCycleDays = await CycleDays.find({})
                .populate({
                    path: 'cycleId',
                    match: { createdByUserId: userId }
                });

            let fixedDays = 0;
            for (const day of invalidCycleDays) {
                if (!day.cycleId) {
                    // Tìm chu kỳ phù hợp dựa trên ngày
                    const nearestCycle = await MenstrualCycles.findOne({
                        createdByUserId: userId,
                        startDate: { $lte: day.date }
                    }).sort({ startDate: -1 });

                    if (nearestCycle) {
                        day.cycleId = nearestCycle._id as any;
                        await day.save();
                        fixedDays++;
                    }
                }
            }

            if (fixedDays > 0) {
                fixes.push({ action: 'fix_days', message: `Đã sửa ${fixedDays} ngày bị lỗi` });
            }

            return {
                success: true,
                fixes: fixes,
                message: `Đã thực hiện ${fixes.length} sửa chữa dữ liệu`
            };

        } catch (error) {
            console.error('Error in autoFixCycleData:', error);
            throw error;
        }
    }

    /**
     * Validation thông minh trước khi lưu dữ liệu ngày
     * Kiểm tra tính hợp lý theo phương pháp Billings
     */
    async validateCycleDayInput(cycleId: string, date: Date, mucusObservation?: string, feeling?: string): Promise<{
        isValid: boolean;
        warnings: string[];
        errors: string[];
        suggestions: string[];
    }> {
        try {
            const warnings: string[] = [];
            const errors: string[] = [];
            const suggestions: string[] = [];

            // 1. Kiểm tra ngày đỉnh trùng lặp trong chu kỳ
            if (mucusObservation === 'trong và âm hộ căng' && feeling === 'trơn') {
                const existingPeakDays = await CycleDays.find({
                    cycleId,
                    mucusObservation: 'trong và âm hộ căng',
                    feeling: 'trơn',
                    date: { $ne: date }
                });

                if (existingPeakDays.length > 0) {
                    const existingDate = existingPeakDays[0].date.toLocaleDateString('vi-VN');
                    errors.push(`Ngày đỉnh đã tồn tại trong chu kỳ này (${existingDate}). Mỗi chu kỳ chỉ có 1 ngày đỉnh duy nhất.`);
                    suggestions.push('Nếu bạn muốn thay đổi ngày đỉnh, hãy xóa ngày đỉnh cũ trước.');
                    suggestions.push('Hoặc đây có thể là chu kỳ mới cần được tạo tự động.');
                }
            }

            // 2. Kiểm tra nhiều ngày có máu rời rạc
            if (mucusObservation === 'có máu') {
                const cycleDays = await CycleDays.find({ cycleId }).sort({ date: 1 });
                const bloodDays = cycleDays.filter(d => d.mucusObservation === 'có máu');

                if (bloodDays.length > 0) {
                    const lastBloodDay = bloodDays[bloodDays.length - 1];
                    const daysBetween = Math.abs((date.getTime() - lastBloodDay.date.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysBetween > 7) {
                        warnings.push(`Có khoảng cách ${Math.round(daysBetween)} ngày kể từ ngày có máu cuối cùng. Đây có thể là chu kỳ mới.`);
                        suggestions.push('Xem xét việc tạo chu kỳ mới nếu chu kỳ hiện tại đã hoàn thành.');
                    }
                }
            }

            // 3. Kiểm tra logic thứ tự theo Billings
            const cycleDays = await CycleDays.find({ cycleId }).sort({ date: 1 });
            const futureEntries = cycleDays.filter(d => d.date > date);

            if (mucusObservation === 'có máu' && futureEntries.length > 0) {
                const hasPeakAfter = futureEntries.some(d =>
                    d.mucusObservation === 'trong và âm hộ căng' && d.feeling === 'trơn'
                );

                if (hasPeakAfter) {
                    warnings.push('Bạn đang thêm ngày có máu sau ngày đỉnh. Điều này có thể chỉ ra chu kỳ mới.');
                    suggestions.push('Kiểm tra xem có cần tạo chu kỳ mới không.');
                }
            }

            // 4. Kiểm tra tính nhất quán của mucus và feeling
            if (mucusObservation && feeling) {
                const rules = MUCUS_FEELING_RULES;
                const allowedFeelings = rules[mucusObservation as keyof typeof rules] || [];

                if (allowedFeelings.length > 0 && !allowedFeelings.includes(feeling)) {
                    errors.push(`Cảm giác "${feeling}" không phù hợp với quan sát "${mucusObservation}" theo phương pháp Billings.`);
                    suggestions.push(`Cảm giác phù hợp: ${allowedFeelings.join(', ')}`);
                }
            }

            // 5. Kiểm tra chu kỳ quá dài
            const cycle = await MenstrualCycles.findById(cycleId);
            if (cycle) {
                const daysSinceStart = Math.ceil((date.getTime() - cycle.startDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysSinceStart > 45) {
                    warnings.push(`Chu kỳ đã kéo dài ${daysSinceStart} ngày, dài hơn bình thường (21-35 ngày).`);
                    suggestions.push('Cân nhắc tham khảo ý kiến bác sĩ về chu kỳ bất thường.');
                }
            }

            return {
                isValid: errors.length === 0,
                warnings,
                errors,
                suggestions
            };

        } catch (error) {
            console.error('Error in validateCycleDayInput:', error);
            return {
                isValid: false,
                warnings: [],
                errors: ['Lỗi hệ thống khi kiểm tra dữ liệu'],
                suggestions: []
            };
        }
    }
}

export default new MenstrualCycleService();
