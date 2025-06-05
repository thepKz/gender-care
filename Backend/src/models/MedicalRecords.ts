import mongoose from 'mongoose';

export interface IMedicalRecords {
  doctorId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  notes?: string;
  pictures?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

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
  diagnosis: { 
    type: String 
  },
  symptoms: { 
    type: String 
  },
  treatment: { 
    type: String 
  },
  notes: { 
    type: String 
  },
  pictures: [{ 
    type: String 
  }]
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
MedicalRecordsSchema.index({ doctorId: 1 });
MedicalRecordsSchema.index({ profileId: 1 });
MedicalRecordsSchema.index({ appointmentId: 1 });
MedicalRecordsSchema.index({ createdAt: -1 });

const MedicalRecords = mongoose.model<IMedicalRecords>('MedicalRecords', MedicalRecordsSchema);

export default MedicalRecords; 