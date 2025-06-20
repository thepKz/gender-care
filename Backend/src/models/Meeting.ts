import mongoose, { Schema, Document } from 'mongoose';

// Interface for Meeting document - SIMPLIFIED VERSION
export interface IMeeting extends Document {
  qaId: mongoose.Types.ObjectId;           // Reference to DoctorQA
  doctorId: mongoose.Types.ObjectId;       // Reference to Doctor  
  userId: mongoose.Types.ObjectId;         // Reference to Customer/User
  meetingLink: string;                     // Google Meet hoặc Jitsi URL
  provider: 'google' | 'jitsi';            // Meeting provider
  
  // Thời gian đơn giản
  scheduledTime: Date;                     // Thời gian dự kiến
  actualStartTime?: Date;                  // Khi meeting thực sự bắt đầu
  
  // Trạng thái và thông tin cơ bản
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participantCount: number;                // Số người tham gia hiện tại
  maxParticipants: number;                 // Giới hạn số người (default: 2)
  
  // Ghi chú
  notes?: string;                          // Ghi chú từ doctor
  
  // Google Meet specific (optional)
  googleEventId?: string;                  // Chỉ khi dùng Google
  
  createdAt: Date;
  updatedAt: Date;
}

// Meeting Schema - SIMPLIFIED
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
  provider: {
    type: String,
    enum: ['google', 'jitsi'],
    default: 'jitsi'
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  actualStartTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  participantCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxParticipants: {
    type: Number,
    default: 2,
    min: 2,
    max: 10
  },
  notes: {
    type: String,
    trim: true
  },
  googleEventId: {
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
MeetingSchema.index({ scheduledTime: 1 });
MeetingSchema.index({ status: 1 });

// Export model
export default mongoose.model<IMeeting>('Meeting', MeetingSchema); 