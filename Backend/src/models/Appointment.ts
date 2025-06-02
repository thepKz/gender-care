import mongoose from "mongoose";

export interface IAppointment {
    createdByUserId: mongoose.Types.ObjectId;
    profileId: mongoose.Types.ObjectId;
    serviceId?: mongoose.Types.ObjectId;
    packageId?: mongoose.Types.ObjectId;
    slotId: mongoose.Types.ObjectId;
    appointmentDate: Date;
    appointmentTime: string;
    appointmentType: "consultation" | "test" | "other";
    typeLocation: "clinic" | "home" | "Online";
    address?: string;
    description?: string;
    notes?: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    createdAt?: Date;
    updatedAt?: Date;
}

const appointmentSchema = new mongoose.Schema<IAppointment>(
    {
        createdByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserProfile",
            required: true
        },
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service"
        },
        packageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ServicePackage"
        },
        slotId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        appointmentDate: { type: Date, required: true },
        appointmentTime: { type: String, required: true },
        appointmentType: {
            type: String,
            enum: ["consultation", "test", "other"],
            required: true
        },
        typeLocation: {
            type: String,
            enum: ["clinic", "home", "Online"],
            required: true
        },
        address: { type: String },
        description: { type: String },
        notes: { type: String },
        status: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            default: "pending"
        }
    },
    { timestamps: true }
);

// Validation: Phải có ít nhất serviceId hoặc packageId
appointmentSchema.pre('save', function (next) {
    if (!this.serviceId && !this.packageId) {
        next(new Error('Appointment must have either serviceId or packageId'));
    } else {
        next();
    }
});

// Tạo index để tối ưu hóa truy vấn
appointmentSchema.index({ createdByUserId: 1 });
appointmentSchema.index({ profileId: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ slotId: 1 });

const Appointment = mongoose.model<IAppointment>("Appointment", appointmentSchema);

export default Appointment; 