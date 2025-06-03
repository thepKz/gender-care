import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";

export const authorizeManager = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user; // req.user is already available from AuthRequest interface

  if (!user || user.role !== "manager") {
    return res.status(403).json({ message: "Access denied. Manager role required." });
  }

  next();
}; 