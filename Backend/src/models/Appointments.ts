import mongoose from 'mongoose';

export interface IAppointments {
  createdByUserId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  slotId?: mongoose.Types.ObjectId; // embedded document reference
  appointmentDate: Date;
  appointmentTime: string; // "8:00", "9:00"
  appointmentType: "consultation" | "test" | "other";
  typeLocation: "clinic" | "home" | "Online";
  address?: string;
  description?: string;
  notes?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
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
    ref: 'Services' 
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
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending" 
  }
}, { timestamps: true });

// Validation: packageId hoặc serviceId phải có ít nhất 1 cái
AppointmentsSchema.pre('save', function() {
  if (!this.packageId && !this.serviceId) {
    throw new Error('Ít nhất một trong packageId hoặc serviceId phải được cung cấp');
  }
});

// Tạo index để tối ưu hóa truy vấn
AppointmentsSchema.index({ createdByUserId: 1 });
AppointmentsSchema.index({ profileId: 1 });
AppointmentsSchema.index({ appointmentDate: 1 });
AppointmentsSchema.index({ status: 1 });
AppointmentsSchema.index({ appointmentType: 1 });

const Appointments = mongoose.model<IAppointments>('Appointments', AppointmentsSchema);

export default Appointments; 