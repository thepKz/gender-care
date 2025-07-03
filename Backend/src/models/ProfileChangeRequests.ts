import { Schema, model, Document, Types } from 'mongoose';

export interface IProfileChangeRequest extends Document {
  _id: Types.ObjectId;
  doctorId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  changeType: 'bio' | 'specialization' | 'education' | 'certificate' | 'image' | 'experiences';
  currentValue: any;
  proposedValue: any;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewComments?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileChangeRequestSchema = new Schema<IProfileChangeRequest>({
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changeType: {
    type: String,
    enum: ['bio', 'specialization', 'education', 'certificate', 'image', 'experiences'],
    required: true
  },
  currentValue: {
    type: Schema.Types.Mixed,
    default: null
  },
  proposedValue: {
    type: Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewComments: {
    type: String,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
ProfileChangeRequestSchema.index({ doctorId: 1, status: 1 });
ProfileChangeRequestSchema.index({ status: 1, submittedAt: -1 });
ProfileChangeRequestSchema.index({ requestedBy: 1 });

const ProfileChangeRequest = model<IProfileChangeRequest>('ProfileChangeRequest', ProfileChangeRequestSchema);

export default ProfileChangeRequest; 