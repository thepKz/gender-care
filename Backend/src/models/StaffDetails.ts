import mongoose from 'mongoose';

export interface IStaffDetails {
  userId: mongoose.Types.ObjectId;
  staffType: "Nursing" | "Blogers" | "Normal";
  createdAt?: Date;
  updatedAt?: Date;
}

const StaffDetailsSchema = new mongoose.Schema<IStaffDetails>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  staffType: { 
    type: String, 
    enum: ["Nursing", "Blogers", "Normal"],
    required: true 
  },
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
StaffDetailsSchema.index({ userId: 1 });
StaffDetailsSchema.index({ staffType: 1 });

const StaffDetails = mongoose.model<IStaffDetails>('StaffDetails', StaffDetailsSchema);

export default StaffDetails; 