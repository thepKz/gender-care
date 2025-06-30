import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointments extends Document {
  createdByUserId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId; // ID của bác sĩ được chỉ định
  slotId?: mongoose.Types.ObjectId; // embedded document reference
  appointmentDate: Date;
  appointmentTime: string; // "8:00", "9:00"
  appointmentType: "consultation" | "test" | "other";
  typeLocation: "clinic" | "home" | "Online";
  address?: string;
  description?: string;
  notes?: string;
  status: "pending_payment" | "pending" | "scheduled" | "confirmed" | "consulting" | "completed" | "cancelled" | "payment_cancelled" | "expired" | "done_testResultItem" | "done_testResult";
  totalAmount?: number; // Total amount for payment
  paymentStatus?: "unpaid" | "paid" | "partial" | "refunded";
  paidAt?: Date; // Timestamp when payment was completed
  bookingType?: "new_package" | "purchased_package" | "service_only"; // Phân biệt loại đặt lịch
  packagePurchaseId?: mongoose.Types.ObjectId; // Reference đến package đã mua (cho purchased_package)
  expiresAt?: Date; // Thời gian hết hạn cho pending appointments (15 phút)
  paymentLinkId?: string; // PayOS order code/payment link ID
  billId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const AppointmentsSchema = new mongoose.Schema<IAppointments>({
  createdByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfiles',
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServicePackages'
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId // embedded document reference
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
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
  address: {
    type: String
  },
  description: {
    type: String
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending_payment", "pending", "scheduled", "confirmed", "consulting", "completed", "cancelled"],
    default: "pending_payment"
  },
  totalAmount: {
    type: Number,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "partial", "refunded"],
    default: "unpaid"
  },
  paidAt: {
    type: Date
  },
  bookingType: {
    type: String,
    enum: ["new_package", "purchased_package", "service_only"],
    default: "service_only"
  },
  packagePurchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PackagePurchases'
  },
  expiresAt: {
    type: Date
  },
  paymentLinkId: {
    type: String
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bills',
    default: null
  }
}, { timestamps: true });

// Validation: packageId hoặc serviceId phải có ít nhất 1 cái
AppointmentsSchema.pre('save', function () {
  if (!this.packageId && !this.serviceId) {
    throw new Error('Ít nhất một trong packageId hoặc serviceId phải được cung cấp');
  }
});

// Auto-cancel expired appointments
AppointmentsSchema.index({ paymentDeadline: 1 }, { expireAfterSeconds: 0 });

// Tạo index để tối ưu hóa truy vấn
AppointmentsSchema.index({ createdByUserId: 1 });
AppointmentsSchema.index({ profileId: 1 });
AppointmentsSchema.index({ appointmentDate: 1 });
AppointmentsSchema.index({ status: 1 });
AppointmentsSchema.index({ appointmentType: 1 });

const Appointments = mongoose.model<IAppointments>('Appointments', AppointmentsSchema);

export default Appointments; 