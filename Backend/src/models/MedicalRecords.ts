import mongoose from 'mongoose';

// Interface cho Medicines trong Medical Records
export interface IMedicalRecordMedicines {
  name: string;
  type: "contraceptive" | "vitamin" | "other" | "antibiotic" | "painkiller";
  dosage: string; // "500mg", "1 viên"
  frequency: number; // Số lần uống trong ngày (1, 2, 3...)
  timingInstructions: string; // "Sáng và tối", "Mỗi 8 tiếng", "Trước ăn 30 phút"
  duration?: string; // "7 ngày", "2 tuần", "theo dõi triệu chứng"
  instructions: string; // Chi tiết đầy đủ từ doctor
}

export interface IMedicalRecords {
  doctorId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  conclusion?: string;
  symptoms?: string;
  treatment?: string;
  medicines?: IMedicalRecordMedicines[];
  notes?: string;
  status: "draft" | "completed";
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema cho Medicines trong Medical Records (embedded)
const MedicalRecordMedicinesSchema = new mongoose.Schema<IMedicalRecordMedicines>({
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["contraceptive", "vitamin", "other", "antibiotic", "painkiller"],
    required: true 
  },
  dosage: { 
    type: String, 
    required: true 
  },
  frequency: { 
    type: Number, 
    required: true,
    min: 1,
    max: 10 // Giới hạn tối đa 10 lần/ngày
  },
  timingInstructions: { 
    type: String, 
    required: true 
  },
  duration: { 
    type: String 
  },
  instructions: { 
    type: String,
    required: true 
  }
}, { _id: true });

const MedicalRecordsSchema = new mongoose.Schema<IMedicalRecords>({
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  profileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserProfiles', 
    required: true 
  },
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointments', 
    required: true 
  },
  conclusion: { 
    type: String 
  },
  symptoms: { 
    type: String 
  },
  treatment: { 
    type: String 
  },
  medicines: [MedicalRecordMedicinesSchema],
  notes: { 
    type: String 
  },
  status: {
    type: String,
    enum: ["draft", "completed"],
    default: "draft"
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
MedicalRecordsSchema.index({ doctorId: 1 });
MedicalRecordsSchema.index({ profileId: 1 });
MedicalRecordsSchema.index({ appointmentId: 1 });
MedicalRecordsSchema.index({ createdAt: -1 });

const MedicalRecords = mongoose.model<IMedicalRecords>('MedicalRecords', MedicalRecordsSchema);

export default MedicalRecords; 