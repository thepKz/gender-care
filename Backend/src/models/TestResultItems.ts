import mongoose from 'mongoose';

export interface ITestResultItems {
  appointmentId: mongoose.Types.ObjectId;
  itemNameId: mongoose.Types.ObjectId;
  value: string;
  unit?: string;
  flag?: "high" | "low" | "normal";
}

const TestResultItemsSchema = new mongoose.Schema<ITestResultItems>({
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointments', 
    required: true 
  },
  itemNameId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TestCategories', 
    required: true 
  },
  value: { 
    type: String, 
    required: true 
  },
  unit: { 
    type: String 
  },
  flag: { 
    type: String, 
    enum: ["high", "low", "normal"]
  }
}, { timestamps: false }); // Không cần timestamps

// Tạo index để tối ưu hóa truy vấn
TestResultItemsSchema.index({ appointmentId: 1 });
TestResultItemsSchema.index({ itemNameId: 1 });

const TestResultItems = mongoose.model<ITestResultItems>('TestResultItems', TestResultItemsSchema);

export default TestResultItems; 