import mongoose from "mongoose";

export interface ITimeSlot {
    _id?: mongoose.Types.ObjectId;
    slotTime: string;
    isBooked: boolean;
}

export interface IWeekSchedule {
    _id?: mongoose.Types.ObjectId;
    dayOfWeek: string;
    slots: ITimeSlot[];
}

export interface IDoctorSchedule {
    doctorId: mongoose.Types.ObjectId;
    weekSchedule: IWeekSchedule[];
    createdAt?: Date;
    updatedAt?: Date;
}

const timeSlotSchema = new mongoose.Schema<ITimeSlot>({
    slotTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false }
});

const weekScheduleSchema = new mongoose.Schema<IWeekSchedule>({
    dayOfWeek: {
        type: String,
        required: true,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    },
    slots: [timeSlotSchema]
});

const doctorScheduleSchema = new mongoose.Schema<IDoctorSchedule>(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
            unique: true
        },
        weekSchedule: [weekScheduleSchema]
    },
    { timestamps: true }
);

// Tạo index để tối ưu hóa truy vấn
doctorScheduleSchema.index({ doctorId: 1 });
doctorScheduleSchema.index({ "weekSchedule.dayOfWeek": 1 });

const DoctorSchedule = mongoose.model<IDoctorSchedule>("DoctorSchedule", doctorScheduleSchema);

export default DoctorSchedule; 