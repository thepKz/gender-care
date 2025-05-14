import axiosInstance from './axiosConfig';
import authApi from './endpoints/auth';
import blogApi from './endpoints/blog';
import consultationApi from './endpoints/consultation';
import menstrualCycleApi from './endpoints/menstrualCycle';
import stiTestingApi from './endpoints/stiTesting';

const api = {
  auth: authApi,
  consultation: consultationApi,
  menstrualCycle: menstrualCycleApi,
  stiTesting: stiTestingApi,
  blog: blogApi,
};

export {
    authApi, axiosInstance, blogApi, consultationApi,
    menstrualCycleApi,
    stiTestingApi
};

export default api; 