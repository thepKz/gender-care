import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { AuthRequest } from "../types";

// Middleware xác thực token
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ưu tiên lấy token từ header Authorization
    let token: string | undefined | null = undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    // Debug log để kiểm tra token
    console.log('[verifyToken] Auth header:', authHeader);
    console.log('[verifyToken] Token extracted:', token ? `${token.substring(0, 20)}...` : 'null/undefined');
    console.log('[verifyToken] Token type:', typeof token);
    console.log('[verifyToken] Token length:', token ? token.length : 0);

    if (!token) {
      console.log('[verifyToken] No token provided');
      return res.status(401).json({ message: "Không có token xác thực" });
    }

    // Kiểm tra token có đúng format JWT không (3 phần ngăn cách bởi dấu chấm)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('[verifyToken] Invalid JWT format - parts count:', tokenParts.length);
      console.log('[verifyToken] Token parts:', tokenParts);
      return res.status(401).json({ message: "Token không đúng định dạng JWT" });
    }

    // Kiểm tra từng phần của JWT có hợp lệ không
    try {
      // Decode header để kiểm tra
      const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
      console.log('[verifyToken] JWT header:', header);
    } catch (headerError) {
      console.log('[verifyToken] Invalid JWT header:', headerError);
      return res.status(401).json({ message: "JWT header không hợp lệ" });
    }

    if (!process.env.SECRET_KEY) {
      throw new Error("SECRET_KEY không được định nghĩa");
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY) as {
      _id: string;
      email: string;
      fullName: string;
      role: string;
    };

    console.log('[verifyToken] JWT decoded successfully:', { 
      _id: decoded._id, 
      email: decoded.email, 
      role: decoded.role 
    });

    // Kiểm tra user có tồn tại và đang hoạt động
    const user = await User.findById(decoded._id);
    if (!user || !user.isActive) {
      console.log('[verifyToken] User not found or inactive:', decoded._id);
      return res.status(401).json({ message: "Token không hợp lệ hoặc tài khoản đã bị khóa" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    // Log lỗi xác thực token với thông tin chi tiết
    console.error('[verifyToken] JWT verify error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      if (error.message === 'jwt malformed') {
        console.error('[verifyToken] JWT malformed - token format invalid');
        return res.status(401).json({ message: "Token không đúng định dạng" });
      } else if (error.message === 'jwt expired') {
        console.error('[verifyToken] JWT expired');
        return res.status(401).json({ message: "Token đã hết hạn" });
      } else if (error.message === 'invalid signature') {
        console.error('[verifyToken] JWT invalid signature');
        return res.status(401).json({ message: "Chữ ký token không hợp lệ" });
      }
    }
    
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

// Middleware kiểm tra quyền admin
export const verifyAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không có thông tin người dùng" });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Middleware kiểm tra quyền staff hoặc manager
export const verifyStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không có thông tin người dùng" });
    }

    const user = await User.findById(req.user._id);
    if (!user || (user.role !== "staff" && user.role !== "manager" && user.role !== "admin")) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Middleware kiểm tra quyền customer
export const verifyCustomer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không có thông tin người dùng" });
    }

    const user = await User.findById(req.user._id);
    if (!user || (user.role !== "customer" && user.role !== "admin")) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Middleware kiểm tra quyền doctor
export const verifyDoctor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không có thông tin người dùng" });
    }

    const user = await User.findById(req.user._id);
    if (!user || (user.role !== "doctor" && user.role !== "admin")) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Middleware kiểm tra đã xác thực email
export const verifyEmailVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không có thông tin người dùng" });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.emailVerified) {
      return res.status(403).json({ 
        message: "Vui lòng xác thực email trước khi sử dụng tính năng này",
        requireEmailVerification: true
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
}; 