import mongoose from 'mongoose';

export interface IDoctorQA {
  doctorId?: mongoose.Types.ObjectId;  // 🔧 Made optional để cho phép auto-assign
  userId: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  notes?: string;
  question: string;
  // ✅ SIMPLIFIED STATUS: 5 states (thêm 'consulting' cho online sessions)
  status: "pending_payment" | "scheduled" | "consulting" | "completed" | "cancelled";
  consultationFee: number;
  serviceId?: mongoose.Types.ObjectId;  // Service được sử dụng
  serviceName?: string;  // Tên service cho tiện
  appointmentDate?: Date;
  appointmentSlot?: string;  // VD: "14:00-15:00"
  slotId?: mongoose.Types.ObjectId;  // ID của slot đã book
  doctorNotes?: string;  // Ghi chú của doctor sau khi tư vấn
  createdAt?: Date;
  updatedAt?: Date;
}

// 🔥 FORCE CLEAR MONGOOSE CACHE
if (mongoose.models.DoctorQA) {
  delete mongoose.models.DoctorQA;
}

const DoctorQASchema = new mongoose.Schema<IDoctorQA>({
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: false 
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
  // ✅ SIMPLIFIED STATUS ENUM
  status: { 
    type: String, 
    enum: ["pending_payment", "scheduled", "consulting", "completed", "cancelled"],
    default: "pending_payment" 
  },
  consultationFee: {
    type: Number,
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  serviceName: {
    type: String
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