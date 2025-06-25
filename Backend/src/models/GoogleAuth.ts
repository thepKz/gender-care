import mongoose, { Schema, Document } from 'mongoose';

// Interface for GoogleAuth document
export interface IGoogleAuth extends Document {
  doctorId: mongoose.Types.ObjectId;       // Reference to Doctor
  credentials: {
    access_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expiry_date: number;
  };
  isActive: boolean;                       // Connection status
  lastSyncAt: Date;                        // Last sync with Google
  createdAt: Date;
  updatedAt: Date;
}

// GoogleAuth Schema
const GoogleAuthSchema: Schema = new Schema({
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true                           // Mỗi doctor chỉ có 1 Google Auth
  },
  credentials: {
    access_token: {
      type: String,
      required: true
    },
    refresh_token: {
      type: String,
      required: true
    },
    scope: {
      type: String,
      required: true
    },
    token_type: {
      type: String,
      default: 'Bearer'
    },
    expiry_date: {
      type: Number,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true  // Tự động tạo createdAt, updatedAt
});

// Indexes for better performance
GoogleAuthSchema.index({ doctorId: 1 });
GoogleAuthSchema.index({ isActive: 1 });

// Export model
export default mongoose.model<IGoogleAuth>('GoogleAuth', GoogleAuthSchema); 