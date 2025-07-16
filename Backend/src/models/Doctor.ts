import mongoose from 'mongoose';

// TypeScript interface
export interface IDoctor {
  userId: mongoose.Types.ObjectId;
  bio?: string;
  experience?: string | number;
  rating?: number;
  image?: string;
  specialization?: string;
  education?: string;
  certificate?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
}

// Mongoose schema
const DoctorSchema = new mongoose.Schema<IDoctor>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: { type: String },
  experience: { type: mongoose.Schema.Types.Mixed },
  rating: { type: Number, min: 0, max: 5 },
  image: { type: String },
  specialization: { type: String },
  education: { type: String },
  certificate: { type: String },
  // Soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Tối ưu hóa truy vấn
DoctorSchema.index({ userId: 1 });
DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ rating: -1 });

const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);

// Export cả named và default để tương thích
export { Doctor };
export default Doctor;
