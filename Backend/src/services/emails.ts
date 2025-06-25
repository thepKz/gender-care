import nodemailer from "nodemailer";

import dotenv from "dotenv";
dotenv.config();

// Create a transporter object
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Thay đổi host thành Gmail SMTP
  port: 465, // Sử dụng cổng 465 cho SSL
  secure: true, // Bật SSL
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD, // Thay bằng mật khẩu ứng dụng của Gmail
  },
});

// Thêm hàm sendEmail cơ bản
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  try {
    // Kiểm tra credentials trước khi gửi
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
      console.warn('Email credentials not configured. Email sending skipped.');
      console.log(`Would send email to: ${to}, subject: ${subject}`);
      return;
    }

    const mailOptions = {
      from: `"Gender Healthcare" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    // Không throw error để tránh crash app
    console.log(`Email sending failed but app continues running`);
  }
};

export const sendVerificationEmail = async (
  to: string,
  otp: string,
  fullName: string
): Promise<void> => {
  const subject = "Xác thực tài khoản của bạn - Gender Healthcare";
  
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4A90E2;">Gender Healthcare</h2>
      </div>
      
      <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
        <h3 style="margin-top: 0;">Xin chào ${fullName},</h3>
        
        <p>Cảm ơn bạn đã đăng ký tài khoản tại Gender Healthcare. Để hoàn tất quá trình đăng ký, vui lòng xác thực địa chỉ email của bạn bằng mã OTP sau:</p>
        
        <div style="background-color: #ffffff; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; border: 1px dashed #ccc;">
          ${otp}
        </div>
        
        <p>Mã này sẽ hết hạn sau 60 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        
        <p>Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email này.</p>
      </div>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9e9e9; text-align: center; font-size: 12px; color: #999;">
        <p>© ${new Date().getFullYear()} Gender Healthcare. Tất cả các quyền được bảo lưu.</p>
      </div>
    </div>
  `;
  
  // Gọi hàm gửi email
  await sendEmail(to, subject, htmlContent);
};

export const sendResetPasswordEmail = async (
  to: string,
  otp: string,
  fullName: string
): Promise<void> => {
  const subject = "Đặt lại mật khẩu - Gender Healthcare";
  
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4A90E2;">Gender Healthcare</h2>
      </div>
      
      <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
        <h3 style="margin-top: 0;">Xin chào ${fullName},</h3>
        
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Để đặt lại mật khẩu, vui lòng sử dụng mã OTP sau:</p>
        
        <div style="background-color: #ffffff; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; border: 1px dashed #ccc;">
          ${otp}
        </div>
        
        <p>Mã này sẽ hết hạn sau 15 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ với chúng tôi ngay lập tức vì tài khoản của bạn có thể đang bị xâm phạm.</p>
      </div>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9e9e9; text-align: center; font-size: 12px; color: #999;">
        <p>© ${new Date().getFullYear()} Gender Healthcare. Tất cả các quyền được bảo lưu.</p>
      </div>
    </div>
  `;
  
  // Gọi hàm gửi email
  await sendEmail(to, subject, htmlContent);
};

export const sendPasswordChangeAlert = async (
  email: string,
  username: string,
  newPassword: string
) => {
  const mailOptions = {
    from: "Gender Healthcare",
    to: email,
    subject: "Thông báo thay đổi mật khẩu - Gender Healthcare",
    html: `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thông báo thay đổi mật khẩu</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background-color: #4A90E2; color: white; padding: 10px; text-align: center; }
          .content { background-color: white; padding: 20px; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"> 
            <h1>Gender Healthcare</h1>
          </div>
          <div class="content">
            <h2>Thông báo thay đổi mật khẩu</h2>
            <p>Xin chào ${username},</p>
            <p>Chúng tôi nhận được yêu cầu thay đổi mật khẩu cho tài khoản của bạn. Mật khẩu mới của bạn là:</p>
            <div style="background-color: #f8f9fa; padding: 15px; font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; border-radius: 5px; border: 1px dashed #ccc;">${newPassword}</div>
            <p>Mật khẩu mới của bạn sẽ hết hạn sau 10 phút.</p>
            <p>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.</p>
            <p>Trân trọng,<br>Đội ngũ Gender Healthcare</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Gender Healthcare. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>  
      </body>
    </html>
  `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password change alert email sent successfully");
  } catch (error) {
    console.error("Error sending password change alert email:", error);
    throw error;
  }
};

export const sendNewAccountEmail = async (
  to: string,
  fullName: string,
  email: string,
  password: string,
  role: string
): Promise<void> => {
  const roleNames: { [key: string]: string } = {
    customer: 'Khách hàng',
    doctor: 'Bác sĩ', 
    staff: 'Nhân viên',
    manager: 'Quản lý',
    admin: 'Quản trị viên'
  };

  const subject = "Thông tin tài khoản mới - Gender Healthcare";
  
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4A90E2;">Gender Healthcare</h2>
      </div>
      
      <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
        <h3 style="margin-top: 0;">Xin chào ${fullName},</h3>
        
        <p>Chúng tôi đã tạo tài khoản mới cho bạn tại hệ thống Gender Healthcare. Dưới đây là thông tin đăng nhập của bạn:</p>
        
        <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #ddd;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
              <td style="padding: 8px 0;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Mật khẩu:</td>
              <td style="padding: 8px 0; font-family: monospace; background-color: #f8f9fa; padding: 5px; border-radius: 3px;">${password}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Vai trò:</td>
              <td style="padding: 8px 0;">${roleNames[role] || role}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Bảo mật:</strong></p>
          <ul style="margin: 5px 0 0 20px; color: #856404;">
            <li>Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên</li>
            <li>Không chia sẻ thông tin đăng nhập với bất kỳ ai</li>
            <li>Sử dụng mật khẩu mạnh (ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt)</li>
          </ul>
        </div>
        
        <p>Bạn có thể đăng nhập vào hệ thống bằng cách truy cập trang web của chúng tôi và sử dụng thông tin đăng nhập ở trên.</p>
        
        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với bộ phận hỗ trợ.</p>
        
        <p>Trân trọng,<br/>Đội ngũ Gender Healthcare</p>
      </div>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9e9e9; text-align: center; font-size: 12px; color: #999;">
        <p>© ${new Date().getFullYear()} Gender Healthcare. Tất cả các quyền được bảo lưu.</p>
      </div>
    </div>
  `;
  
  await sendEmail(to, subject, htmlContent);
};

export const sendMeetingNotificationEmail = async (
  to: string,
  patientName: string,
  doctorName: string,
  meetingLink: string,
  scheduledTime: Date,
  consultationQuestion: string
): Promise<void> => {
  const subject = "🎯 Lịch hẹn tư vấn trực tuyến của bạn đã được tạo - Gender Healthcare";
  
  // Format thời gian tiếng Việt
  const formattedTime = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  }).format(scheduledTime);
  
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; font-size: 28px; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          🎯 Gender Healthcare
        </h1>
        <p style="color: #f0f0f0; font-size: 16px; margin: 8px 0 0 0;">Hệ thống chăm sóc sức khỏe toàn diện</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); color: #333;">
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #4CAF50, #45a049); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);">
            <span style="font-size: 36px; color: white;">🩺</span>
          </div>
          <h2 style="color: #2c3e50; margin: 0; font-size: 24px;">Lịch hẹn tư vấn đã được tạo!</h2>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #2c3e50; font-size: 18px;">
            <span style="color: #4CAF50;">👋</span> Xin chào ${patientName},
          </h3>
          <p style="margin: 10px 0; line-height: 1.6; color: #555;">
            Cuộc hẹn tư vấn trực tuyến của bạn với <strong style="color: #4CAF50;">${doctorName}</strong> đã được tạo thành công và sẵn sàng để bắt đầu!
          </p>
        </div>

        <div style="background: #fff; border: 2px solid #e3f2fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2; font-size: 16px;">
            📅 Chi tiết cuộc hẹn
          </h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666; width: 30%;">
                <span style="color: #4CAF50;">👨‍⚕️</span> Bác sĩ tư vấn:
              </td>
              <td style="padding: 8px 0; color: #333;">
                <strong>${doctorName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">
                <span style="color: #ff9800;">⏰</span> Thời gian:
              </td>
              <td style="padding: 8px 0; color: #333;">
                <strong style="color: #ff9800;">${formattedTime}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">
                <span style="color: #2196f3;">❓</span> Vấn đề tư vấn:
              </td>
              <td style="padding: 8px 0; color: #555; font-style: italic;">
                "${consultationQuestion.substring(0, 100)}${consultationQuestion.length > 100 ? '...' : ''}"
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${meetingLink}" 
             target="_blank" 
             style="display: inline-block; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px;">
            🎥 Tham gia cuộc hẹn ngay
          </a>
          <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
            <strong>Lưu ý:</strong> Bạn có thể tham gia cuộc họp bất kỳ lúc nào từ giờ đến hết ngày hẹn
          </p>
        </div>

        <div style="background: #e8f5e8; border: 1px solid #c8e6c9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #2e7d32; font-size: 15px;">
            ✅ Hướng dẫn tham gia:
          </h4>
          <ol style="margin: 10px 0 0 20px; color: #555; line-height: 1.6;">
            <li>Click vào nút <strong>"Tham gia cuộc hẹn ngay"</strong> phía trên</li>
            <li>Cho phép trình duyệt truy cập camera và microphone của bạn</li>
            <li>Đợi bác sĩ tham gia và bắt đầu cuộc tư vấn</li>
            <li>Chuẩn bị sẵn các câu hỏi bạn muốn tư vấn</li>
          </ol>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>🔒 Bảo mật & Riêng tư:</strong> Cuộc tư vấn của bạn được mã hóa end-to-end. 
            Mọi thông tin trao đổi đều được bảo mật tuyệt đối theo quy định y tế.
          </p>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 25px; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ đội ngũ hỗ trợ của chúng tôi.
          </p>
          <p style="margin: 8px 0 0 0; color: #4CAF50; font-weight: bold;">
            Chúc bạn có buổi tư vấn hiệu quả! 🌟
          </p>
        </div>
      </div>
      
      <div style="margin-top: 20px; padding-top: 20px; text-align: center; font-size: 12px; color: #f0f0f0;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Gender Healthcare. Tất cả các quyền được bảo lưu.</p>
        <p style="margin: 8px 0 0 0;">📧 Email này được gửi tự động, vui lòng không trả lời trực tiếp.</p>
      </div>
    </div>
  `;
  
  await sendEmail(to, subject, htmlContent);
};

// Clean & Professional Email Template cho Customer Meeting Invite
export const sendCustomerMeetingInviteEmail = async (
  customerEmail: string,
  customerName: string,
  customerPhone: string,
  doctorName: string,
  meetingLink: string,
  meetingPassword: string,
  scheduledTime: Date,
  consultationQuestion: string
): Promise<void> => {
  const subject = "Cuộc tư vấn của bạn đã sẵn sàng - Gender Healthcare";
  
  // Format thời gian tiếng Việt
  const formattedTime = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  }).format(scheduledTime);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lời mời tư vấn - Gender Healthcare</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; line-height: 1.6;">
      
      <!-- Email Container -->
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
        
        <!-- Header -->
        <div style="background: #2563eb; padding: 40px 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
            Gender Healthcare
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">
            Dịch vụ tư vấn sức khỏe
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
          
          <!-- Welcome Message -->
          <h2 style="color: #1e293b; margin: 0 0 24px 0; font-size: 24px; font-weight: 600; line-height: 1.3;">
            Xin chào ${customerName},
          </h2>
          
          <p style="color: #475569; font-size: 16px; margin: 0 0 32px 0; line-height: 1.6;">
            Cuộc tư vấn với bác sĩ <strong style="color: #2563eb;">${doctorName}</strong> đã được thiết lập và sẵn sàng để bắt đầu. 
            Vui lòng sử dụng thông tin bên dưới để tham gia.
          </p>

          <!-- Meeting Details -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 28px; margin-bottom: 32px;">
            <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
              Thông tin cuộc hẹn
            </h3>
            
            <div style="margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px; font-weight: 500;">Bác sĩ tư vấn</p>
              <p style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">${doctorName}</p>
            </div>
            
            <div style="margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px; font-weight: 500;">Thời gian</p>
              <p style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">${formattedTime}</p>
            </div>
            
            <div>
              <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px; font-weight: 500;">Vấn đề cần tư vấn</p>
              <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.5; font-style: italic;">
                "${consultationQuestion.length > 120 ? consultationQuestion.substring(0, 120) + '...' : consultationQuestion}"
              </p>
            </div>
          </div>

          <!-- Password Section -->
          <div style="background: #1e293b; border-radius: 8px; padding: 32px; text-align: center; margin-bottom: 32px;">
            <h3 style="color: white; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              Mã truy cập Meeting
            </h3>
            
            <div style="background: rgba(255,255,255,0.1); border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="color: rgba(255,255,255,0.8); margin: 0 0 8px 0; font-size: 14px;">Nhập mã này khi được yêu cầu:</p>
              <div style="color: white; font-size: 32px; font-weight: 700; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; letter-spacing: 6px; margin: 8px 0;">
                ${meetingPassword}
              </div>
            </div>
            
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">
              Vui lòng giữ mã này bảo mật
            </p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${meetingLink}" 
               target="_blank" 
               style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; border: none; cursor: pointer;">
              Tham gia cuộc hẹn
            </a>
          </div>

          <!-- Instructions -->
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px; font-weight: 600;">
              Hướng dẫn tham gia
            </h4>
            <ol style="margin: 0; padding-left: 20px; color: #0369a1; font-size: 14px; line-height: 1.6;">
              <li>Nhấn nút "Tham gia cuộc hẹn" ở trên</li>
              <li>Nhập mã truy cập khi được yêu cầu</li>
              <li>Cho phép truy cập camera và microphone</li>
              <li>Chờ bác sĩ tham gia và bắt đầu tư vấn</li>
            </ol>
          </div>

          <!-- Security Note -->
          <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 6px; padding: 16px; text-align: center;">
            <p style="margin: 0; color: #a16207; font-size: 14px; line-height: 1.5;">
              <strong>Bảo mật:</strong> Cuộc tư vấn được mã hóa và bảo vệ theo tiêu chuẩn y tế.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px;">
            Cảm ơn bạn đã tin tưởng Gender Healthcare
          </p>
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">
            © ${new Date().getFullYear()} Gender Healthcare. Mọi quyền được bảo lưu.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail(customerEmail, subject, htmlContent);
  console.log(`📧 [EMAIL-SENT] Clean customer meeting invite sent to: ${customerEmail}`);
};

