import mongoose from 'mongoose';
import { IUserProfile } from '../types';

const UserProfileSchema = new mongoose.Schema<IUserProfile>({
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true,
    trim: true 
  },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'],
    required: true 
  },
  phone: { 
    type: String,
    trim: true 
  },
  year: { 
    type: Date 
  }
}, { 
  timestamps: true 
});

// Tạo index cho ownerId để tối ưu hóa truy vấn
UserProfileSchema.index({ ownerId: 1 });

// Cho phép mỗi user có nhiều profiles (đã xóa unique constraint)

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);