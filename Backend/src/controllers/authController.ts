import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { ValidationError } from "../errors/validationError";
import { OtpCode, User } from "../models";
import { sendVerificationEmail } from "../services/emails";
import { randomText, signToken } from "../utils";

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;

    const formatFullName = fullName.trim();
    const formatEmail = email.trim().toLowerCase();
    const formatPassword = password.trim();

    const errors: any = {};

    if (!formatFullName || !formatEmail || !formatPassword) {
      errors.message = "Vui lòng điền đầy đủ các trường!";
      throw new ValidationError(errors);
    }

    // Kiểm tra định dạng họ tên
    if (formatFullName.length < 3 || formatFullName.length > 50) {
      errors.fullName = "Họ tên phải có độ dài từ 3 đến 50 ký tự!";
      throw new ValidationError(errors);
    }

    // Kiểm tra định dạng email
    if (
      !/^[A-Za-z0-9\._%+\-]+@[A-Za-z0-9\.\-]+\.[A-Za-z]{2,}$/.test(formatEmail)
    ) {
      errors.email = "Email không hợp lệ!";
      throw new ValidationError(errors);
    }

    const existingUser = await User.findOne({ email: formatEmail });

    if (existingUser) {
      errors.email = "Email này đã được sử dụng!";
      throw new ValidationError(errors);
    }

    // Kiểm tra độ mạnh của mật khẩu
    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{6,30}$/.test(
        formatPassword
      )
    ) {
      errors.password =
        "Mật khẩu phải chứa chữ thường, in hoa, số, ký tự đặc biệt và từ 6 đến 30 ký tự!";
      throw new ValidationError(errors);
    }

    // Tạo user mới
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(formatPassword, salt);

    const newUser = await User.create({
      fullName: formatFullName,
      email: formatEmail,
      password: hashedPass,
      role: "customer",
      emailVerified: false,
      isActive: true
    });

    // Tạo OTP cho xác thực email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Tạo thời gian hết hạn (60 phút)
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 60);
    
    // Lưu OTP vào database
    await OtpCode.create({
      userId: newUser._id,
      type: "email_verification",
      otp,
      expires: expiryDate,
      verified: false,
      attempts: 0
    });

    // Tạo token
    const token = await signToken({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
    });

    // Gửi email xác thực
    await sendVerificationEmail(
      newUser.email,
      otp,
      newUser.fullName
    );

    return res.status(201).json({
      message: "Đăng ký thành công!",
      data: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        emailVerified: false,
        token,
      },
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).json({ message: "Đã xảy ra lỗi server" });
  }
};

export const registerAtCenter = async (req: Request, res: Response) => {
  try {
    const {
      phone,
      email,
      fullName
    } = req.body;

    const formatEmail = email.trim().toLowerCase();
    const formatFullName = fullName || `Khách hàng ${phone.substring(phone.length - 4)}`;

    if (!phone || !formatEmail) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ các trường" });
    }

    // Tạo mật khẩu mặc định
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash("12345678", salt);

    const newUser = await User.create({
      fullName: formatFullName,
      email: formatEmail,
      password: hashedPass,
      phone,
      role: "customer",
      emailVerified: false,
      isActive: true
    });

    const formattedData = {
      id: newUser._id,
      email: newUser.email,
      fullName: newUser.fullName,
      phone: newUser.phone
    };

    return res.status(200).json({ data: formattedData });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  try {
    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Kiểm tra OTP
    const otpRecord = await OtpCode.findOne({
      userId: user._id,
      type: "email_verification",
      otp,
      expires: { $gt: new Date() },
      verified: false
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Mã không hợp lệ hoặc hết hạn" });
    }

    // Cập nhật OTP thành đã sử dụng
    otpRecord.verified = true;
    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    // Cập nhật trạng thái xác thực email của user
    user.emailVerified = true;
    await user.save();

    return res.status(200).json({ 
      message: "Xác nhận tài khoản thành công",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        emailVerified: true
      }
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

export const sendNewVerifyEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email đã được xác thực trước đó" });
    }

    // Tạo OTP cho xác thực email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Tạo thời gian hết hạn (60 phút)
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 60);
    
    // Lưu OTP vào database
    await OtpCode.create({
      userId: user._id,
      type: "email_verification",
      otp,
      expires: expiryDate,
      verified: false,
      attempts: 0
    });

    // Gửi email xác thực
    await sendVerificationEmail(email, otp, user.fullName);

    return res
      .status(200)
      .json({ message: "Mã OTP đã được gửi đến email của bạn" });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const errors: any = {};

    const formatEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!formatEmail || !trimmedPassword) {
      errors.message = "Vui lòng điền đẩy đủ các trường!";
      throw new ValidationError(errors);
    }

    const user = await User.findOne({ email: formatEmail });

    if (!user) {
      errors.message = "Tài khoản không tồn tại!";
      errors.email = "Vui lòng kiểm tra lại!";
      throw new ValidationError(errors);
    }

    if (!user.isActive) {
      errors.message =
        "Tài khoản của bạn đã bị khóa! Vui lòng liên hệ quản trị viên để được hỗ trợ";
      throw new ValidationError(errors);
    }

    const comparePassword = await bcrypt.compare(
      trimmedPassword,
      user.password
    );

    if (!comparePassword) {
      errors.message = "Thông tin đăng nhập sai, vui lòng thử lại!";
      errors.email = "Vui lòng kiểm tra lại!";
      errors.password = "Vui lòng kiểm tra lại!";
      throw new ValidationError(errors);
    }

    const token = await signToken({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      message: "Đăng nhập thành công!",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        token,
      },
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).json({
      message: error.message,
    });
  }
};

export const loginWithGoogle = async (req: Request, res: Response) => {
  try {
    const { email, name, photoUrl } = req.body;

    const formatEmail = email.trim().toLowerCase();
    const formatFullName = name || `User_${randomText(5)}`;

    let user = await User.findOne({ email: formatEmail });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPass = await bcrypt.hash(randomText(12), salt);
      user = await User.create({
        fullName: formatFullName,
        email: formatEmail,
        password: hashedPass,
        avatar: photoUrl,
        emailVerified: true,
        isActive: true,
        role: "customer"
      });
    } else {
      if (!user.isActive) {
        return res.status(403).json({
          message:
            "Tài khoản của bạn đã bị khóa! Vui lòng liên hệ quản trị viên để được hỗ trợ",
        });
      }

      if (!user.avatar && photoUrl) {
        user.avatar = photoUrl;
        await user.save();
      }
    }

    const token = await signToken({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      message: "Đăng nhập thành công!",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar || photoUrl,
        emailVerified: user.emailVerified,
        token,
      },
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      message: "Đã xảy ra lỗi khi xử lý đăng nhập Google",
    });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const errors: any = {};

    const formatEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!formatEmail || !trimmedPassword) {
      errors.message = "Vui lòng điền đẩy đủ các trường!";
      throw new ValidationError(errors);
    }

    const user = await User.findOne({
      $and: [
        { email: formatEmail },
        { role: { $in: ["admin", "staff", "manager"] } },
      ],
    });

    if (!user) {
      errors.message = "Tài khoản không tồn tại hoặc không có quyền truy cập!";
      errors.email = "Vui lòng kiểm tra lại!";
      throw new ValidationError(errors);
    }

    if (!user.isActive) {
      errors.message =
        "Tài khoản của bạn đã bị khóa! Vui lòng liên hệ quản trị viên để được hỗ trợ";
      throw new ValidationError(errors);
    }

    const comparePassword = await bcrypt.compare(
      trimmedPassword,
      user.password
    );

    if (!comparePassword) {
      errors.message = "Thông tin đăng nhập sai, vui lòng thử lại!";
      errors.email = "Vui lòng kiểm tra lại!";
      errors.password = "Vui lòng kiểm tra lại!";
      throw new ValidationError(errors);
    }

    const token = await signToken({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      message: "Đăng nhập thành công!",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token,
      },
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).json({
      message: error.message,
    });
  }
};

export const checkEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const formatEmail = email.trim().toLowerCase();
    
    if (!formatEmail) {
      return res.status(400).json({ message: "Email không được để trống" });
    }
    
    const user = await User.findOne({ email: formatEmail });
    return res.status(200).json({ available: !user });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};
