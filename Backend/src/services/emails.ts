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

export const sendMenstrualCycleReminderEmail = async (
  to: string,
  fullName: string
): Promise<void> => {
  const subject = "Nhắc nhở cập nhật chu kỳ kinh nguyệt - Gender Healthcare";

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #E91E63;">Gender Healthcare</h2>
        <span style="font-size: 24px;">🌸</span>
      </div>
      
      <div style="padding: 20px; background-color: #fef7f7; border-radius: 5px; border-left: 4px solid #E91E63;">
        <h3 style="margin-top: 0; color: #E91E63;">Xin chào ${fullName},</h3>
        
        <p>Đây là lời nhắc nhở từ Gender Healthcare để bạn cập nhật thông tin chu kỳ kinh nguyệt hôm nay.</p>
        
        <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #ffe0e6;">
          <h4 style="margin-top: 0; color: #C2185B;">📅 Tại sao việc theo dõi hàng ngày lại quan trọng?</h4>
          <ul style="margin: 0; padding-left: 20px; color: #666;">
            <li>Giúp bạn hiểu rõ hơn về chu kỳ tự nhiên của cơ thể</li>
            <li>Hỗ trợ theo dõi sức khỏe sinh sản</li>
            <li>Cung cấp thông tin chính xác cho bác sĩ khi cần thiết</li>
            <li>Giúp dự đoán thời điểm kinh nguyệt tiếp theo</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <p style="margin: 10px 0; color: #666;">Hãy dành 2 phút để cập nhật thông tin hôm nay:</p>
          <a href="${process.env.FRONTEND_URL || 'https://gender-healthcare.vercel.app'}/cycle" 
             style="display: inline-block; background-color: #E91E63; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0;">
            Cập nhật chu kỳ ngay
          </a>
        </div>
        
        <div style="background-color: #fff3e0; border: 1px solid #ffcc80; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #f57c00; font-size: 14px;">
            <strong>💡 Mẹo:</strong> Hãy cập nhật thông tin vào cùng một thời điểm mỗi ngày để tạo thói quen tốt!
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Nếu bạn đã cập nhật thông tin hôm nay, bạn có thể bỏ qua email này. 
          Nếu không muốn nhận thông báo nhắc nhở nữa, bạn có thể tắt tính năng này trong cài đặt tài khoản.
        </p>
        
        <p>Chúc bạn một ngày tốt lành!<br/>Đội ngũ Gender Healthcare 💕</p>
      </div>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9e9e9; text-align: center; font-size: 12px; color: #999;">
        <p>© ${new Date().getFullYear()} Gender Healthcare. Tất cả các quyền được bảo lưu.</p>
        <p>
          <a href="${process.env.FRONTEND_URL || 'https://gender-healthcare.vercel.app'}/cycle" style="color: #E91E63;">Cập nhật chu kỳ</a> | 
          <a href="${process.env.FRONTEND_URL || 'https://gender-healthcare.vercel.app'}/profile" style="color: #E91E63;">Cài đặt thông báo</a>
        </p>
      </div>
    </div>
  `;

  await sendEmail(to, subject, htmlContent);
};




