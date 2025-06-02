import mongoose from "mongoose";

export interface IServicePackage {
    name: string;
    description?: string;
    priceBeforeDiscount: number;
    price: number;
    serviceIds: mongoose.Types.ObjectId[];
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const servicePackageSchema = new mongoose.Schema<IServicePackage>(
    {
        name: { type: String, required: true },
        description: { type: String },
        priceBeforeDiscount: { type: Number, required: true, min: 0 },
        price: { type: Number, required: true, min: 0 },
        serviceIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        }],
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// Tạo index để tối ưu hóa truy vấn
servicePackageSchema.index({ name: 1 });
servicePackageSchema.index({ isActive: 1 });

const ServicePackage = mongoose.model<IServicePackage>("ServicePackage", servicePackageSchema);

export default ServicePackage; 