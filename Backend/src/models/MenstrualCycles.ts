import mongoose from 'mongoose';

export interface IMenstrualCycles {
  createdByUserId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  stamp?: string;
  symbol?: string;
  mood?: string;
  observation?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MenstrualCyclesSchema = new mongoose.Schema<IMenstrualCycles>({
  createdByUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  profileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserProfiles', 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date 
  },
  stamp: { 
    type: String 
  },
  symbol: { 
    type: String 
  },
  mood: { 
    type: String 
  },
  observation: { 
    type: String 
  },
  notes: { 
    type: String 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
MenstrualCyclesSchema.index({ createdByUserId: 1 });
MenstrualCyclesSchema.index({ profileId: 1 });
MenstrualCyclesSchema.index({ startDate: 1 });

const MenstrualCycles = mongoose.model<IMenstrualCycles>('MenstrualCycles', MenstrualCyclesSchema);

export default MenstrualCycles; 