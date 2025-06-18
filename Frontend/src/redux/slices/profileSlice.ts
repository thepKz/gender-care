import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { User, userApi } from '../../api/endpoints/userApi';

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
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await userApi.getUserById(userId);
      return response.data.user;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Không thể lấy thông tin người dùng';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'profile/update',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await userApi.updateUserProfile(userData);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Không thể cập nhật thông tin người dùng';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateAvatar = createAsyncThunk(
  'profile/updateAvatar',
  async (avatarUrl: string, { rejectWithValue }) => {
    try {
      const response = await userApi.updateAvatar(avatarUrl);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Không thể cập nhật ảnh đại diện';
      return rejectWithValue(errorMessage);
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
      const response = await userApi.changePassword(currentPassword, newPassword);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Không thể đổi mật khẩu';
      return rejectWithValue(errorMessage);
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