import mongoose from 'mongoose';

export interface IMenstrualCycleReminders {
    _id?: string;
    userId: mongoose.Types.ObjectId;
    reminderEnabled: boolean;
    reminderTime: string; // định dạng "HH:mm", ví dụ "20:00"
    lastNotifiedAt?: Date; // thời điểm gần nhất đã gửi nhắc nhở
    createdAt?: Date;
    updatedAt?: Date;
}

const MenstrualCycleRemindersSchema = new mongoose.Schema<IMenstrualCycleReminders>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Mỗi user chỉ có 1 setting reminder
    },
    reminderEnabled: {
        type: Boolean,
        default: true
    },
    reminderTime: {
        type: String,
        required: true,
        default: "20:00",
        validate: {
            validator: function (v: string) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Định dạng thời gian phải là HH:mm (ví dụ: 20:00)'
        }
    },
    lastNotifiedAt: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes để tối ưu hóa truy vấn
MenstrualCycleRemindersSchema.index({ userId: 1 }, { unique: true });
MenstrualCycleRemindersSchema.index({ reminderEnabled: 1, reminderTime: 1 });

// Virtual để parse reminder time
MenstrualCycleRemindersSchema.virtual('reminderHour').get(function () {
    return parseInt(this.reminderTime.split(':')[0]);
});

MenstrualCycleRemindersSchema.virtual('reminderMinute').get(function () {
    return parseInt(this.reminderTime.split(':')[1]);
});

const MenstrualCycleReminders = mongoose.model<IMenstrualCycleReminders>('MenstrualCycleReminders', MenstrualCycleRemindersSchema);

export default MenstrualCycleReminders; 