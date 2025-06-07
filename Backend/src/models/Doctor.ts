import mongoose from 'mongoose';

export interface IDoctor {
  userId: mongoose.Types.ObjectId;
  bio?: string;
  experience?: number;
  rating?: number;
  image?: string;
  specialization?: string;
  education?: string;
  certificate?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DoctorSchema = new mongoose.Schema<IDoctor>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  bio: { type: String },
  experience: { type: Number },
  rating: { type: Number, min: 0, max: 5 },
  image: { type: String },
  specialization: { type: String },
  education: { type: String },
  certificate: { type: String },
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
DoctorSchema.index({ userId: 1 });
DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ rating: -1 });

const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);

export default Doctor;
