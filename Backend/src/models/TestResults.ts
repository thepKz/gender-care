import mongoose from 'mongoose';

export interface ITestResults {
  appointmentTestId: mongoose.Types.ObjectId;
  conclusion?: string;
  recommendations?: string;
  createdAt?: Date;
}

const TestResultsSchema = new mongoose.Schema<ITestResults>({
  appointmentTestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AppointmentTests', 
    required: true 
  },
  conclusion: { 
    type: String 
  },
  recommendations: { 
    type: String 
  }
}, { 
  timestamps: { createdAt: true, updatedAt: false } // Chỉ cần createdAt
});

// Tạo index để tối ưu hóa truy vấn
TestResultsSchema.index({ appointmentTestId: 1 });

const TestResults = mongoose.model<ITestResults>('TestResults', TestResultsSchema);

export default TestResults; 