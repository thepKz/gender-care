import mongoose from 'mongoose';

export interface IFeedbacks {
  rating: number;
  feedback: string;
  comment?: string;
  appointmentId?: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  doctorRating?: number;
  serviceQuality?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const FeedbacksSchema = new mongoose.Schema<IFeedbacks>({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: true
  },
  comment: {
    type: String
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointments'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Services'
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServicePackages'
  },
  doctorRating: {
    type: Number,
    min: 1,
    max: 5
  },
  serviceQuality: {
    type: Number,
    min: 1,
    max: 5
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
FeedbacksSchema.index({ rating: 1 });
FeedbacksSchema.index({ appointmentId: 1 });
FeedbacksSchema.index({ doctorId: 1 });
FeedbacksSchema.index({ serviceId: 1 });
FeedbacksSchema.index({ packageId: 1 });

const Feedbacks = mongoose.model<IFeedbacks>('Feedbacks', FeedbacksSchema);

export default Feedbacks; 