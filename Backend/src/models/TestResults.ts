import mongoose from 'mongoose';

export interface ITestResults {
  appointmentId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  conclusion?: string;
  recommendations?: string;
  createdAt?: Date;
  testResultItemsId?: mongoose.Types.ObjectId[];
}

const TestResultsSchema = new mongoose.Schema<ITestResults>({
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointments', 
    required: true 
  },
  profileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserProfiles', 
    required: true 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  conclusion: { 
    type: String 
  },
  recommendations: { 
    type: String 
  },
  testResultItemsId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestResultItems',
    default: []
  }]
}, { 
  timestamps: { createdAt: true, updatedAt: false } // Chỉ cần createdAt
});

// Tạo index để tối ưu hóa truy vấn
TestResultsSchema.index({ appointmentId: 1 });
TestResultsSchema.index({ profileId: 1 });
TestResultsSchema.index({ doctorId: 1 });

const TestResults = mongoose.model<ITestResults>('TestResults', TestResultsSchema);

export default TestResults; 