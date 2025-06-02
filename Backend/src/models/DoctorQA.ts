import mongoose from 'mongoose';

export interface IDoctorQA {
  doctorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  notes?: string;
  question: string;
  status: "pending" | "contacted" | "resolved" | "cancelled";
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
    enum: ["pending", "contacted", "resolved", "cancelled"],
    default: "pending" 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
DoctorQASchema.index({ doctorId: 1 });
DoctorQASchema.index({ userId: 1 });
DoctorQASchema.index({ status: 1 });
DoctorQASchema.index({ createdAt: -1 });

const DoctorQA = mongoose.model<IDoctorQA>('DoctorQA', DoctorQASchema);

export default DoctorQA; 