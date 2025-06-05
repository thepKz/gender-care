import mongoose from 'mongoose';

// Interface cho Medicines (embedded document)
export interface IMedicines {
  name: string;
  type: "contraceptive" | "vitamin" | "other";
  time: string;
  dosage: string;
}

export interface IMedicationReminders {
  createdByUserId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  medicines: IMedicines[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema cho Medicines (embedded)
const MedicinesSchema = new mongoose.Schema<IMedicines>({
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["contraceptive", "vitamin", "other"],
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  dosage: { 
    type: String, 
    required: true 
  }
}, { _id: true });

const MedicationRemindersSchema = new mongoose.Schema<IMedicationReminders>({
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
  medicines: [MedicinesSchema],
  notes: { 
    type: String 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
MedicationRemindersSchema.index({ createdByUserId: 1 });
MedicationRemindersSchema.index({ profileId: 1 });

const MedicationReminders = mongoose.model<IMedicationReminders>('MedicationReminders', MedicationRemindersSchema);

export default MedicationReminders; 