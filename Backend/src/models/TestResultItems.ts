import mongoose from 'mongoose';

export interface ITestResultItems {
  appointmentId: mongoose.Types.ObjectId;
  items?: Array<{
    testCategoryId: mongoose.Types.ObjectId;
    value: string;
    unit?: string;
    flag?: "very_low" | "low" | "normal" | "mild_high" | "high" | "critical";
    message?: string;
  }>;
}

const TestResultItemsSchema = new mongoose.Schema<ITestResultItems>({
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointments', 
    required: true 
  },
  items: [
    {
      _id: false,
      testCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCategories', required: true },
      value: { type: String, required: true },
      unit: { type: String },
      flag: { type: String, enum: ["very_low", "low", "normal", "mild_high", "high", "critical"] },
      message: { type: String }
    }
  ]
}, { timestamps: false }); // Không cần timestamps

// Tạo index để tối ưu hóa truy vấn
TestResultItemsSchema.index({ appointmentId: 1 });

const TestResultItems = mongoose.model<ITestResultItems>('TestResultItems', TestResultItemsSchema);

export default TestResultItems; 