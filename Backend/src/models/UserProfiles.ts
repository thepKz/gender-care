import mongoose from 'mongoose';

export interface IUserProfiles {
  ownerId: mongoose.Types.ObjectId;
  fullName: string;
  gender?: string;
  phone?: string;
  year?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserProfilesSchema = new mongoose.Schema<IUserProfiles>({
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  gender: { 
    type: String 
  },
  phone: { 
    type: String 
  },
  year: { 
    type: Date 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
UserProfilesSchema.index({ ownerId: 1 });
UserProfilesSchema.index({ fullName: 1 });

const UserProfiles = mongoose.model<IUserProfiles>('UserProfiles', UserProfilesSchema);

export default UserProfiles; 