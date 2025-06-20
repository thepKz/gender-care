import { NextFunction, Response } from "express";
import { AuthRequest } from "../types";

/**
 * Role Hierarchy trong hệ thống:
 * 1. admin - Có tất cả quyền (highest level)
 * 2. manager - Có quyền staff + quyền riêng của manager  
 * 3. staff - Quyền cơ bản của nhân viên
 * 4. doctor - Quyền bác sĩ (parallel với staff)
 * 5. customer - Quyền khách hàng (lowest level)
 */

// Định nghĩa role hierarchy levels
const ROLE_LEVELS: Record<string, number> = {
  'admin': 100,     // Highest - có tất cả quyền
  'manager': 80,    // Manager level
  'staff': 60,      // Staff level  
  'doctor': 60,     // Doctor level (parallel với staff)
  'customer': 20    // Lowest level
};

// Các roles có thể thực hiện tính năng của nhau
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'admin': ['admin', 'manager', 'staff', 'doctor', 'customer'],
  'manager': ['manager', 'staff'],
  'staff': ['staff'],
  'doctor': ['doctor'],
  'customer': ['customer']
};

/**
 * Middleware kiểm tra quyền dựa trên role hierarchy
 * @param minimumRole - Role tối thiểu được yêu cầu
 * @returns Express middleware function
 */
export const requireRole = (minimumRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: "Unauthorized: User not logged in" 
        });
      }

      const userRole = req.user.role;
      
      // Kiểm tra role có tồn tại trong hệ thống không
      if (!ROLE_PERMISSIONS[userRole]) {
        return res.status(403).json({ 
          success: false,
          message: `Forbidden: Invalid role '${userRole}'` 
        });
      }

      // Kiểm tra user có quyền thực hiện action yêu cầu minimumRole không
      const allowedRoles = ROLE_PERMISSIONS[userRole];
      
      if (!allowedRoles.includes(minimumRole)) {
        return res.status(403).json({ 
          success: false,
          message: `Forbidden: Role '${userRole}' cannot perform actions requiring '${minimumRole}' permission` 
        });
      }

      // Log for debugging (có thể remove trong production)
      console.log(`🔐 [RoleHierarchy] User '${req.user.email}' (${userRole}) accessing endpoint requiring '${minimumRole}' - GRANTED`);
      
      next();
    } catch (error) {
      console.error('[RoleHierarchy] Error in role checking:', error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error during role verification" 
      });
    }
  };
};

/**
 * Middleware kiểm tra multiple roles (OR logic)
 * User chỉ cần có một trong các roles được chỉ định
 * @param roles - Array các roles được chấp nhận
 * @returns Express middleware function
 */
export const requireAnyRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: "Unauthorized: User not logged in" 
        });
      }

      const userRole = req.user.role;
      
      // Kiểm tra role có tồn tại trong hệ thống không
      if (!ROLE_PERMISSIONS[userRole]) {
        return res.status(403).json({ 
          success: false,
          message: `Forbidden: Invalid role '${userRole}'` 
        });
      }

      // Kiểm tra user có quyền thực hiện bất kỳ role nào trong danh sách không
      const allowedRoles = ROLE_PERMISSIONS[userRole];
      const hasPermission = roles.some(role => allowedRoles.includes(role));
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false,
          message: `Forbidden: Role '${userRole}' cannot perform actions requiring any of [${roles.join(', ')}] permissions` 
        });
      }

      // Log for debugging
      console.log(`🔐 [RoleHierarchy] User '${req.user.email}' (${userRole}) accessing endpoint requiring any of [${roles.join(', ')}] - GRANTED`);
      
      next();
    } catch (error) {
      console.error('[RoleHierarchy] Error in multiple role checking:', error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error during role verification" 
      });
    }
  };
};

/**
 * Utility function để kiểm tra user có quyền thực hiện action yêu cầu role không
 * @param userRole - Role của user hiện tại
 * @param requiredRole - Role yêu cầu để thực hiện action
 * @returns boolean - true nếu có quyền, false nếu không
 */
export const hasRolePermission = (userRole: string, requiredRole: string): boolean => {
  const allowedRoles = ROLE_PERMISSIONS[userRole];
  return allowedRoles ? allowedRoles.includes(requiredRole) : false;
};

/**
 * Utility function để lấy level của role (số càng cao = quyền càng lớn)
 * @param role - Role cần kiểm tra
 * @returns number - Level của role
 */
export const getRoleLevel = (role: string): number => {
  return ROLE_LEVELS[role] || 0;
};

// Backward compatibility - aliases cho các middleware cũ
export const requireStaffOrAbove = requireRole('staff');
export const requireManagerOrAbove = requireRole('manager');
export const requireAdminOnly = requireRole('admin');
export const requireDoctorAccess = requireRole('doctor');
export const requireCustomerAccess = requireRole('customer'); 