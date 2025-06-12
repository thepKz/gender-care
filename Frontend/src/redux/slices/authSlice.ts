import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { authApi } from '../../api';
import { User } from '../../types';
import { clearAllCookies } from '../../utils/cookieUtils';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// 1. Khởi tạo initialState từ localStorage nếu có token/user
const getUserFromLocalStorage = () => {
  const userStr = localStorage.getItem('user_info');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};
const initialState: AuthState = {
  user: getUserFromLocalStorage(),
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,
};

// Helper function để xử lý lỗi từ API
const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError && error.response?.data?.message) {
    const errorMsg = error.response.data.message;
    
    // Chuyển đổi các thông báo lỗi phổ biến sang tiếng Việt
    if (errorMsg.includes('Unauthorized') || errorMsg.includes('Invalid token') || errorMsg.includes('No token')) {
      return 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại';
    }
    
    if (errorMsg.includes('secretOrPrivateKey must have a value')) {
      return 'Lỗi máy chủ xác thực, vui lòng liên hệ quản trị viên';
    }
    
    if (errorMsg.includes('Email already exists') || errorMsg.includes('đã được sử dụng')) {
      return 'Email này đã được sử dụng, vui lòng chọn email khác';
    }
    
    if (errorMsg.includes('Invalid credentials') || errorMsg.includes('Incorrect password')) {
      return 'Thông tin đăng nhập không chính xác, vui lòng thử lại';
    }

    if (errorMsg.includes('User not found') || errorMsg.includes('không tồn tại')) {
      return 'Tài khoản không tồn tại';
    }
    
    if (errorMsg.includes('Server error') || errorMsg.includes('Internal')) {
      return 'Đã có lỗi xảy ra, vui lòng thử lại sau';
    }
    
    // Trả về thông báo gốc nếu đã là tiếng Việt hoặc không khớp với các trường hợp trên
    return errorMsg;
  } else if (error instanceof Error) {
    // Chuyển đổi một số thông báo lỗi JavaScript phổ biến
    if (error.message.includes('Network Error')) {
      return 'Không thể kết nối đến máy chủ, vui lòng kiểm tra kết nối mạng';
    }
    if (error.message.includes('timeout')) {
      return 'Máy chủ phản hồi quá lâu, vui lòng thử lại sau';
    }
    if (error.message === 'Request cancelled') {
      // Đây là trường hợp request bị hủy có chủ ý (ví dụ: không có token)
      return 'Không có thông tin đăng nhập';
    }
    return error.message;
  }
  return 'Đã xảy ra lỗi, vui lòng thử lại sau';
};

// 1. Thêm các hàm helper để lưu/xóa accessToken, refreshToken vào localStorage
const saveTokensToLocalStorage = (accessToken: string, refreshToken: string) => {
  // Đảm bảo token là string, không phải object
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    console.error('[saveTokensToLocalStorage] Token không phải string:', { accessToken, refreshToken });
    return;
  }
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};
const clearTokensFromLocalStorage = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// 2. Sửa login, register: KHÔNG gọi getProfile nữa, chỉ lưu token và cập nhật Redux
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.login({ email, password });
      const { accessToken, refreshToken, ...userData } = response.data.data;
      saveTokensToLocalStorage(accessToken, refreshToken);
      localStorage.setItem('user_info', JSON.stringify(userData));
      return { user: userData, accessToken, refreshToken };
    } catch (error: unknown) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { email: string; password: string; fullName: string; phone?: string; gender: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      const responseData = response.data.data;
      const { accessToken, refreshToken, ...user } = responseData;
      // Kiểm tra token phải là string
      if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
        console.error('[register] Token không phải string:', { accessToken, refreshToken });
        return rejectWithValue('Token trả về từ server không hợp lệ');
      }
      saveTokensToLocalStorage(accessToken, refreshToken);
      localStorage.setItem('user_info', JSON.stringify(user));
      return { user, accessToken, refreshToken };
    } catch (error: unknown) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// 4. Khi logout, clear user_info khỏi localStorage và cookies
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      clearTokensFromLocalStorage();
      localStorage.removeItem('user_info');
      clearAllCookies();
      return true;
    } catch (error: unknown) {
      // Ngay cả khi API logout lỗi, vẫn xóa thông tin phía client
      clearTokensFromLocalStorage();
      localStorage.removeItem('user_info');
      clearAllCookies();
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Google login action
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (token: string, { rejectWithValue }) => {
    try {
      console.log('Sending Google token to backend...');
      const response = await authApi.googleLogin(token);
      const userData = response.data.data;
      
      // Extract tokens từ response data
      const { accessToken, refreshToken, ...userInfo } = userData;
      
      // Lưu tokens vào localStorage như login thông thường
      if (accessToken && refreshToken) {
        saveTokensToLocalStorage(accessToken, refreshToken);
        console.log('Google OAuth tokens saved to localStorage');
      }
      
      // Lưu thông tin user vào localStorage để persist
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      
      console.log('Google login success, user data:', userInfo);
      return { user: userInfo, accessToken, refreshToken };
    } catch (error: unknown) {
      console.error('Google login failed:', error);
      
      // Handle specific error types
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return rejectWithValue('Kết nối bị gián đoạn. Vui lòng kiểm tra mạng và thử lại.');
        }
        
        if (error.response?.status === 408) {
          return rejectWithValue('Xác thực Google mất quá nhiều thời gian. Vui lòng thử lại.');
        }
        
        if (error.response?.status === 400) {
          return rejectWithValue('Token Google không hợp lệ. Vui lòng thử đăng nhập lại.');
        }
        
        if (error.response?.data?.message) {
          return rejectWithValue(error.response.data.message);
        }
      }
      
      return rejectWithValue(handleApiError(error));
    }
  }
);

// 3. Sửa getProfile: chỉ gọi nếu có access_token trong localStorage
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      if (!localStorage.getItem('access_token')) {
        return rejectWithValue('Không có thông tin đăng nhập');
      }
      const response = await authApi.getProfile();
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        return rejectWithValue('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
      }
      return rejectWithValue(handleApiError(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      } else {
        state.user = action.payload as User;
      }
      state.isAuthenticated = true;
      // Đồng bộ dữ liệu user đã cập nhật về localStorage
      if (state.user) {
        localStorage.setItem('user_info', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Register cases
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Logout cases
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Google login cases
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Get profile cases
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        const userData = action.payload.data || action.payload;
        state.user = userData;
        state.isAuthenticated = true;
        state.error = null;
        // Đồng bộ dữ liệu user mới nhất về localStorage để tránh mất avatar sau refresh
        localStorage.setItem('user_info', JSON.stringify(userData));
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        const error = action.payload as string;
        if (error === 'Không có thông tin đăng nhập' || 
            error === 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại') {
          state.error = null;
        } else {
          state.error = error;
        }
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;

export default authSlice.reducer; 