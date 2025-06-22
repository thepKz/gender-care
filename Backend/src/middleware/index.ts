import { verifyAdmin, verifyDoctor, verifyCustomer, verifyEmailVerification, verifyStaff, verifyToken } from "./auth";
import { authMiddleware } from "./authMiddleware";
import { roleMiddleware } from "./roleMiddleware";
import { 
    requireRole, 
    requireAnyRole, 
    hasRolePermission, 
    getRoleLevel,
    requireStaffOrAbove,
    requireManagerOrAbove,
    requireAdminOnly,
    requireDoctorAccess,
    requireCustomerAccess
} from "./roleHierarchy";

export {
    authMiddleware,
    roleMiddleware,
    verifyAdmin,
    verifyDoctor,
    verifyCustomer,
    verifyEmailVerification,
    verifyStaff,
    verifyToken,
    // New role hierarchy middleware
    requireRole,
    requireAnyRole,
    hasRolePermission,
    getRoleLevel,
    requireStaffOrAbove,
    requireManagerOrAbove,
    requireAdminOnly,
    requireDoctorAccess,
    requireCustomerAccess
};

