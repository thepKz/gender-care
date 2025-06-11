import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import fs from 'fs';
import { OtpCode, User } from "../models";
import {
    sendResetPasswordEmail
} from "../services/emails";
import { uploadToCloudinary } from '../services/uploadService';
import { AuthRequest } from "../types";
import mongoose from 'mongoose';

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Không tìm thấy ID người dùng" });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin người dùng" });
    }

    const formattedProfile = {
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive
    };
    return res.status(200).json({ data: formattedProfile });
  } catch (error: any) {
    console.log("Error in getUser:", error);
    return res.status(500).json({
      message: "Đã xảy ra lỗi khi xử lý yêu cầu",
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const {
      fullName,
      phone,
      avatar,
    } = req.body;

    const userUpdateData: any = {
      phone,
      avatar,
    };

    if (fullName) {
      userUpdateData.fullName = fullName;
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      userUpdateData,
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(500)
        .json({ message: "Có lỗi xảy ra khi cập nhật thông tin" });
    }

    const formattedUser = {
      id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      phone: updatedUser.phone,
    };

    return res
      .status(200)
      .json({ message: "Cập nhật thành công!", data: formattedUser });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const checkEmailWithPhoneNumber = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, phone } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      const existedEmail = await User.findOne({ email });

      if (existedEmail) {
        return res.status(200).json({ exists: true });
      } else {
        return res.status(200).json({ exists: false });
      }
    } else {
      const emailCheck = await User.findOne({ email });

      if (emailCheck && emailCheck._id.toString() !== user._id.toString()) {
        return res.status(200).json({ exists: true });
      } else {
        return res.status(200).json({ exists: false });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Đã xảy ra lỗi khi kiểm tra thông tin",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, role, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query object
    const query: any = {};
    
    // Filter by role if provided
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Search by name, email or phone
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Sort options
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password') // Exclude password
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitNum);
    
    // Get role statistics
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    res.status(200).json({
      success: true,
      message: `Lấy danh sách người dùng thành công`,
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalUsers,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        statistics: {
          totalUsers,
          roleStats: roleStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          filters: { role, search, sortBy, sortOrder }
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách người dùng',
      error: error.message
    });
  }
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const currentUserRole = (req as any).user?.role; // Get current user's role
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
      return;
    }
    
    // Prevent deactivating admin accounts
    if (user.role === 'admin') {
      res.status(403).json({
        success: false,
        message: 'Không thể khóa tài khoản Admin'
      });
      return;
    }
    
    const newStatus = !user.isActive;
    user.isActive = newStatus;
    user.updatedAt = new Date();
    await user.save();
    
    // Log the change
    const action = newStatus ? 'activated' : 'deactivated';
    const actionBy = currentUserRole === 'manager' ? 'MANAGER' : 'ADMIN';
    console.log(`[${actionBy} ACTION] User ${user.email} ${action}. Reason: ${reason || 'No reason provided'}`);
    
    res.status(200).json({
      success: true,
      message: `${newStatus ? 'Kích hoạt' : 'Khóa'} tài khoản thành công`,
      data: {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        isActive: newStatus,
        updatedAt: user.updatedAt
      }
    });
    
  } catch (error: any) {
    console.error('Error in toggleUserStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái tài khoản',
      error: error.message
    });
  }
};

export const checkPhoneNumber = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    return res.status(200).json({ exists: !!user, userId: user?._id });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    // Tạo OTP cho reset password
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // HardCode
    // Tạo thời gian hết hạn (10 phút)
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 10);
    
    // Lưu OTP vào database
    await OtpCode.create({
      userId: user._id,
      type: "password_reset",
      otp,
      expires: expiryDate,
      verified: false,
      attempts: 0
    });

    await sendResetPasswordEmail(user.email, otp, user.fullName);

    return res.status(200).json({
      message: "Mã xác nhận đã được gửi đến email của bạn",
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Đã xảy ra lỗi khi gửi yêu cầu",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    // Kiểm tra OTP
    const otpRecord = await OtpCode.findOne({
      userId: user._id,
      type: "password_reset",
      otp,
      expires: { $gt: new Date() },
      verified: false
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Mã xác nhận không hợp lệ hoặc đã hết hạn",
      });
    }

    // Cập nhật OTP thành đã sử dụng
    otpRecord.verified = true;
    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    // Cập nhật mật khẩu
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Đã xảy ra lỗi khi đặt lại mật khẩu",
    });
  }
};

// Tìm kiếm người dùng
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy as string || "createdAt";
    const sortOrder = req.query.sortOrder as string || "desc";
    const role = req.query.role as string;
    
    // Xây dựng query tìm kiếm
    const searchQuery: any = {};
    
    // Thêm bộ lọc tìm kiếm cơ bản
    if (query) {
      searchQuery.$or = [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } }
      ];
    }
    
    // Thêm bộ lọc theo role
    if (role && ["admin", "customer", "doctor", "staff", "manager"].includes(role)) {
      searchQuery.role = role;
    }
    
    // Xác định hướng sắp xếp
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    
    // Thực hiện tìm kiếm với bộ lọc và phân trang
    const users = await User.find(searchQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select("-password"); // Không trả về trường password
    
    // Đếm tổng số kết quả
    const total = await User.countDocuments(searchQuery);
    
    // Thêm thông tin meta
    const filters = {
      query: query || undefined,
      role: role || undefined,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc"
    };
    
    return res.status(200).json({
      users,
      filters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Đã xảy ra lỗi khi tìm kiếm người dùng",
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, avatar, gender, address, year, role } = req.body;
    const currentUserRole = (req as any).user?.role; // Get current user's role
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        success: false,
        message: "Thiếu thông tin bắt buộc" 
      });
    }
    
    // Manager restrictions: cannot create admin users
    if (currentUserRole === 'manager' && role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Manager không thể tạo tài khoản Admin'
      });
    }
    
    const existed = await User.findOne({ email });
    if (existed) {
      return res.status(409).json({ 
        success: false,
        message: "Email đã tồn tại" 
      });
    }
    
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hash,
      fullName,
      phone,
      avatar,
      gender,
      address,
      year,
      role: role || "customer",
    });
    
    // Remove password from response
    const userResponse = user.toObject();
    const { password: _, ...userWithoutPassword } = userResponse;
    
    // Log the creation
    const actionBy = currentUserRole === 'manager' ? 'MANAGER' : 'ADMIN';
    console.log(`[${actionBy} ACTION] Created new user: ${user.email} with role: ${user.role}`);
    
    return res.status(201).json({ 
      success: true,
      message: "Tạo người dùng thành công",
      data: userWithoutPassword 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
      return;
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
      return;
    }
    
    // Get additional info based on role
    let additionalInfo = null;
    
    if (user.role === 'doctor') {
      const Doctor = await import('../models/Doctor');
      additionalInfo = await Doctor.default.findOne({ userId: user._id });
    }
    
    res.status(200).json({
      success: true,
      message: 'Lấy thông tin người dùng thành công',
      data: {
        user,
        additionalInfo
      }
    });
    
  } catch (error: any) {
    console.error('Error in getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin người dùng',
      error: error.message
    });
  }
};

export const updateUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    if (updateData.password) delete updateData.password; // Không cho update password ở đây
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    return res.status(200).json({ data: user });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Lấy thông tin profile của người dùng đăng nhập hiện tại
 */
export const getCurrentUserProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Chưa xác thực" });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy thông tin người dùng" });
    }

    return res.status(200).json(user);
  } catch (error: any) {
    console.error("Lỗi khi lấy profile:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi lấy thông tin người dùng" });
  }
};

/**
 * Cập nhật thông tin profile của người dùng hiện tại
 */
export const updateUserProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Chưa xác thực" });
    }

    const {
      fullName,
      phone,
      gender,
      address,
      year,
    } = req.body;

    // Kiểm tra các trường hợp lệ
    const updateData: any = {};
    
    if (fullName !== undefined) {
      if (fullName.length < 2 || fullName.length > 50) {
        return res.status(400).json({ message: "Họ tên phải có độ dài từ 2 đến 50 ký tự" });
      }
      updateData.fullName = fullName;
    }

    if (phone !== undefined && phone !== '') {
      if (!/^[0-9]{10,11}$/.test(phone)) {
        return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
      }
      updateData.phone = phone;
    }

    if (gender !== undefined) {
      if (!['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({ message: "Giới tính không hợp lệ" });
      }
      updateData.gender = gender;
    }

    if (address !== undefined) {
      updateData.address = address;
    }

    if (year !== undefined) {
      const yearDate = new Date(year);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(yearDate.getTime()) || yearDate.getFullYear() > currentYear) {
        return res.status(400).json({ message: "Năm sinh không hợp lệ" });
      }
      
      updateData.year = yearDate;
    }

    // Thêm trường updatedAt
    updateData.updatedAt = new Date();

    // Cập nhật thông tin người dùng
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy thông tin người dùng" });
    }

    return res.status(200).json({
      message: "Cập nhật thông tin thành công",
      data: updatedUser
    });
  } catch (error: any) {
    console.error("Lỗi khi cập nhật profile:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật thông tin" });
  }
};

/**
 * Cập nhật avatar người dùng
 */
export const updateUserAvatar = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Chưa xác thực" });
    }

    const { avatar } = req.body;
    
    if (!avatar) {
      return res.status(400).json({ message: "URL avatar không được để trống" });
    }

    // Cập nhật avatar người dùng
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          avatar,
          updatedAt: new Date()
        } 
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy thông tin người dùng" });
    }

    return res.status(200).json({
      message: "Cập nhật avatar thành công",
      data: updatedUser
    });
  } catch (error: any) {
    console.error("Lỗi khi cập nhật avatar:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật avatar" });
  }
};

/**
 * Đổi mật khẩu
 */
export const changePassword = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Chưa xác thực" });
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới" });
    }

    // Kiểm tra độ mạnh của mật khẩu mới
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{6,30}$/.test(newPassword)) {
      return res.status(400).json({ 
        message: "Mật khẩu mới phải chứa chữ thường, in hoa, số, ký tự đặc biệt và từ 6 đến 30 ký tự" 
      });
    }

    // Lấy thông tin người dùng
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy thông tin người dùng" });
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu mới
    user.password = hashedPassword;
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error: any) {
    console.error("Lỗi khi đổi mật khẩu:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi đổi mật khẩu" });
  }
};

/**
 * Upload avatar lên cloudinary, trả về url
 */
export const uploadAvatarImage = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
    }
    // Upload lên cloudinary
    const url = await uploadToCloudinary(req.file.path, 'avatars');
    // Xóa file tạm
    fs.unlinkSync(req.file.path);
    return res.status(200).json({ url });
  } catch (error: any) {
    return res.status(500).json({ message: 'Lỗi upload avatar', error: error.message });
  }
};

// ADMIN & MANAGER: Cập nhật role của người dùng
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { newRole, reason, doctorProfile } = req.body;
    const currentUserRole = (req as any).user?.role; // Get current user's role
    
    // Validation
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
      return;
    }
    
    const validRoles = ['customer', 'doctor', 'staff', 'manager', 'admin'];
    if (!validRoles.includes(newRole)) {
      res.status(400).json({
        success: false,
        message: 'Role không hợp lệ',
        validRoles
      });
      return;
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
      return;
    }
    
    // Manager restrictions
    if (currentUserRole === 'manager') {
      // Manager cannot change admin roles
      if (user.role === 'admin') {
        res.status(403).json({
          success: false,
          message: 'Manager không thể thay đổi role của Admin'
        });
        return;
      }
      
      // Manager cannot promote users to admin
      if (newRole === 'admin') {
        res.status(403).json({
          success: false,
          message: 'Manager không thể thăng cấp user thành Admin'
        });
        return;
      }
    }
    
    // Prevent changing admin role (security) - applies to both admin and manager
    if (user.role === 'admin' && newRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Không thể thay đổi role của Admin'
      });
      return;
    }
    
    const oldRole = user.role;
    
    // Update role
    user.role = newRole;
    user.updatedAt = new Date();
    await user.save();
    
    // If changing to doctor role, create or update doctor profile
    if (newRole === 'doctor' && doctorProfile) {
      try {
        const Doctor = await import('../models/Doctor');
        
        // Check if doctor profile already exists
        const existingDoctor = await Doctor.default.findOne({ userId: user._id });
        
        if (existingDoctor) {
          // Update existing doctor profile
          await Doctor.default.findByIdAndUpdate(existingDoctor._id, {
            ...doctorProfile,
            updatedAt: new Date()
          });
        } else {
          // Create new doctor profile
          await Doctor.default.create({
            userId: user._id,
            ...doctorProfile,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (doctorError) {
        console.error('Error handling doctor profile:', doctorError);
        // Role update succeeded, but doctor profile failed
        // Log this for manual review
      }
    }
    
    // Log the change
    const actionBy = currentUserRole === 'manager' ? 'MANAGER' : 'ADMIN';
    console.log(`[${actionBy} ACTION] User ${user.email} role changed from ${oldRole} to ${newRole}. Reason: ${reason || 'No reason provided'}`);
    
    res.status(200).json({
      success: true,
      message: `Cập nhật role thành công: ${oldRole} → ${newRole}`,
      data: {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        oldRole,
        newRole,
        updatedAt: user.updatedAt
      }
    });
    
  } catch (error: any) {
    console.error('Error in updateUserRole:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật role',
      error: error.message
    });
  }
};

// ADMIN & MANAGER: Xóa người dùng (soft delete)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason, hardDelete = false } = req.body;
    const currentUserRole = (req as any).user?.role; // Get current user's role
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
      return;
    }
    
    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      res.status(403).json({
        success: false,
        message: 'Không thể xóa tài khoản Admin'
      });
      return;
    }
    
    // Manager restrictions: only soft delete allowed
    if (currentUserRole === 'manager' && hardDelete) {
      res.status(403).json({
        success: false,
        message: 'Manager chỉ được phép vô hiệu hóa tài khoản, không thể xóa vĩnh viễn'
      });
      return;
    }
    
    if (hardDelete && currentUserRole === 'admin') {
      // Hard delete - permanently remove (Admin only)
      await User.findByIdAndDelete(userId);
      console.log(`[ADMIN ACTION] User ${user.email} permanently deleted. Reason: ${reason || 'No reason provided'}`);
      
      res.status(200).json({
        success: true,
        message: 'Xóa người dùng vĩnh viễn thành công',
        data: { deletedUser: user.email }
      });
    } else {
      // Soft delete - deactivate account
      user.isActive = false;
      user.deletedAt = new Date();
      user.updatedAt = new Date();
      await user.save();
      
      const actionBy = currentUserRole === 'manager' ? 'MANAGER' : 'ADMIN';
      console.log(`[${actionBy} ACTION] User ${user.email} soft deleted. Reason: ${reason || 'No reason provided'}`);
      
      res.status(200).json({
        success: true,
        message: 'Vô hiệu hóa tài khoản thành công',
        data: {
          userId: user._id,
          email: user.email,
          deletedAt: user.deletedAt
        }
      });
    }
    
  } catch (error: any) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa người dùng',
      error: error.message
    });
  }
};

// ADMIN ONLY: Thống kê hệ thống
export const getSystemStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    // User statistics by role
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    // User statistics by status
    const statusStats = await User.aggregate([
      { $group: { _id: '$isActive', count: { $sum: 1 } } }
    ]);
    
    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Daily registrations for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Lấy thống kê hệ thống thành công',
      data: {
        roleStatistics: roleStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        statusStatistics: {
          active: statusStats.find(s => s._id === true)?.count || 0,
          inactive: statusStats.find(s => s._id === false)?.count || 0
        },
        recentActivity: {
          newUsersLast30Days: recentRegistrations,
          dailyRegistrationsLast7Days: dailyRegistrations
        },
        totalUsers: await User.countDocuments()
      }
    });
    
  } catch (error: any) {
    console.error('Error in getSystemStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê',
      error: error.message
    });
  }
};
