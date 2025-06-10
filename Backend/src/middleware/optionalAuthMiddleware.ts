import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types";

// Optional authentication middleware - không bắt buộc token
// Nếu có token hợp lệ thì set req.user, nếu không thì skip
export const optionalAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Ưu tiên lấy token từ header Authorization
  let token: string | undefined | null = undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  // Nếu không có token, skip authentication
  if (!token) {
    req.user = undefined;
    return next();
  }

  if (!process.env.SECRET_KEY) {
    throw new Error("SECRET_KEY is not defined");
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY) as {
      _id: string;
      email: string;
      fullName: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    // Token không hợp lệ, skip authentication
    req.user = undefined;
    next();
  }
}; 