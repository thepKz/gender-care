// @ts-nocheck
import { NextFunction, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { AuthRequest } from "../types";

// Middleware xác thực token
export const verifyToken: RequestHandler = async (
  req,
  res,
  next
) => {
  const authReq = req as AuthRequest;
  try {
    // Ưu tiên lấy token từ header Authorization
    let token: string | undefined | null = undefined;
    const authHeader = authReq.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({ message: "Không có token xác thực" });
      return;
    }

    // Kiểm tra token có đúng format JWT không (3 phần ngăn cách bởi dấu chấm)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      res.status(401).json({ message: "Token không đúng định dạng JWT" });
      return;
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

    // Kiểm tra user có tồn tại và đang hoạt động
    const user = await User.findById(decoded._id);
    if (!user || !user.isActive) {
      res.status(401).json({ message: "Token không hợp lệ hoặc tài khoản đã bị khóa" });
      return;
    }

    authReq.user = decoded;
    next();
  } catch (error) {
    // Chỉ log khi có lỗi thật sự không phải 401 thông thường
    if (process.env.NODE_ENV === 'development') {
      console.error('[verifyToken] Auth error:', error);
    }

    if (error instanceof jwt.JsonWebTokenError) {
      if (error.message === 'jwt malformed') {
        res.status(401).json({ message: "Token không đúng định dạng" });
        return;
      } else if (error.message === 'jwt expired') {
        res.status(401).json({ message: "Token đã hết hạn" });
        return;
      } else if (error.message === 'invalid signature') {
        res.status(401).json({ message: "Chữ ký token không hợp lệ" });
        return;
      }
    }

    res.status(401).json({ message: "Token không hợp lệ" });
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