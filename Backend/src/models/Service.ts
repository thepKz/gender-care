import mongoose, { Schema, Document } from 'mongoose';
import { IService } from '../types';

interface ServiceDocument extends Omit<IService, '_id'>, Document {}

const ServiceSchema: Schema = new Schema({
  serviceName: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  isDeleted: {
    type: Number,
    default: 0,
    enum: [0, 1]
  },
  deleteNote: {
    type: String,
    trim: true,
    default: null
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['consultation', 'test', 'treatment', 'other']
  },
  availableAt: {
    type: [String],
    required: [true, 'Available locations are required'],
    validate: {
      validator: function(arr: string[]) {
        return arr.length > 0;
      },
      message: 'At least one location must be specified'
    },
    enum: ['Athome', 'Online', 'Center']
  }
}, {
  timestamps: true
});

// Index for efficient queries
ServiceSchema.index({ isDeleted: 1, serviceType: 1 });
ServiceSchema.index({ serviceName: 'text' });

const Service = mongoose.model<ServiceDocument>('Service', ServiceSchema);

export default Service; 