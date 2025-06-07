import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { UserProfile } from '../types';

interface UserProfileState {
  profiles: UserProfile[];
  loading: boolean;
  error: string | null;
  selectedProfile: UserProfile | null;
  searchQuery: string;
  sortBy: 'name' | 'date' | 'gender';
  sortOrder: 'asc' | 'desc';
  filterGender: 'all' | 'male' | 'female' | 'other';
}

type UserProfileAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROFILES'; payload: UserProfile[] }
  | { type: 'ADD_PROFILE'; payload: UserProfile }
  | { type: 'UPDATE_PROFILE'; payload: UserProfile }
  | { type: 'DELETE_PROFILE'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SELECTED_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SORT'; payload: { sortBy: 'name' | 'date' | 'gender'; sortOrder: 'asc' | 'desc' } }
  | { type: 'SET_FILTER_GENDER'; payload: 'all' | 'male' | 'female' | 'other' }
  | { type: 'RESET_FILTERS' };

const initialState: UserProfileState = {
  profiles: [],
  loading: false,
  error: null,
  selectedProfile: null,
  searchQuery: '',
  sortBy: 'date',
  sortOrder: 'desc',
  filterGender: 'all'
};

const userProfileReducer = (state: UserProfileState, action: UserProfileAction): UserProfileState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_PROFILES':
      return { ...state, profiles: action.payload, error: null };
    
    case 'ADD_PROFILE':
      return { ...state, profiles: [action.payload, ...state.profiles] };
    
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profiles: state.profiles.map(profile =>
          profile._id === action.payload._id ? action.payload : profile
        ),
        selectedProfile: state.selectedProfile?._id === action.payload._id ? action.payload : state.selectedProfile
      };
    
    case 'DELETE_PROFILE':
      return {
        ...state,
        profiles: state.profiles.filter(profile => profile._id !== action.payload),
        selectedProfile: state.selectedProfile?._id === action.payload ? null : state.selectedProfile
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SELECTED_PROFILE':
      return { ...state, selectedProfile: action.payload };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_SORT':
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
    
    case 'SET_FILTER_GENDER':
      return { ...state, filterGender: action.payload };
    
    case 'RESET_FILTERS':
      return {
        ...state,
        searchQuery: '',
        sortBy: 'date',
        sortOrder: 'desc',
        filterGender: 'all'
      };
    
    default:
      return state;
  }
};

interface UserProfileContextType {
  state: UserProfileState;
  dispatch: React.Dispatch<UserProfileAction>;
  
  // Helper functions
  getFilteredAndSortedProfiles: () => UserProfile[];
  clearError: () => void;
  resetFilters: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(userProfileReducer, initialState);

  // Helper function để lấy profiles đã được filter và sort
  const getFilteredAndSortedProfiles = (): UserProfile[] => {
    let filteredProfiles = [...state.profiles];

    // Filter by search query
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.fullName.toLowerCase().includes(query) ||
        profile.phone?.toLowerCase().includes(query)
      );
    }

    // Filter by gender
    if (state.filterGender !== 'all') {
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.gender === state.filterGender
      );
    }

    // Sort profiles
    filteredProfiles.sort((a, b) => {
      let compareValue = 0;

      switch (state.sortBy) {
        case 'name':
          compareValue = a.fullName.localeCompare(b.fullName);
          break;
        case 'date':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'gender':
          compareValue = a.gender.localeCompare(b.gender);
          break;
        default:
          compareValue = 0;
      }

      return state.sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filteredProfiles;
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const resetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' });
  };

  const contextValue: UserProfileContextType = {
    state,
    dispatch,
    getFilteredAndSortedProfiles,
    clearError,
    resetFilters
  };

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
};

// Custom hook để sử dụng UserProfile context
export const useUserProfile = (): UserProfileContextType => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within UserProfileProvider');
  }
  return context;
}; 