import mongoose from "mongoose";

export interface IUser {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: "guest" | "customer" | "doctor" | "staff" | "manager" | "admin";
  emailVerified: boolean;
  isActive: boolean;
  gender?: string;
  address?: string;
  year?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },
    role: {
      type: String,
      enum: ["guest", "customer", "doctor", "staff", "manager", "admin"],
      default: "guest",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    gender: { type: String },
    address: { type: String },
    year: { type: Date },
  },
  { timestamps: true }
);

// Tạo index cho email để tối ưu hóa truy vấn
userSchema.index({ email: 1 });

const User = mongoose.model<IUser>("User", userSchema);

export default User;
