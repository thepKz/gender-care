import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";

export const authorizeManager = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user; // req.user is already available from AuthRequest interface

  // Updated: Allow admin and manager to access manager-only features
  if (!user || (user.role !== "manager" && user.role !== "admin")) {
    return res.status(403).json({ message: "Access denied. Manager or Admin role required." });
  }

  next();
}; 

export const authorizeStaffOrDoctorOrManager = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  
  console.log('authorizeStaffOrDoctorOrManager - user:', user);
  console.log('authorizeStaffOrDoctorOrManager - role:', user?.role);

  // Allow staff, doctor, manager and admin to access
  if (!user || !["staff", "doctor", "manager", "admin"].includes(user.role)) {
    console.log('Access denied for role:', user?.role);
    return res.status(403).json({ message: "Access denied. Staff, Doctor, Manager or Admin role required." });
  }

  console.log('Access granted for role:', user.role);
  next();
}; 