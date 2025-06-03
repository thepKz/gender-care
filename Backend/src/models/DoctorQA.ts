import mongoose from 'mongoose';

export interface IDoctorQA {
  doctorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  notes?: string;
  question: string;
  status: "pending_payment" | "paid" | "doctor_confirmed" | "scheduled" | "consulting" | "completed" | "cancelled";
  consultationFee: number;
  appointmentDate?: Date;
  appointmentSlot?: string;  // VD: "14:00-15:00"
  slotId?: mongoose.Types.ObjectId;  // ID của slot đã book
  doctorNotes?: string;  // Ghi chú của doctor sau khi tư vấn
  createdAt?: Date;
  updatedAt?: Date;
}

const DoctorQASchema = new mongoose.Schema<IDoctorQA>({
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  notes: { 
    type: String 
  },
  question: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending_payment", "paid", "doctor_confirmed", "scheduled", "consulting", "completed", "cancelled"],
    default: "pending_payment" 
  },
  consultationFee: {
    type: Number,
    required: true,
    default: 200000  // 200k VND cố định
  },
  appointmentDate: {
    type: Date
  },
  appointmentSlot: {
    type: String  // VD: "14:00-15:00"
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId  // ID của slot đã book trong DoctorSchedules
  },
  doctorNotes: {
    type: String  // Ghi chú của doctor sau khi tư vấn
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
DoctorQASchema.index({ doctorId: 1 });
DoctorQASchema.index({ userId: 1 });
DoctorQASchema.index({ status: 1 });
DoctorQASchema.index({ createdAt: -1 });
DoctorQASchema.index({ appointmentDate: 1 });

const DoctorQA = mongoose.model<IDoctorQA>('DoctorQA', DoctorQASchema);

export default DoctorQA; 