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
    throw error;
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




