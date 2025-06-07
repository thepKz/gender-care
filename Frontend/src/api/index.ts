import axiosInstance from './axiosConfig';
import authApi from './endpoints/auth';
import blogApi from './endpoints/blog';
import consultationApi from './endpoints/consultation';
import menstrualCycleApi from './endpoints/menstrualCycle';
import stiTestingApi from './endpoints/stiTesting';
import userApi from './endpoints/userApi';
import userProfileApi from './endpoints/userProfileApi';

const api = {
  auth: authApi,
  consultation: consultationApi,
  menstrualCycle: menstrualCycleApi,
  stiTesting: stiTestingApi,
  blog: blogApi,
  user: userApi,
  userProfile: userProfileApi,
};

export {
  authApi, axiosInstance, blogApi, consultationApi,
  menstrualCycleApi,
  stiTestingApi,
  userApi,
  userProfileApi
};

export default api; 