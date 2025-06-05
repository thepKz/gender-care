// Core User Management
import User from './User';
import AuthToken from './AuthToken';
import LoginHistory from './LoginHistory';
import OtpCode from './OtpCode';
import UserProfiles from './UserProfiles';

// Doctor & Staff Management
import Doctor from './Doctor';
import StaffDetails from './StaffDetails';
import DoctorSchedules from './DoctorSchedules';

// Services & Appointments
import Services from './Services';
import ServicePackages from './ServicePackages';
import Appointments from './Appointments';

// Health Tracking
import MenstrualCycles from './MenstrualCycles';
import CycleSymptoms from './CycleSymptoms';
import MedicationReminders, { IMedicationReminders, IMedicines } from './MedicationReminders';
import NotificationDays from './NotificationDays';

// Testing & Medical
import TestCategories from './TestCategories';
import AppointmentTests from './AppointmentTests';
import TestResults from './TestResults';
import TestResultItems from './TestResultItems';
import MedicalRecords, { IMedicalRecords, IMedicalRecordMedicines } from './MedicalRecords';

// Content & Community
import BlogCategories from './BlogCategories';
import BlogPosts from './BlogPosts';
import PostCategories from './PostCategories';
import Feedbacks from './Feedbacks';
import DoctorQA from './DoctorQA';

// Business & Billing
import Promotions from './Promotions';
import Bills from './Bills';
import Payments from './Payments';
import PackagePurchases from './PackagePurchases';

// System
import SystemConfigs from './SystemConfigs';

export {
  // Core User Management
  User,
  AuthToken,
  LoginHistory,
  OtpCode,
  UserProfiles,
  
  // Doctor & Staff Management
  Doctor,
  StaffDetails,
  DoctorSchedules,
  
  // Services & Appointments
  Services,
  ServicePackages,
  Appointments,
  
  // Health Tracking
  MenstrualCycles,
  CycleSymptoms,
  MedicationReminders,
  NotificationDays,
  
  // Testing & Medical
  TestCategories,
  AppointmentTests,
  TestResults,
  TestResultItems,
  MedicalRecords,
  
  // Content & Community
  BlogCategories,
  BlogPosts,
  PostCategories,
  Feedbacks,
  DoctorQA,
  
  // Business & Billing
  Promotions,
  Bills,
  Payments,
  PackagePurchases,
  
  // System
  SystemConfigs
};

// Export interfaces
export type {
  IMedicalRecords,
  IMedicalRecordMedicines,
  IMedicationReminders,
  IMedicines
};

