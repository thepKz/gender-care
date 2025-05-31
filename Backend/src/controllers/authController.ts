import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { ValidationError } from "../errors/validationError";
import { AuthToken, LoginHistory, OtpCode, User } from "../models";
import { sendVerificationEmail } from "../services/emails";
import { signRefreshToken, signToken, verifyRefreshToken } from "../utils";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "203228075747-cnn4bmrbnkeqmbiouptng2kajeur2fjp.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, gender, phone } = req.body;

    const formatFullName = fullName.trim();
    const formatEmail = email.trim().toLowerCase();
    const formatPassword = password.trim();
    const formatGender = gender.trim();

    const errors: any = {};

    if (!formatFullName || !formatEmail || !formatPassword || !formatGender) {
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

    // Kiểm tra giới tính
    if (!['male', 'female', 'other'].includes(formatGender)) {
      errors.gender = "Giới tính không hợp lệ!";
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
      gender: formatGender,
      phone: phone || undefined,
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

    // Gửi email xác thực
    await sendVerificationEmail(
      newUser.email,
      otp,
      newUser.fullName
    );

    // Tạo access token và refresh token cho user mới đăng ký
    const accessToken = await signToken({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
    });
    const refreshToken = await signRefreshToken({
      _id: newUser._id,
      email: newUser.email,
    });

    return res.status(201).json({
      message: "Đăng ký thành công!",
      data: {
        accessToken,
        refreshToken,
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        gender: newUser.gender,
        role: newUser.role,
        emailVerified: false,
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

    // Tạo access token và refresh token
    const token = await signToken({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await signRefreshToken({
      _id: user._id,
      email: user.email,
    });

    // Lưu refresh token vào database
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 ngày

    await AuthToken.create({
      userId: user._id,
      refreshToken,
      userAgent: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip || 'unknown',
      expiresAt: refreshTokenExpiry,
      isRevoked: false
    });

    // Lưu lịch sử đăng nhập
    await LoginHistory.create({
      userId: user._id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      loginAt: new Date(),
      status: 'success'
    });

    return res.status(200).json({
      message: "Đăng nhập thành công!",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        accessToken: token,
        refreshToken: refreshToken
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
    const { token } = req.body;
    if (!token) {
      console.log("No Google token provided");
      return res.status(400).json({ message: "Thiếu Google token" });
    }
    
    console.log("Processing Google login with token length:", token.length);
    
    // Xác thực token với Google với timeout
    const verifyTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Google verification timeout')), 15000);
    });
    
    const verifyPromise = client.verifyIdToken({ 
      idToken: token, 
      audience: [
        GOOGLE_CLIENT_ID,
        '203228075747-cnn4bmrbnkeqmbiouptng2kajeur2fjp.apps.googleusercontent.com'
      ]
    });
    
    const ticket = await Promise.race([verifyPromise, verifyTimeout]) as any;
    
    const payload = ticket.getPayload();
    console.log("Google JWT payload:", payload);
    console.log("Google avatar (picture):", payload.picture);
    
    if (!payload || !payload.email) {
      console.error("Invalid Google token payload:", payload);
      return res.status(400).json({
        success: false,
        message: "Token Google không hợp lệ"
      });
    }
    
    console.log("Google user verified:", payload.email);
    console.log("Google user data:", {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      email_verified: payload.email_verified
    });
    
    // Tìm hoặc tạo user
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      console.log("Creating new user from Google account:", payload.email);
      
      // Tạo password ngẫu nhiên cho tài khoản Google (vì password là required)
      const randomPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      // Tạo user mới từ tài khoản Google
      user = await User.create({
        email: payload.email,
        password: hashedPassword, // Sử dụng password được hash thay vì empty string
        fullName: payload.name || payload.email.split('@')[0],
        avatar: payload.picture,
        emailVerified: true, // Email đã được xác thực bởi Google
        isActive: true,
        role: "customer",
        gender: "other" // Giá trị mặc định
      });
      
      console.log("New user created successfully:", user._id);
    } else {
      console.log("Found existing user, performing login only (no info update):", payload.email);
      
      // Đảm bảo email đã được verify cho tài khoản Google (chỉ update trường này)
      if (!user.emailVerified) {
        user.emailVerified = true;
        await user.save();
        console.log("Updated emailVerified status only");
      }
      
      // KHÔNG update avatar, fullName hoặc thông tin khác
      // Giữ nguyên thông tin user hiện tại
    }
    
    if (!user.isActive) {
      console.log("User account is inactive:", payload.email);
      return res.status(403).json({ 
        message: "Tài khoản của bạn đã bị khóa! Vui lòng liên hệ quản trị viên để được hỗ trợ" 
      });
    }
    
    // Tạo access token và refresh token giống như đăng nhập thông thường
    const accessToken = await signToken({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await signRefreshToken({
      _id: user._id,
      email: user.email,
    });

    // Lưu refresh token vào database
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 ngày

    await AuthToken.create({
      userId: user._id,
      refreshToken,
      userAgent: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip || 'unknown',
      expiresAt: refreshTokenExpiry,
      isRevoked: false
    });

    // Lưu lịch sử đăng nhập
    await LoginHistory.create({
      userId: user._id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      loginAt: new Date(),
      status: 'success'
    });

    console.log("Google login successful for user:", user.email);

    // Set cookies như đăng nhập thông thường
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 phút
      domain: isProduction ? '.ksfu.cloud' : undefined
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      domain: isProduction ? '.ksfu.cloud' : undefined
    });

    res.cookie('user_info', JSON.stringify({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      avatar: user.avatar
    }), {
      httpOnly: false, // Cho phép client đọc
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      domain: isProduction ? '.ksfu.cloud' : undefined
    });

    return res.status(200).json({
      message: "Đăng nhập với Google thành công!",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    });
  } catch (error: any) {
    console.error("Lỗi đăng nhập Google:", error);
    console.error("Error stack:", error.stack);
    
    // Phân loại lỗi để trả về message phù hợp
    if (error.message?.includes('timeout')) {
      return res.status(408).json({ 
        message: "Xác thực Google mất quá nhiều thời gian. Vui lòng thử lại." 
      });
    }
    
    if (error.message?.includes('Invalid token')) {
      return res.status(400).json({ 
        message: "Token Google không hợp lệ. Vui lòng thử đăng nhập lại." 
      });
    }
    
    // Log validation errors
    if (error.name === 'ValidationError') {
      console.error("Validation error details:", error.errors);
      return res.status(400).json({ 
        message: "Dữ liệu không hợp lệ. Vui lòng thử lại." 
      });
    }
    
    // Log MongoDB errors
    if (error.code === 11000) {
      console.error("Duplicate key error:", error.keyValue);
      return res.status(400).json({ 
        message: "Email đã tồn tại trong hệ thống." 
      });
    }
    
    return res.status(500).json({ 
      message: "Đăng nhập với Google thất bại. Vui lòng thử lại sau." 
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
        accessToken: token,
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

export const checkPhone = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    const formatPhone = phone.trim();
    
    if (!formatPhone) {
      return res.status(400).json({ message: "Số điện thoại không được để trống" });
    }
    
    // Kiểm tra định dạng số điện thoại
    if (!/^[0-9]{10,11}$/.test(formatPhone)) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }
    
    const user = await User.findOne({ phone: formatPhone });
    return res.status(200).json({ available: !user });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // Lấy refresh token từ cookie
    const refreshToken = req.cookies.refresh_token;
    
    if (refreshToken) {
      // Tìm và vô hiệu hóa refresh token trong database
      await AuthToken.updateOne({ refreshToken }, { isRevoked: true });
    }
    
    // Xóa cookie
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    
    return res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error: any) {
    console.error('Lỗi khi đăng xuất:', error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi đăng xuất" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    // Lấy refresh token từ cookie
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({ message: "Không tìm thấy refresh token" });
    }
    
    // Kiểm tra refresh token trong database
    const tokenDoc = await AuthToken.findOne({ 
      refreshToken, 
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!tokenDoc) {
      // Xóa cookie nếu token không hợp lệ
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.status(401).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }
    
    // Xác thực refresh token
    const { valid, expired, decoded } = await verifyRefreshToken(refreshToken);
    
    if (!valid || expired || !decoded) {
      // Vô hiệu hóa token trong database
      await AuthToken.updateOne({ refreshToken }, { isRevoked: true });
      
      // Xóa cookie
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      
      return res.status(401).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }
    
    // Lấy thông tin user
    const user = await User.findById(decoded._id);
    
    if (!user || !user.isActive) {
      // Xóa cookie
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      
      return res.status(401).json({ message: "Người dùng không tồn tại hoặc đã bị khóa" });
    }
    
    // Tạo access token mới
    const newAccessToken = await signToken({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
    
    // Thiết lập cookie mới cho access token
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/'
    });
    
    return res.status(200).json({ 
      message: "Token đã được làm mới",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error: any) {
    console.error('Lỗi khi refresh token:', error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi làm mới token" });
  }
};
