import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { getProfile, login, logout, register } from '../redux/slices/authSlice';
import { User } from '../types';
import { STORAGE_KEYS } from '../utils/localStorage';

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

interface UseAuthResult {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  handleLogin: (params: LoginParams) => Promise<void>;
  handleRegister: (params: RegisterParams) => Promise<void>;
  handleLogout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

/**
 * Custom hook để xử lý xác thực người dùng
 */
export const useAuth = (): UseAuthResult => {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  /**
   * Xử lý đăng nhập
   */
  const handleLogin = useCallback(
    async (params: LoginParams) => {
      try {
        await dispatch(login(params)).unwrap();
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    [dispatch]
  );

  /**
   * Xử lý đăng ký
   */
  const handleRegister = useCallback(
    async (params: RegisterParams) => {
      try {
        await dispatch(register(params)).unwrap();
      } catch (error) {
        console.error('Register failed:', error);
      }
    },
    [dispatch]
  );

  /**
   * Xử lý đăng xuất
   */
  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logout()).unwrap();
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [dispatch]);

  /**
   * Lấy thông tin người dùng
   */
  const fetchProfile = useCallback(async () => {
    try {
      if (token) {
        await dispatch(getProfile()).unwrap();
      }
    } catch (error) {
      console.error('Fetch profile failed:', error);
    }
  }, [dispatch, token]);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    handleLogin,
    handleRegister,
    handleLogout,
    fetchProfile,
  };
}; 