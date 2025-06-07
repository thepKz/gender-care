import mongoose from 'mongoose';

// Interface cho Medicines (embedded document)
export interface IMedicines {
  name: string;
  type: "contraceptive" | "vitamin" | "other" | "antibiotic" | "painkiller";
  dosage: string; // "500mg", "1 viên"
  reminderTimes: string[]; // ["07:00", "19:00"] - User chọn cụ thể
  frequency: string; // "daily", "twice_daily", "weekly", "as_needed"
  instructions?: string; // Copy từ medical record instructions
}

export interface IMedicationReminders {
  createdByUserId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  medicalRecordId?: mongoose.Types.ObjectId; // Reference tới medical record gốc
  medicines: IMedicines[];
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  isDeleted?: boolean;
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
    enum: ["contraceptive", "vitamin", "other", "antibiotic", "painkiller"],
    required: true 
  },
  dosage: { 
    type: String, 
    required: true 
  },
  reminderTimes: [{ 
    type: String, 
    required: true,
    validate: {
      validator: function(time: string) {
        // Validate HH:MM format
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Time must be in HH:MM format (24-hour)'
    }
  }],
  frequency: { 
    type: String,
    enum: ["daily", "twice_daily", "weekly", "as_needed"],
    required: true
  },
  instructions: { 
    type: String 
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
  medicalRecordId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MedicalRecords'
  },
  medicines: [MedicinesSchema],
  startDate: { 
    type: Date,
    default: Date.now
  },
  endDate: { 
    type: Date 
  },
  isActive: { 
    type: Boolean,
    default: true 
  },
  isDeleted: { 
    type: Boolean,
    default: false 
  },
  notes: { 
    type: String 
  }
}, { timestamps: true });

// Tạo index để tối ưu hóa truy vấn
MedicationRemindersSchema.index({ createdByUserId: 1 });
MedicationRemindersSchema.index({ profileId: 1 });
MedicationRemindersSchema.index({ medicalRecordId: 1 });
MedicationRemindersSchema.index({ isActive: 1 });
MedicationRemindersSchema.index({ isDeleted: 1 });

const MedicationReminders = mongoose.model<IMedicationReminders>('MedicationReminders', MedicationRemindersSchema);

export default MedicationReminders; 