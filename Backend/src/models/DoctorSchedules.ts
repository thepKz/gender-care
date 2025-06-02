import mongoose from 'mongoose';

// Interface cho TimeSlots (embedded document)
export interface ITimeSlots {
  slotTime: string;
  isBooked: boolean;
}

// Interface cho weekScheduleObject (embedded document) 
export interface IWeekScheduleObject {
  dayOfWeek: Date; // Đã sửa từ String thành Date như yêu cầu
  slots: ITimeSlots[];
}

// Interface chính cho DoctorSchedules
export interface IDoctorSchedules {
  doctorId: mongoose.Types.ObjectId;
  weekSchedule: IWeekScheduleObject[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema cho TimeSlots
const TimeSlotsSchema = new mongoose.Schema<ITimeSlots>({
  slotTime: { 
    type: String, 
    required: true 
  },
  isBooked: { 
    type: Boolean, 
    default: false 
  }
}, { _id: true });

// Schema cho weekScheduleObject
const WeekScheduleObjectSchema = new mongoose.Schema<IWeekScheduleObject>({
  dayOfWeek: { 
    type: Date, // Đã sửa từ String thành Date
    required: true 
  },
  slots: [TimeSlotsSchema]
}, { _id: true });

// Schema chính cho DoctorSchedules
const DoctorSchedulesSchema = new mongoose.Schema<IDoctorSchedules>({
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  weekSchedule: [WeekScheduleObjectSchema]
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
DoctorSchedulesSchema.index({ doctorId: 1 });
DoctorSchedulesSchema.index({ 'weekSchedule.dayOfWeek': 1 });

const DoctorSchedules = mongoose.model<IDoctorSchedules>('DoctorSchedules', DoctorSchedulesSchema);

export default DoctorSchedules; 