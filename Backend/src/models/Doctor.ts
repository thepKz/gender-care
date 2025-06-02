import mongoose from "mongoose";

export interface IDoctor {
    userId: mongoose.Types.ObjectId;
    bio?: string;
    experience?: number;
    rating?: number;
    specialization?: string;
    education?: string;
    certificate?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const doctorSchema = new mongoose.Schema<IDoctor>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        bio: { type: String },
        experience: { type: Number, default: 0 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        specialization: { type: String },
        education: { type: String },
        certificate: { type: String },
    },
    { timestamps: true }
);

// Tạo index để tối ưu hóa truy vấn
doctorSchema.index({ userId: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ rating: -1 });

const Doctor = mongoose.model<IDoctor>("Doctor", doctorSchema);

export default Doctor; 