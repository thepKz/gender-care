import mongoose from 'mongoose';

// Log levels để phân quyền xem
export enum LogLevel {
  PUBLIC = 'public',     // Manager + Admin có thể xem
  MANAGER = 'manager',   // Manager + Admin có thể xem
  ADMIN = 'admin'        // Chỉ Admin có thể xem
}

// Log actions để categorize
export enum LogAction {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_CHANGE = 'password_change',
  
  // User Management
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  ROLE_CHANGE = 'role_change',
  
  // Appointments
  APPOINTMENT_CREATE = 'appointment_create',
  APPOINTMENT_UPDATE = 'appointment_update',
  APPOINTMENT_CANCEL = 'appointment_cancel',
  
  // Medical
  MEDICAL_RECORD_CREATE = 'medical_record_create',
  PRESCRIPTION_CREATE = 'prescription_create',
  
  // System
  SYSTEM_CONFIG_CHANGE = 'system_config_change',
  PERMISSION_CHANGE = 'permission_change',
  DATA_EXPORT = 'data_export',
  BACKUP_CREATE = 'backup_create',
  
  // Security
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  API_KEY_CHANGE = 'api_key_change'
}

interface ISystemLog extends mongoose.Document {
  _id: string;
  
  // Core log info
  action: LogAction;
  level: LogLevel;
  message: string;
  
  // User context
  userId?: string;
  userEmail?: string;
  userRole?: string;
  
  // Target context (what was affected)
  targetId?: string;
  targetType?: string; // 'user', 'appointment', 'config', etc.
  targetData?: any;    // Snapshot of changed data
  
  // Request context
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  
  // Additional metadata
  metadata?: any;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const SystemLogSchema = new mongoose.Schema<ISystemLog>({
  // Core log info
  action: {
    type: String,
    enum: Object.values(LogAction),
    required: true,
    index: true
  },
  
  level: {
    type: String,
    enum: Object.values(LogLevel),
    required: true,
    default: LogLevel.PUBLIC,
    index: true
  },
  
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // User context
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  userEmail: {
    type: String,
    index: true
  },
  
  userRole: {
    type: String,
    index: true
  },
  
  // Target context
  targetId: {
    type: String,
    index: true
  },
  
  targetType: {
    type: String,
    index: true
  },
  
  targetData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Request context
  ipAddress: {
    type: String,
    index: true
  },
  
  userAgent: {
    type: String
  },
  
  endpoint: {
    type: String,
    index: true
  },
  
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'system_logs'
});

// Compound indexes for efficient querying
SystemLogSchema.index({ level: 1, createdAt: -1 });
SystemLogSchema.index({ action: 1, createdAt: -1 });
SystemLogSchema.index({ userId: 1, createdAt: -1 });
SystemLogSchema.index({ userEmail: 1, createdAt: -1 });
SystemLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

// TTL index - auto-delete logs older than 90 days
SystemLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const SystemLog = mongoose.model<ISystemLog>('SystemLog', SystemLogSchema);

export default SystemLog;
export type { ISystemLog }; 