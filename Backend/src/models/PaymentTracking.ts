import mongoose from 'mongoose';

export interface IPaymentTracking extends mongoose.Document {
  // Service identification
  serviceType: 'appointment' | 'consultation' | 'package';
  recordId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  doctorQAId?: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  
  // Business fields (from Bills)
  userId: mongoose.Types.ObjectId;
  billNumber: string;
  totalAmount: number;
  amount: number;
  
  // PayOS integration
  orderCode: number;
  paymentLinkId?: string;
  paymentGateway: 'payos' | 'vnpay' | 'momo';
  description: string;
  paymentUrl?: string;
  
  // Customer info
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Status & tracking
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'expired';
  transactionInfo?: {
    reference?: string;
    transactionDateTime?: string;
    counterAccountInfo?: any;
    virtualAccount?: any;
  };
  webhookReceived?: boolean;
  webhookProcessedAt?: Date;
  
  // TTL cleanup
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  
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
    ref: function(): string {
      return this.serviceType === 'appointment' ? 'Appointments' : 
             this.serviceType === 'consultation' ? 'DoctorQA' : 'ServicePackages';
    }
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
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServicePackages',
    required: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
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
  description: {
    type: String,
    required: true
  },
  paymentUrl: {
    type: String
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
    default: () => new Date(Date.now() + 10 * 60 * 1000),
  }
}, { 
  timestamps: true 
});

PaymentTrackingSchema.pre('save', function() {
  if (!this.billNumber && this.isNew) {
    this.billNumber = `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  
  if (!this.recordId) {
    throw new Error('recordId is required');
  }
  
  if (this.serviceType === 'appointment' && this.recordId && !this.appointmentId) {
    this.appointmentId = this.recordId;
  }
  if (this.serviceType === 'consultation' && this.recordId && !this.doctorQAId) {
    this.doctorQAId = this.recordId;
  }
  if (this.serviceType === 'package' && this.recordId && !this.packageId) {
    this.packageId = this.recordId;
  }
});

PaymentTrackingSchema.index({ userId: 1 });
PaymentTrackingSchema.index({ appointmentId: 1 });
PaymentTrackingSchema.index({ doctorQAId: 1 });
PaymentTrackingSchema.index({ packageId: 1 });
PaymentTrackingSchema.index({ billNumber: 1 });
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
  }).populate('appointmentId');
};

PaymentTrackingSchema.statics.findConsultationByOrderCode = function(orderCode: number) {
  return this.findOne({ 
    orderCode, 
    serviceType: 'consultation' 
  }).populate('doctorQAId');
};

PaymentTrackingSchema.statics.findPackageByOrderCode = function(orderCode: number) {
  return this.findOne({ orderCode, serviceType: 'package' }).populate('packageId');
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