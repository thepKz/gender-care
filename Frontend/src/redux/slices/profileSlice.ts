import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { userApi } from '../../api';
import { User } from '../../types';

interface ProfileState {
  data: User | null;
  loading: boolean;
  error: string | null;
  updateSuccess: boolean;
}

const initialState: ProfileState = {
  data: null,
  loading: false,
  error: null,
  updateSuccess: false,
};

// Async thunks
export const fetchProfile = createAsyncThunk(
  'profile/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const userData = await userApi.getProfile();
      return userData;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể lấy thông tin người dùng'
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'profile/update',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await userApi.updateProfile(userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể cập nhật thông tin người dùng'
      );
    }
  }
);

export const updateAvatar = createAsyncThunk(
  'profile/updateAvatar',
  async (avatarUrl: string, { rejectWithValue }) => {
    try {
      const response = await userApi.updateAvatar(avatarUrl);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể cập nhật ảnh đại diện'
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  'profile/changePassword',
  async (
    { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await userApi.changePassword({
        currentPassword,
        newPassword,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể đổi mật khẩu'
      );
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    resetProfileStatus: (state) => {
      state.error = null;
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.updateSuccess = true;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.updateSuccess = false;
      })

      // Update avatar
      .addCase(updateAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateAvatar.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.updateSuccess = true;
        state.error = null;
      })
      .addCase(updateAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.updateSuccess = false;
      })

      // Change password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.updateSuccess = true;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.updateSuccess = false;
      });
  },
});

export const { resetProfileStatus } = profileSlice.actions;
export default profileSlice.reducer; 