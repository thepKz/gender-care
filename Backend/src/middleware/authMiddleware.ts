import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types";

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('🔍 [Auth] authMiddleware called for:', req.method, req.path);
  console.log('🔍 [Auth] Headers:', req.headers.authorization);
  console.log('🔍 [Auth] Cookies:', req.cookies?.access_token ? 'Present' : 'Not present');
  
  // Ưu tiên lấy token từ header Authorization
  let token: string | undefined | null = undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log('🔍 [Auth] Token from header:', token ? 'Present' : 'Not present');
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
    console.log('🔍 [Auth] Token from cookie:', token ? 'Present' : 'Not present');
  }

  if (!token) {
    console.log('❌ [Auth] No token provided');
    return res.status(401).json({ message: "Unauthorized: No token provided" });
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

    console.log('✅ [Auth] Token decoded successfully:', { 
      userId: decoded._id, 
      email: decoded.email, 
      role: decoded.role 
    });

    req.user = decoded;

    next();
  } catch (error: any) {
    console.log('❌ [Auth] Token verification failed:', error.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
