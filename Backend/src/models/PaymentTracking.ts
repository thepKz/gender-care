import mongoose from 'mongoose';

export interface IPaymentTracking extends mongoose.Document {
  serviceType: 'appointment' | 'consultation';
  appointmentId?: mongoose.Types.ObjectId;
  doctorQAId?: mongoose.Types.ObjectId;
  orderCode: number;
  paymentLinkId?: string;
  paymentGateway: 'payos' | 'vnpay' | 'momo';
  amount: number;
  description: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'expired';
  paymentUrl?: string;
  transactionInfo?: {
    reference?: string;
    transactionDateTime?: string;
    counterAccountInfo?: any;
    virtualAccount?: any;
  };
  webhookReceived?: boolean;
  webhookProcessedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date;
  
  // Instance methods
  updatePaymentStatus(status: string, transactionInfo?: any, webhookReceived?: boolean): Promise<this>;
}

const PaymentTrackingSchema = new mongoose.Schema<IPaymentTracking>({
  serviceType: {
    type: String,
    enum: ['appointment', 'consultation'],
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointments',
    required: false
  },
  doctorQAId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorQA',
    required: false
  },
  orderCode: {
    type: Number,
    required: true,
    unique: true
  },
  paymentLinkId: {
    type: String
  },
  paymentGateway: {
    type: String,
    enum: ['payos', 'vnpay', 'momo'],
    required: true,
    default: 'payos'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String
  },
  customerPhone: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled', 'expired'],
    default: 'pending'
  },
  paymentUrl: {
    type: String
  },
  transactionInfo: {
    reference: String,
    transactionDateTime: String,
    counterAccountInfo: mongoose.Schema.Types.Mixed,
    virtualAccount: mongoose.Schema.Types.Mixed
  },
  webhookReceived: {
    type: Boolean,
    default: false
  },
  webhookProcessedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 60 * 1000),
    index: { expireAfterSeconds: 0 }
  }
}, { 
  timestamps: true 
});

PaymentTrackingSchema.pre('save', function() {
  if (this.serviceType === 'appointment' && !this.appointmentId) {
    throw new Error('appointmentId is required for appointment service type');
  }
  if (this.serviceType === 'consultation' && !this.doctorQAId) {
    throw new Error('doctorQAId is required for consultation service type');
  }
  if (this.appointmentId && this.doctorQAId) {
    throw new Error('Cannot have both appointmentId and doctorQAId');
  }
});

PaymentTrackingSchema.index({ appointmentId: 1 });
PaymentTrackingSchema.index({ doctorQAId: 1 });
PaymentTrackingSchema.index({ orderCode: 1 });
PaymentTrackingSchema.index({ status: 1 });
PaymentTrackingSchema.index({ serviceType: 1 });

PaymentTrackingSchema.statics.findAppointmentByOrderCode = function(orderCode: number) {
  return this.findOne({ orderCode, serviceType: 'appointment' }).populate('appointmentId');
};

PaymentTrackingSchema.statics.findConsultationByOrderCode = function(orderCode: number) {
  return this.findOne({ orderCode, serviceType: 'consultation' }).populate('doctorQAId');
};

PaymentTrackingSchema.methods.updatePaymentStatus = function(
  status: string, 
  transactionInfo?: any, 
  webhookReceived = false
) {
  this.status = status;
  if (transactionInfo) {
    this.transactionInfo = transactionInfo;
  }
  if (webhookReceived) {
    this.webhookReceived = true;
    this.webhookProcessedAt = new Date();
  }
  return this.save();
};

const PaymentTracking = mongoose.model<IPaymentTracking>('PaymentTracking', PaymentTrackingSchema);

export default PaymentTracking; 