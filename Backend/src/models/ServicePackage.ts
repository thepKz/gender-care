import mongoose, { Schema, Document } from 'mongoose';
import { IServicePackage } from '../types';

interface ServicePackageDocument extends Omit<IServicePackage, '_id'>, Document {}

const ServicePackageSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  priceBeforeDiscount: {
    type: Number,
    required: [true, 'Original price is required'],
    min: [0, 'Price must be a positive number']
  },
  price: {
    type: Number,
    required: [true, 'Current price is required'],
    min: [0, 'Price must be a positive number']
  },
  serviceIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  }],
  durationInDays: {
    type: Number,
    default: 30,
    min: 1
  },
  maxUsages: {
    type: Number,
    default: 1,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Validation to ensure discounted price is not higher than original price
ServicePackageSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.price > doc.priceBeforeDiscount) {
    next(new Error('Discounted price cannot be higher than original price'));
  } else {
    next();
  }
});

// Index for efficient queries
ServicePackageSchema.index({ isActive: 1 });
ServicePackageSchema.index({ name: 'text' });

const ServicePackage = mongoose.model<ServicePackageDocument>('ServicePackage', ServicePackageSchema);

export default ServicePackage; 