import mongoose, { Schema, Document } from 'mongoose';

// Interface for Meeting document
export interface IMeeting extends Document {
  qaId: mongoose.Types.ObjectId;           // Reference to DoctorQA
  doctorId: mongoose.Types.ObjectId;       // Reference to Doctor
  userId: mongoose.Types.ObjectId;         // Reference to User
  meetingLink: string;                     // Google Meet URL
  meetingId?: string;                      // Google Calendar event ID
  scheduledStartTime: Date;                // Thời gian bắt đầu đã lên lịch
  scheduledEndTime: Date;                  // Thời gian kết thúc đã lên lịch
  actualStartTime?: Date;                  // Thời gian thực tế bắt đầu (khi doctor join)
  actualEndTime?: Date;                    // Thời gian thực tế kết thúc
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participants: [{
    userId: mongoose.Types.ObjectId;
    userType: 'doctor' | 'user';
    joinedAt?: Date;
    leftAt?: Date;
  }];
  notes?: string;                          // Ghi chú từ doctor
  createdAt: Date;
  updatedAt: Date;
}

// Meeting Schema
const MeetingSchema: Schema = new Schema({
  qaId: {
    type: Schema.Types.ObjectId,
    ref: 'DoctorQA',
    required: true,
    unique: true                           // Mỗi QA chỉ có 1 meeting
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  meetingLink: {
    type: String,
    required: true,
    trim: true
  },
  meetingId: {
    type: String,
    trim: true
  },
  scheduledStartTime: {
    type: Date,
    required: true
  },
  scheduledEndTime: {
    type: Date,
    required: true
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userType: {
      type: String,
      enum: ['doctor', 'user'],
      required: true
    },
    joinedAt: {
      type: Date
    },
    leftAt: {
      type: Date
    }
  }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true  // Tự động tạo createdAt, updatedAt
});

// Indexes for better performance
MeetingSchema.index({ qaId: 1 });
MeetingSchema.index({ doctorId: 1 });
MeetingSchema.index({ userId: 1 });
MeetingSchema.index({ scheduledStartTime: 1 });
MeetingSchema.index({ status: 1 });

// Export model
export default mongoose.model<IMeeting>('Meeting', MeetingSchema); 