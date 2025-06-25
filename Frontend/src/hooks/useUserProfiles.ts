import { useCallback } from 'react';
import { notification } from 'antd';
import dayjs from 'dayjs';
import { UserProfile } from '../types';
import userProfileApi, { CreateUserProfileRequest, UpdateUserProfileRequest } from '../api/endpoints/userProfileApi';
import { useUserProfile } from '../context/UserProfileContext';

export const useUserProfiles = () => {
  const { state, dispatch, getFilteredAndSortedProfiles, clearError, resetFilters } = useUserProfile();

  // Tải danh sách profiles
  const loadProfiles = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const profiles = await userProfileApi.getMyProfiles();
      dispatch({ type: 'SET_PROFILES', payload: profiles });
      
      return { success: true, data: profiles };
    } catch (error: any) {
      const errorMessage = error.message || 'Lỗi khi tải danh sách hồ sơ';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: errorMessage,
        duration: 4
      });
      
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Tạo profile mới
  const createProfile = useCallback(async (data: CreateUserProfileRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const newProfile = await userProfileApi.createProfile(data);
      dispatch({ type: 'ADD_PROFILE', payload: newProfile });
      
      notification.success({
        message: 'Thành công',
        description: 'Hồ sơ bệnh án đã được tạo thành công',
        duration: 3
      });
      
      return { success: true, data: newProfile };
    } catch (error: any) {
      const errorMessage = error.message || 'Lỗi khi tạo hồ sơ';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      notification.error({
        message: 'Lỗi tạo hồ sơ',
        description: errorMessage,
        duration: 4
      });
      
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Cập nhật profile
  const updateProfile = useCallback(async (id: string, data: UpdateUserProfileRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const updatedProfile = await userProfileApi.updateProfile(id, data);
      dispatch({ type: 'UPDATE_PROFILE', payload: updatedProfile });
      
      notification.success({
        message: 'Thành công',
        description: 'Hồ sơ bệnh án đã được cập nhật',
        duration: 3
      });
      
      return { success: true, data: updatedProfile };
    } catch (error: any) {
      const errorMessage = error.message || 'Lỗi khi cập nhật hồ sơ';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      notification.error({
        message: 'Lỗi cập nhật',
        description: errorMessage,
        duration: 4
      });
      
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Xóa profile
  const deleteProfile = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await userProfileApi.deleteProfile(id);
      dispatch({ type: 'DELETE_PROFILE', payload: id });
      
      notification.success({
        message: 'Thành công',
        description: 'Hồ sơ bệnh án đã được xóa',
        duration: 3
      });
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Lỗi khi xóa hồ sơ';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      notification.error({
        message: 'Lỗi xóa hồ sơ',
        description: errorMessage,
        duration: 4
      });
      
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Lấy profile theo ID
  const getProfileById = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const profile = await userProfileApi.getProfileById(id);
      dispatch({ type: 'SET_SELECTED_PROFILE', payload: profile });
      
      return { success: true, data: profile };
    } catch (error: any) {
      const errorMessage = error.message || 'Lỗi khi tải hồ sơ';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: errorMessage,
        duration: 4
      });
      
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Tìm kiếm profiles
  const searchProfiles = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, [dispatch]);

  // Sắp xếp profiles
  const sortProfiles = useCallback((sortBy: 'name' | 'date' | 'gender', sortOrder: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
  }, [dispatch]);

  // Lọc theo giới tính
  const filterByGender = useCallback((gender: 'all' | 'male' | 'female' | 'other') => {
    dispatch({ type: 'SET_FILTER_GENDER', payload: gender });
  }, [dispatch]);

  // Lọc theo khoảng thời gian
  const filterByDateRange = useCallback((dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    dispatch({ type: 'SET_FILTER_DATE_RANGE', payload: dateRange });
  }, [dispatch]);

  // Chọn profile
  const selectProfile = useCallback((profile: UserProfile | null) => {
    dispatch({ type: 'SET_SELECTED_PROFILE', payload: profile });
  }, [dispatch]);

  // Lấy statistics
  const getStatistics = useCallback(() => {
    const { profiles } = state;
    const total = profiles.length;
    const maleCount = profiles.filter(p => p.gender === 'male').length;
    const femaleCount = profiles.filter(p => p.gender === 'female').length;
    const otherCount = profiles.filter(p => p.gender === 'other').length;
    
    return {
      total,
      male: maleCount,
      female: femaleCount,
      other: otherCount,
      recentCount: profiles.filter(p => {
        const daysDiff = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 30;
      }).length
    };
  }, [state.profiles]);

  // Kiểm tra có filter đang hoạt động
  const hasActiveFilters = useCallback(() => {
    return state.searchQuery.trim() !== '' || 
           state.filterGender !== 'all' || 
           (state.filterDateRange && state.filterDateRange.length === 2);
  }, [state.searchQuery, state.filterGender, state.filterDateRange]);

  return {
    // State
    profiles: state.profiles,
    filteredProfiles: getFilteredAndSortedProfiles(),
    loading: state.loading,
    error: state.error,
    selectedProfile: state.selectedProfile,
    searchQuery: state.searchQuery,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    filterGender: state.filterGender,
    filterDateRange: state.filterDateRange,
    
    // Actions
    loadProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfileById,
    searchProfiles,
    sortProfiles,
    filterByGender,
    filterByDateRange,
    selectProfile,
    
    // Utilities
    clearError,
    resetFilters,
    getStatistics,
    hasActiveFilters,
    getCurrentFilters: () => ({
      gender: state.filterGender,
      dateRange: state.filterDateRange
    })
  };
}; 