import axiosInstance from './axiosConfig';
import authApi from './endpoints/auth';
import blogApi from './endpoints/blog';
import consultationApi from './endpoints/consultation';
import doctorApi from './endpoints/doctor';
import doctorScheduleApi from './endpoints/doctorSchedule';
import menstrualCycleApi from './endpoints/menstrualCycle';
import stiTestingApi from './endpoints/stiTesting';
import userApi from './endpoints/userApi';
import userProfileApi from './endpoints/userProfileApi';

const api = {
  auth: authApi,
  consultation: consultationApi,
  doctor: doctorApi,
  doctorSchedule: doctorScheduleApi,
  menstrualCycle: menstrualCycleApi,
  stiTesting: stiTestingApi,
  blog: blogApi,
  user: userApi,
  userProfile: userProfileApi,
};

export {
    authApi, axiosInstance, blogApi, consultationApi,
    doctorApi,
    doctorScheduleApi,
    menstrualCycleApi,
    stiTestingApi,
    userApi,
    userProfileApi
};

export default api;

// API Configuration and Services
export { default as api } from './axiosConfig';

// API Services  
export { doctorAPI, type CreateDoctorRequest as CreateDoctorAPIRequest, type IDoctor } from './services/doctorAPI';
export * from './services/handleAPI';
export * from './services/userAPI';

// API Endpoints
export * from './endpoints';

// Types & Interfaces
export type { Doctor, DoctorSchedule } from './endpoints/doctorApi';
