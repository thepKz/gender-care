import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bio: String,
  experience: Number,
  rating: Number,
  specialization: String,
  education: String,
  certificate: String,
}, { timestamps: true });

export const Doctor = mongoose.model('Doctor', DoctorSchema);
