// Permissions helper functions
export type UserRole = 'admin' | 'manager' | 'staff' | 'doctor' | 'customer';

// Doctor Management Permissions
export const canCreateDoctor = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

export const canUpdateDoctor = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

export const canDeleteDoctor = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

export const canViewDoctorDetails = (userRole: string): boolean => {
  return ['admin', 'manager', 'staff'].includes(userRole);
};

// Service Management Permissions
export const canCreateService = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

export const canUpdateService = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

export const canDeleteService = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

// User Management Permissions
export const canCreateUser = (userRole: string): boolean => {
  return ['admin'].includes(userRole);
};

export const canUpdateUser = (userRole: string): boolean => {
  return ['admin'].includes(userRole);
};

export const canDeleteUser = (userRole: string): boolean => {
  return ['admin'].includes(userRole);
};

// General Management Permissions
export const canAccessManagement = (userRole: string): boolean => {
  return ['admin', 'manager', 'staff'].includes(userRole);
};

export const canViewLoginHistory = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

// Helper function to get user role from localStorage
export const getCurrentUserRole = (): string => {
  try {
    const userInfo = localStorage.getItem('user_info');
    
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      return parsed.role || 'customer';
    }
    return 'customer';
  } catch {
    return 'customer';
  }
};

// Helper function to get user info from localStorage
export const getCurrentUser = () => {
  try {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      return JSON.parse(userInfo);
    }
    return null;
  } catch {
    return null;
  }
}; 