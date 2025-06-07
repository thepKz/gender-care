import mongoose from 'mongoose';

export interface ICycleSymptoms {
  cycleId: mongoose.Types.ObjectId;
  symptom: string;
}

const CycleSymptomsSchema = new mongoose.Schema<ICycleSymptoms>({
  cycleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MenstrualCycles', 
    required: true 
  },
  symptom: { 
    type: String, 
    required: true 
  }
}, { timestamps: false }); // Không cần timestamps cho model này

// Tạo index để tối ưu hóa truy vấn
CycleSymptomsSchema.index({ cycleId: 1 });

const CycleSymptoms = mongoose.model<ICycleSymptoms>('CycleSymptoms', CycleSymptomsSchema);

export default CycleSymptoms; 