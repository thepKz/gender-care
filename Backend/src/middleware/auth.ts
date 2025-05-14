import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: "admin" | "user" | "guest";
  };
}

// Middleware xác thực token
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Không có token xác thực" });
    }

    if (!process.env.SECRET_KEY) {
      throw new Error("SECRET_KEY không được định nghĩa");
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY) as {
      _id: string;
      role: "admin" | "user" | "guest";
    };

    // Kiểm tra user có tồn tại và không bị disabled
    const user = await User.findById(decoded._id);
    if (!user || user.isDisabled) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc tài khoản đã bị khóa" });
    }

    req.user = decoded;
    next();
  } catch (error) {
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

// Middleware kiểm tra quyền user (customer)
export const verifyUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không có thông tin người dùng" });
    }

    const user = await User.findById(req.user._id);
    if (!user || (user.role !== "user" && user.role !== "admin")) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Middleware kiểm tra quyền guest
export const verifyGuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Không có thông tin người dùng" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    // Guest có thể truy cập các tài nguyên công khai
    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
}; 