import { NextFunction, Request, Response } from "express";

interface CustomRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

export const roleMiddleware = (roles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        console.log('❌ No user found in request');
        return res
          .status(401)
          .json({ message: "Unauthorized: User not logged in" });
      }

      if (!roles.includes(req.user.role)) {
        console.log('❌ Role permission denied. User role:', req.user.role, 'Required:', roles);
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient role permission" });
      }

      console.log('✅ Role middleware passed');
      next();
    } catch (error) {
      console.error('❌ Role middleware error:', error);
      res.status(500).json({ message: "Server Error" });
    }
  };
};
