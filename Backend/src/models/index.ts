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
import Service from './Service';
import ServicePackages from './ServicePackages';
import Appointments from './Appointments';

// Health Tracking
import MenstrualCycles from './MenstrualCycles';
import CycleSymptoms from './CycleSymptoms';
import MedicationReminders, { IMedicationReminders, IMedicines } from './MedicationReminders';
import NotificationDays from './NotificationDays';

// Medical Records & Medicines
import MedicalRecords, { IMedicalRecords, IMedicalRecordMedicines } from './MedicalRecords';
import Medicines, { IMedicines as IMedicinesData } from './Medicines';

// Testing & Results
import TestResults from './TestResults';

// Doctor QA & Meeting
import DoctorQA from './DoctorQA';
import Meeting from './Meeting';
import GoogleAuth from './GoogleAuth';

// Content & Community
import BlogCategories from './BlogCategories';
import BlogPosts from './BlogPosts';
import PostCategories from './PostCategories';
import Feedbacks from './Feedbacks';

// Business & Billing
import Promotions from './Promotions';
import Bills from './Bills';
import Payments from './Payments';
import PackagePurchases from './PackagePurchases';
import PaymentTracking from './PaymentTracking';

// System
import SystemConfigs from './SystemConfigs';
import SystemLog from './SystemLogs';

// Export all models
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
  Service,
  ServicePackages,
  Appointments,
  
  // Health Tracking
  MenstrualCycles,
  CycleSymptoms,
  MedicationReminders,
  NotificationDays,
  
  // Medical Records & Medicines
  MedicalRecords,
  Medicines,
  
  // Testing & Results
  TestResults,
  
  // Doctor QA & Meeting
  DoctorQA,
  Meeting,
  GoogleAuth,
  
  // Content & Community
  BlogCategories,
  BlogPosts,
  PostCategories,
  Feedbacks,
  
  // Business & Billing
  Promotions,
  Bills,
  Payments,
  PackagePurchases,
  PaymentTracking,
  
  // System
  SystemConfigs,
  SystemLog
};

// Export interfaces
export type {
  IMedicationReminders,
  IMedicines,
  IMedicalRecords,
  IMedicalRecordMedicines,
  IMedicinesData
};

