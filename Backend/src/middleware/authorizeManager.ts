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