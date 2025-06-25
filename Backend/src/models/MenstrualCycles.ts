import mongoose from 'mongoose';

export interface IMenstrualCycles {
  _id?: string;
  createdByUserId: mongoose.Types.ObjectId;
  profileId?: mongoose.Types.ObjectId; // Optional để tương thích
  startDate: Date;
  endDate?: Date;
  isCompleted: boolean;
  cycleNumber: number; // Thứ tự chu kỳ: 1, 2, 3...
  result?: number; // X+1 - Y
  resultType?: string; // "normal", "short", "long"
  peakDay?: Date; // ngày X (ngày đỉnh)
  status: string; // "tracking", "completed", "analysis"
  createdAt?: Date;
  updatedAt?: Date;
}

const MenstrualCyclesSchema = new mongoose.Schema<IMenstrualCycles>({
  createdByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfiles'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  cycleNumber: {
    type: Number,
    required: true,
    min: 1
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
  peakDay: {
    type: Date
  },
  status: {
    type: String,
    enum: ['tracking', 'completed', 'analysis'],
    default: 'tracking'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes để tối ưu hóa truy vấn
MenstrualCyclesSchema.index({ createdByUserId: 1, cycleNumber: 1 });
MenstrualCyclesSchema.index({ createdByUserId: 1, startDate: 1 });
MenstrualCyclesSchema.index({ createdByUserId: 1, status: 1 });

// Virtual để lấy cycle days
MenstrualCyclesSchema.virtual('cycleDays', {
  ref: 'CycleDays',
  localField: '_id',
  foreignField: 'cycleId'
});

const MenstrualCycles = mongoose.model<IMenstrualCycles>('MenstrualCycles', MenstrualCyclesSchema);

export default MenstrualCycles; 