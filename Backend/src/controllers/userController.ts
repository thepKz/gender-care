import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import fs from 'fs';
import { OtpCode, User } from "../models";
import {
    sendResetPasswordEmail
} from "../services/emails";
import { uploadToCloudinary } from '../services/uploadService';
import { AuthRequest } from "../types";

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

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "Danh sách tài khoản trống" });
    }

    const formattedData = users.map((user) => ({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar || "",
      phone: user.phone || "",
      role: user.role,
      isActive: user.isActive,
    }));

    return res.status(200).json({ data: formattedData });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      data: user,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message:
        error.message || "Đã xảy ra lỗi khi cập nhật trạng thái tài khoản",
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
    if (role && ["admin", "customer", "consultant", "staff", "manager"].includes(role)) {
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
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    const existed = await User.findOne({ email });
    if (existed) {
      return res.status(409).json({ message: "Email đã tồn tại" });
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
    return res.status(201).json({ data: user });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    return res.status(200).json({ data: user });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
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

    if (phone !== undefined) {
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
