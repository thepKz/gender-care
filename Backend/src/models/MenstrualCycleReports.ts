import mongoose from 'mongoose';

export interface IMenstrualCycleReports {
    _id?: string;
    cycleId: mongoose.Types.ObjectId;
    x?: Date; // ngày X (đỉnh)
    xPlusOne?: Date; // ngày sau đỉnh (X+1)
    y?: Date; // ngày trước ngày có máu kế tiếp
    result?: number; // X+1 - Y
    resultType?: string; // "normal", "short", "long"
    predictedFertilityPhase?: string; // mô tả dự đoán ("chu kỳ bình thường", ...)
    possibleShortCyclePattern?: boolean; // true nếu phát hiện "khô" sau X mà không có "dầy"
    analysis?: {
        peakDayDetected: boolean;
        postPeakDaysAnalyzed: number;
        fertilityWindowStart?: Date;
        fertilityWindowEnd?: Date;
        nextCyclePrediction?: Date;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

const MenstrualCycleReportsSchema = new mongoose.Schema<IMenstrualCycleReports>({
    cycleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenstrualCycles',
        required: true,
        unique: true // Mỗi cycle chỉ có 1 report
    },
    x: {
        type: Date
    },
    xPlusOne: {
        type: Date
    },
    y: {
        type: Date
    },
    result: {
        type: Number,
        min: -50,
        max: 50
    },
    resultType: {
        type: String,
        enum: ['normal', 'short', 'long'],
        default: null
    },
    predictedFertilityPhase: {
        type: String,
        trim: true,
        maxlength: 200
    },
    possibleShortCyclePattern: {
        type: Boolean,
        default: false
    },
    analysis: {
        peakDayDetected: {
            type: Boolean,
            default: false
        },
        postPeakDaysAnalyzed: {
            type: Number,
            default: 0,
            min: 0
        },
        fertilityWindowStart: {
            type: Date
        },
        fertilityWindowEnd: {
            type: Date
        },
        nextCyclePrediction: {
            type: Date
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes để tối ưu hóa truy vấn
MenstrualCycleReportsSchema.index({ cycleId: 1 }, { unique: true });
MenstrualCycleReportsSchema.index({ resultType: 1 });
MenstrualCycleReportsSchema.index({ 'analysis.peakDayDetected': 1 });

// Virtual để tính cycle length
MenstrualCycleReportsSchema.virtual('cycleLength').get(function () {
    if (this.x && this.y) {
        const diffTime = Math.abs(this.y.getTime() - this.x.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
});

// Pre-save middleware để tự động tính toán result
MenstrualCycleReportsSchema.pre('save', function (next) {
    if (this.xPlusOne && this.y) {
        const diffTime = this.y.getTime() - this.xPlusOne.getTime();
        this.result = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Tự động xác định resultType
        if (this.result >= -16 && this.result <= -11) {
            this.resultType = 'normal';
        } else if (this.result >= 11 && this.result <= 16) {
            this.resultType = 'normal';
        } else if (this.result < 11 && this.result > -11) {
            this.resultType = 'short';
        } else {
            this.resultType = 'long';
        }
    }

    next();
});

const MenstrualCycleReports = mongoose.model<IMenstrualCycleReports>('MenstrualCycleReports', MenstrualCycleReportsSchema);

export default MenstrualCycleReports; 