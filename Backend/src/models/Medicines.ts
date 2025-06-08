import mongoose from 'mongoose';

export interface IMedicines {
  name: string;
  type: "contraceptive" | "vitamin" | "other" | "antibiotic" | "painkiller";
  description?: string;
  defaultDosage?: string;
  defaultTimingInstructions?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const MedicinesSchema = new mongoose.Schema<IMedicines>({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  type: { 
    type: String, 
    enum: ["contraceptive", "vitamin", "other", "antibiotic", "painkiller"],
    required: true 
  },
  description: { 
    type: String 
  },
  defaultDosage: { 
    type: String 
  },
  defaultTimingInstructions: { 
    type: String 
  },
  isActive: { 
    type: Boolean,
    default: true 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
MedicinesSchema.index({ name: 1 });
MedicinesSchema.index({ type: 1 });
MedicinesSchema.index({ isActive: 1 });

const Medicines = mongoose.model<IMedicines>('Medicines', MedicinesSchema);

export default Medicines; 