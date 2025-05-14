import mongoose from "mongoose";

export interface IOtpCode {
  userId: mongoose.Types.ObjectId;
  type: "email_verification" | "password_reset" | "login";
  otp: string;
  expires: Date;
  verified: boolean;
  verifiedAt?: Date;
  attempts: number;
  createdAt: Date;
}

const otpCodeSchema = new mongoose.Schema<IOtpCode>(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    type: { 
      type: String, 
      enum: ["email_verification", "password_reset", "login"],
      required: true 
    },
    otp: { 
      type: String, 
      required: true 
    },
    expires: { 
      type: Date, 
      required: true,
      index: { expires: 0 } // TTL index, sẽ tự động xóa document khi hết hạn
    },
    verified: { 
      type: Boolean, 
      default: false 
    },
    verifiedAt: { 
      type: Date 
    },
    attempts: { 
      type: Number, 
      default: 0 
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Chỉ lưu createdAt, không cần updatedAt
  }
);

// Tạo index để tìm kiếm nhanh
otpCodeSchema.index({ userId: 1, type: 1 });
otpCodeSchema.index({ otp: 1, type: 1 });

const OtpCode = mongoose.model<IOtpCode>("OtpCode", otpCodeSchema);

export default OtpCode; 