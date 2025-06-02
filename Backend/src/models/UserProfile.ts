import mongoose from "mongoose";

export interface IUserProfile {
    ownerId: mongoose.Types.ObjectId;
    fullName: string;
    gender: string;
    phone?: string;
    year?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const userProfileSchema = new mongoose.Schema<IUserProfile>(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        fullName: { type: String, required: true },
        gender: { type: String, required: true },
        phone: { type: String },
        year: { type: Date },
    },
    { timestamps: true }
);

// Tạo index để tối ưu hóa truy vấn
userProfileSchema.index({ ownerId: 1 });

const UserProfile = mongoose.model<IUserProfile>("UserProfile", userProfileSchema);

export default UserProfile; 