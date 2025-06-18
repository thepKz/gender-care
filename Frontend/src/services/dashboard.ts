import api from '../api/axiosConfig';

export const fetchManagementDashboard = async () => {
  const res = await api.get('/dashboard/management');
  return res.data.data; // API trả về { success: true, data: {...} }
};

export const fetchOperationalDashboard = async () => {
  const res = await api.get('/dashboard/operational');
  return res.data.data; // API trả về { success: true, data: {...} }
}; 