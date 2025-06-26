import mongoose from 'mongoose';

export interface IPaymentTracking extends mongoose.Document {
  serviceType: 'appointment' | 'consultation' | 'package';
  recordId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  doctorQAId?: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  billId?: mongoose.Types.ObjectId;
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
    enum: ['appointment', 'consultation', 'package'],
    required: true
  },
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'serviceType',
    ref: function() {
      return this.serviceType === 'appointment' ? 'Appointments' : 'DoctorQA';
    }
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServicePackages',
    required: false
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bills',
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
  }
}, { 
  timestamps: true 
});

PaymentTrackingSchema.pre('save', function() {
  if (!this.recordId) {
    throw new Error('recordId is required');
  }
  if (this.serviceType === 'package' && (!this.packageId || !this.billId)) {
    throw new Error('packageId and billId are required for package service type');
  }
  
  // Ensure only one service type reference is set
  const references = [this.appointmentId, this.doctorQAId, this.packageId].filter(Boolean);
  if (references.length > 1) {
    throw new Error('Cannot have multiple service type references');
  }
});

PaymentTrackingSchema.index({ appointmentId: 1 });
PaymentTrackingSchema.index({ doctorQAId: 1 });
PaymentTrackingSchema.index({ packageId: 1 });
PaymentTrackingSchema.index({ billId: 1 });
PaymentTrackingSchema.index({ orderCode: 1 });
PaymentTrackingSchema.index({ status: 1 });

PaymentTrackingSchema.index(
  { "expiresAt": 1 }, 
  { 
    expireAfterSeconds: 0,
    partialFilterExpression: { 
      status: "pending",
      expiresAt: { $ne: null }
    }
  }
);

PaymentTrackingSchema.statics.findAppointmentByOrderCode = function(orderCode: number) {
  return this.findOne({ 
    orderCode, 
    serviceType: 'appointment' 
  }).populate('recordId');
};

PaymentTrackingSchema.statics.findConsultationByOrderCode = function(orderCode: number) {
  return this.findOne({ 
    orderCode, 
    serviceType: 'consultation' 
  }).populate('recordId');
};

PaymentTrackingSchema.statics.findPackageByOrderCode = function(orderCode: number) {
  return this.findOne({ orderCode, serviceType: 'package' }).populate('packageId').populate('billId');
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
  
  if (status === 'success' || status === 'failed' || status === 'cancelled') {
    this.expiresAt = null;
  }
  
  return this.save();
};

const PaymentTracking = mongoose.model<IPaymentTracking>('PaymentTracking', PaymentTrackingSchema);

export default PaymentTracking; 