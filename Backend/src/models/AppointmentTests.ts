import mongoose from 'mongoose';

export interface IAppointmentTests {
  appointmentId?: string;
  description?: string;
  name: string;
  price: number;
  preparationGuidelines?: string;
  resultWaitTime?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AppointmentTestsSchema = new mongoose.Schema<IAppointmentTests>({
  appointmentId: { 
    type: String,
    required: false,
    default: "none"
  },
  description: { 
    type: String 
  },
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  preparationGuidelines: { 
    type: String 
  },
  resultWaitTime: { 
    type: String 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
AppointmentTestsSchema.index({ appointmentId: 1 });
AppointmentTestsSchema.index({ name: 1 });

const AppointmentTests = mongoose.model<IAppointmentTests>('AppointmentTests', AppointmentTestsSchema);

export default AppointmentTests; 