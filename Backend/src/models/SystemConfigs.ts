import mongoose from 'mongoose';

export interface ISystemConfigs {
  key: string;
  value: string;
}

const SystemConfigsSchema = new mongoose.Schema<ISystemConfigs>({
  key: { 
    type: String, 
    required: true,
    unique: true 
  },
  value: { 
    type: String, 
    required: true 
  }
}, { timestamps: false }); // Không cần timestamps cho config

// Tạo index để tối ưu hóa truy vấn
SystemConfigsSchema.index({ key: 1 });

const SystemConfigs = mongoose.model<ISystemConfigs>('SystemConfigs', SystemConfigsSchema);

export default SystemConfigs; 