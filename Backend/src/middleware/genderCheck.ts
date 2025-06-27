import { Request, Response, NextFunction } from 'express';
import { User } from '../models';

interface AuthRequest extends Request {
    user?: {
        _id: string;
        email: string;
        role: string;
        gender?: string;
    };
}

/**
 * Middleware kiểm tra user có phải nữ không cho các tính năng chu kỳ kinh nguyệt
 */
export const requireFemaleGender = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để sử dụng tính năng này'
            });
        }

        // Lấy thông tin gender của user
        const user = await User.findById(userId).select('gender');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin user'
            });
        }

        if (user.gender !== 'female') {
            return res.status(403).json({
                success: false,
                message: 'Tính năng chu kỳ kinh nguyệt chỉ dành cho phụ nữ',
                code: 'GENDER_NOT_ALLOWED'
            });
        }

        // Thêm thông tin gender vào req.user để các handler khác sử dụng
        if (req.user) {
            req.user.gender = user.gender;
        }

        next();
    } catch (error) {
        console.error('Gender check middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi server khi kiểm tra quyền truy cập'
        });
    }
}; 