import mongoose from "mongoose";

export interface ILoginHistory {
  userId: mongoose.Types.ObjectId;
  ipAddress: string;
  userAgent: string;
  loginAt: Date;
  status: "success" | "failed";
  failReason?: string;
}

const loginHistorySchema = new mongoose.Schema<ILoginHistory>(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    ipAddress: { 
      type: String 
    },
    userAgent: { 
      type: String 
    },
    loginAt: { 
      type: Date, 
      default: Date.now 
    },
    status: { 
      type: String, 
      enum: ["success", "failed"],
      required: true 
    },
    failReason: { 
      type: String 
    }
  },
  // Không cần timestamps vì đã có loginAt
  { timestamps: false }
);

// Tạo index để tìm kiếm nhanh
loginHistorySchema.index({ userId: 1 });
loginHistorySchema.index({ loginAt: -1 }); // Đánh index giảm dần theo thời gian

const LoginHistory = mongoose.model<ILoginHistory>("LoginHistory", loginHistorySchema);

export default LoginHistory; 