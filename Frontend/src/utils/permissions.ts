// Permissions helper functions
export type UserRole = 'admin' | 'manager' | 'staff' | 'doctor' | 'customer';

// Menu item interface for type safety
export interface MenuItem {
  key: string;
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  children?: MenuItem[];
  requiredPermissions?: string[];
}

// ===== DOCTOR ACCOUNT MANAGEMENT (Admin Only) =====
export const canCreateDoctorAccount = (userRole: string): boolean => {
  // Chỉ Admin có thể tạo tài khoản bác sĩ mới
  return ['admin'].includes(userRole);
};

export const canDeleteDoctorAccount = (userRole: string): boolean => {
  // Chỉ Admin có thể xóa tài khoản bác sĩ
  return ['admin'].includes(userRole);
};

// ===== DOCTOR PROFILE MANAGEMENT =====
export const canEditDoctorProfile = (userRole: string): boolean => {
  // Chỉ Admin có thể sửa đổi hồ sơ bác sĩ (học vấn, chứng chỉ, etc.)
  return ['admin'].includes(userRole);
};

export const canViewDoctorProfiles = (userRole: string): boolean => {
  // Manager chỉ được xem (view-only), Admin có thể xem và sửa
  return ['admin', 'manager', 'staff'].includes(userRole);
};

export const canApproveDoctorProfile = (userRole: string): boolean => {
  // DEPRECATED: Removed approval workflow, Admin manages directly
  return ['admin'].includes(userRole);
};

export const canManageDoctorSchedule = (userRole: string): boolean => {
  // Admin, Manager, Staff có thể quản lý lịch làm việc của bác sĩ
  return ['admin', 'manager', 'staff'].includes(userRole);
};

// ===== LEGACY FUNCTIONS (for backward compatibility) =====
export const canCreateDoctor = (userRole: string): boolean => {
  return canCreateDoctorAccount(userRole);
};

export const canUpdateDoctor = (userRole: string): boolean => {
  return canEditDoctorProfile(userRole);
};

export const canDeleteDoctor = (userRole: string): boolean => {
  return canDeleteDoctorAccount(userRole);
};

export const canViewDoctorDetails = (userRole: string): boolean => {
  return canViewDoctorProfiles(userRole);
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

// ===== NEW: Menu-Level Permissions =====

// Menu access permissions for different features
export const canAccessUserManagement = (userRole: string): boolean => {
  return ['admin'].includes(userRole);
};

export const canAccessDoctorManagement = (userRole: string): boolean => {
  // Manager có thể access để view, Admin để manage
  return ['admin', 'manager'].includes(userRole);
};

export const canManageDoctorAccounts = (userRole: string): boolean => {
  // Chỉ Admin có thể tạo/sửa/xóa doctor accounts
  return ['admin'].includes(userRole);
};

export const canAccessServiceManagement = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

export const canAccessSystemLogs = (userRole: string): boolean => {
  return ['admin'].includes(userRole);
};

export const canAccessReports = (userRole: string): boolean => {
  // Chỉ admin và manager cần xem báo cáo tổng quan
  // Staff và Doctor focus vào operational tasks, không cần management reports
  return ['admin', 'manager'].includes(userRole);
};

// Create role-specific report permissions
export const canAccessManagementReports = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

export const canAccessOperationalReports = (userRole: string): boolean => {
  // Bác sĩ không cần báo cáo, chỉ cần dashboard cá nhân
  return false; // Removed doctor access to reports
};

export const canAccessSettings = (userRole: string): boolean => {
  return ['admin'].includes(userRole);
};

export const canAccessScheduleManagement = (userRole: string): boolean => {
  return ['admin', 'manager', 'staff', 'doctor'].includes(userRole);
};

export const canAccessAppointments = (userRole: string): boolean => {
  return ['admin', 'manager', 'staff', 'doctor'].includes(userRole);
};

export const canAccessMedicalRecords = (userRole: string): boolean => {
  return ['doctor'].includes(userRole);
};

export const canAccessConsultations = (userRole: string): boolean => {
  return ['doctor'].includes(userRole);
};

export const canAccessTestResults = (userRole: string): boolean => {
  return ['staff', 'doctor'].includes(userRole);
};

export const canAccessTestConfiguration = (userRole: string): boolean => {
  return ['admin', 'manager', 'staff'].includes(userRole);
};

export const canAccessMeetingHistory = (userRole: string): boolean => {
  return ['doctor'].includes(userRole);
};

export const canAccessDoctorProfile = (userRole: string): boolean => {
  return ['doctor'].includes(userRole);
};

export const canAccessMedicineManagement = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

export const canAccessTestCategoriesManagement = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

export const canAccessServicePackageManagement = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

export const canAccessRefundManagement = (userRole: string): boolean => {
  return ['admin', 'manager'].includes(userRole);
};

// ===== DOCTOR APPROVAL WORKFLOW PERMISSIONS =====
export const canViewDoctorChangeRequests = (userRole: string): boolean => {
  // Manager có thể xem các yêu cầu thay đổi hồ sơ bác sĩ
  return ['admin', 'manager'].includes(userRole);
};

export const canApproveDoctorChanges = (userRole: string): boolean => {
  // Manager có thể duyệt/từ chối thay đổi hồ sơ
  return ['admin', 'manager'].includes(userRole);
};

export const canCreateDoctorChangeRequest = (userRole: string): boolean => {
  // Bác sĩ có thể tạo yêu cầu thay đổi hồ sơ của mình
  return ['doctor'].includes(userRole);
};

export const canViewOwnDoctorProfile = (userRole: string): boolean => {
  // Bác sĩ có thể xem hồ sơ của chính mình
  return ['doctor'].includes(userRole);
};

// ===== Menu Permission Mapping =====

export const MenuPermissions = {
  // Management menu items
  'users': canAccessUserManagement,
  'doctors': canAccessDoctorManagement,
  'services': canAccessServiceManagement,
  'service-packages': canAccessServicePackageManagement,
  'medicines': canAccessMedicineManagement,
  'test-categories': canAccessTestCategoriesManagement,
  'refunds': canAccessRefundManagement,
  'login-history': canViewLoginHistory,
  'system-logs': canAccessSystemLogs,
  'reports': canAccessReports,
  'settings': canAccessSettings,
  'schedule': canAccessScheduleManagement,

  // Operational menu items
  'my-appointments': canAccessAppointments,
  'appointments': canAccessAppointments,
  'medical-records': canAccessMedicalRecords,
  'consultations': canAccessConsultations,
  'test-results': canAccessTestResults,
  'test-config': canAccessTestConfiguration,
  'meeting-history': canAccessMeetingHistory,
  'profile': canAccessDoctorProfile,

  // Submenu items for manager doctors section
  'doctors-profiles': canViewDoctorProfiles,
  'doctors-schedule': canManageDoctorSchedule,
  'doctors-performance': canAccessDoctorManagement,
  'doctors-specialties': canAccessDoctorManagement,
  'doctors-approvals': canViewDoctorChangeRequests,
  'doctors-change-requests': canViewDoctorChangeRequests,

  // Submenu items for manager services section
  'services-management': canAccessServiceManagement,
  'service-packages-management': canAccessServicePackageManagement,
} as const;

// ===== Menu Filtering Utility =====

/**
 * Filters menu items based on user role permissions
 * @param menuItems - Array of menu items to filter
 * @param userRole - Current user's role
 * @returns Filtered array of menu items that the user has permission to access
 */
export const filterMenuItemsByPermissions = (menuItems: MenuItem[], userRole: string): MenuItem[] => {
  return menuItems.filter(item => {
    // Check if this menu item has a permission check
    const permissionCheck = MenuPermissions[item.key as keyof typeof MenuPermissions];

    // If no permission check is defined, allow access (for generic items like dashboard)
    if (!permissionCheck) {
      // Always allow dashboard and overview
      if (['dashboard', 'overview'].includes(item.key)) {
        return true;
      }
      // For other items without defined permissions, default to false for security
      return false;
    }

    // Check if user has permission for this menu item
    const hasPermission = permissionCheck(userRole);

    // If item has children, recursively filter them
    if (item.children && hasPermission) {
      const filteredChildren = filterMenuItemsByPermissions(item.children, userRole);
      // Only show parent if it has accessible children or the parent itself is accessible
      return filteredChildren.length > 0;
    }

    return hasPermission;
  }).map(item => {
    // If item has children, filter them recursively
    if (item.children) {
      return {
        ...item,
        children: filterMenuItemsByPermissions(item.children, userRole)
      };
    }
    return item;
  });
};

/**
 * Check if user has access to a specific menu item
 * @param menuKey - The key of the menu item to check
 * @param userRole - Current user's role
 * @returns Boolean indicating if user has access
 */
export const hasMenuPermission = (menuKey: string, userRole: string): boolean => {
  const permissionCheck = MenuPermissions[menuKey as keyof typeof MenuPermissions];

  if (!permissionCheck) {
    // Always allow dashboard and overview
    if (['dashboard', 'overview'].includes(menuKey)) {
      return true;
    }
    return false;
  }

  return permissionCheck(userRole);
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

// Development helper - can be removed in production
export const demonstratePermissionFiltering = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Permission system active - check individual menu permissions via hasMenuPermission()');
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