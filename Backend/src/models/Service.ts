import mongoose from "mongoose";

export interface IService {
    serviceName: string;
    price: number;
    description?: string;
    isDeleted: boolean;
    serviceType: "consultation" | "test" | "other";
    availableAt: ("Online" | "Center" | "Athome")[];
    createdAt?: Date;
    updatedAt?: Date;
}

const serviceSchema = new mongoose.Schema<IService>(
    {
        serviceName: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        description: { type: String },
        isDeleted: { type: Boolean, default: false },
        serviceType: {
            type: String,
            enum: ["consultation", "test", "other"],
            required: true
        },
        availableAt: [{
            type: String,
            enum: ["Online", "Center", "Athome"]
        }]
    },
    { timestamps: true }
);

// Tạo index để tối ưu hóa truy vấn
serviceSchema.index({ serviceName: 1 });
serviceSchema.index({ serviceType: 1 });
serviceSchema.index({ isDeleted: 1 });

const Service = mongoose.model<IService>("Service", serviceSchema);

export default Service; 