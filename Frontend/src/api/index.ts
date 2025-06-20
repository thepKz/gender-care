import axiosInstance from './axiosConfig';

// Import all available API endpoints
import authApi from './endpoints/auth';
import appointmentApi from './endpoints/appointment';
import billingApi from './endpoints/billing';
import consultationApi from './endpoints/consultation';
import dashboardApi from './endpoints/dashboard';
import { doctorApi } from './endpoints/doctorApi';
import doctorScheduleApi from './endpoints/doctorSchedule';
import loginHistoryApi from './endpoints/loginHistory';
import medicalApi from './endpoints/medical';
import menstrualCycleApi from './endpoints/menstrualCycle';
import packagePurchaseApi from './endpoints/packagePurchaseApi';
import paymentApi from './endpoints/payment';
import * as serviceApiExports from './endpoints/serviceApi';
import servicePackageApi from './endpoints/servicePackageApi';
import servicesApi from './endpoints/services';
import stiTestingApi from './endpoints/stiTesting';
import userApi from './endpoints/userApi';
import userProfileApi from './endpoints/userProfileApi';

// Service layer imports
import { handleAPI } from './services/handleAPI';
import { userAPI } from './services/userAPI';
import { doctorAPI } from './services/doctorAPI';

// Combined API object
const api = {
  auth: authApi,
  appointment: appointmentApi,
  billing: billingApi,
  consultation: consultationApi,
  dashboard: dashboardApi,
  doctor: doctorApi,
  doctorSchedule: doctorScheduleApi,
  loginHistory: loginHistoryApi,
  medical: medicalApi,
  menstrualCycle: menstrualCycleApi,
  packagePurchase: packagePurchaseApi,
  payment: paymentApi,
  serviceApi: serviceApiExports,
  servicePackage: servicePackageApi,
  services: servicesApi,
  stiTesting: stiTestingApi,
  user: userApi,
  userProfile: userProfileApi,
};

// Export individual endpoint APIs
export {
  authApi,
  appointmentApi,
  billingApi,
  consultationApi,
  dashboardApi,
  doctorApi,
  doctorScheduleApi,
  loginHistoryApi,
  medicalApi,
  menstrualCycleApi,
  packagePurchaseApi,
  paymentApi,
  serviceApiExports,
  servicePackageApi,
  servicesApi,
  stiTestingApi,
  userApi,
  userProfileApi,
  axiosInstance
};

// Export service layer utilities
export {
  handleAPI,
  userAPI,
  doctorAPI
};

// Export combined API object as default
export default api;

// Export commonly used types from endpoints
export type { Doctor, DoctorSchedule } from './endpoints/doctorApi';
export type { User } from './endpoints/userApi';

// Export commonly used types from types
export type { 
  ServicePackage, 
  ServiceItem, 
  CreateServicePackageRequest,
  UpdateServicePackageRequest,
  PackagePurchase, 
  UsedService 
} from '../types';
