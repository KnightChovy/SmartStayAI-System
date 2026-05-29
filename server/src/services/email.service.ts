import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from '../config/logger';

export class EmailService {
  public transport: nodemailer.Transporter;

  constructor() {
    this.transport = nodemailer.createTransport(config.email.smtp);
    /* istanbul ignore next */
    if (config.env !== 'test') {
      this.transport
        .verify()
        .then(() => logger.info('Connected to email server'))
        .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
    }
  }

  // Premium email templates wrapping function helper
  private getEmailWrapperHtml = (title: string, contentHtml: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f6f8fa;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 580px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
            border: 1px solid #eaeaea;
            overflow: hidden;
          }
          .header {
            background-color: #1a1a1a;
            padding: 32px 40px;
            text-align: center;
          }
          .header h1 {
            color: #c5a880;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 4px;
            margin: 0;
            text-transform: uppercase;
          }
          .content {
            padding: 40px;
            color: #2e2e2e;
            line-height: 1.6;
          }
          .content p {
            font-size: 16px;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .content h2 {
            font-size: 20px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 16px;
            color: #1a1a1a;
          }
          .otp-box {
            background-color: #fcfaf6;
            border: 1px dashed #c5a880;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 32px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #c5a880;
            margin: 0;
          }
          .btn-container {
            text-align: center;
            margin: 36px 0;
          }
          .btn {
            background-color: #c5a880;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
            display: inline-block;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 12px rgba(197, 168, 128, 0.2);
          }
          .footer {
            background-color: #fafafa;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #eaeaea;
          }
          .footer p {
            font-size: 13px;
            color: #888888;
            margin: 0 0 8px 0;
          }
          .footer a {
            color: #c5a880;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SmartStay AI</h1>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p>© 2026 SmartStayAI Platform. All rights reserved.</p>
            <p><a href="https://smartstay.ai/privacy">Privacy Policy</a> | <a href="https://smartstay.ai/terms">Terms of Service</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  /**
   * Send an email
   * @param {string} to
   * @param {string} subject
   * @param {string} text
   * @param {string} [html]
   * @returns {Promise<void>}
   */
  sendEmail = async (to: string, subject: string, text: string, html?: string) => {
    const msg = { from: config.email.from, to, subject, text, html };
    await this.transport.sendMail(msg);
  };

  /**
   * Send reset password email
   * @param {string} to
   * @param {string} token
   * @returns {Promise<void>}
   */
  sendResetPasswordEmail = async (to: string, token: string) => {
    const subject = 'Reset password';
    const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
    
    const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;

    const html = this.getEmailWrapperHtml(
      'Reset your password',
      `
        <h2>Yêu cầu khôi phục mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với địa chỉ email của bạn tại hệ thống SmartStayAI.</p>
        <p>Vui lòng nhấp vào nút bên dưới để tiến hành đổi mật khẩu mới. Liên kết này sẽ hết hạn sau 10 phút.</p>
        <div class="btn-container">
          <a href="${resetPasswordUrl}" class="btn">Khôi Phục Mật Khẩu</a>
        </div>
        <p>If you did not request any password resets, then ignore this email.</p>
      `
    );

    await this.sendEmail(to, subject, text, html);
  };

  /**
   * Send verification email
   * @param {string} to
   * @param {string} token
   * @returns {Promise<void>}
   */
  sendVerificationEmail = async (to: string, token: string) => {
    const subject = 'Email Verification';
    const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
    
    const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;

    const html = this.getEmailWrapperHtml(
      'Verify your email',
      `
        <h2>Xác thực địa chỉ Email</h2>
        <p>Xin chào,</p>
        <p>Cảm ơn bạn đã lựa chọn sử dụng dịch vụ của quản gia số SmartStayAI.</p>
        <p>Vui lòng nhấp vào nút dưới đây để hoàn tất việc xác thực địa chỉ email cho tài khoản của bạn:</p>
        <div class="btn-container">
          <a href="${verificationEmailUrl}" class="btn">Xác Thực Tài Khoản</a>
        </div>
        <p>If you did not create an account, then ignore this email.</p>
      `
    );

    await this.sendEmail(to, subject, text, html);
  };

  /**
   * Send OTP verification email
   * @param {string} to
   * @param {string} otpCode
   * @returns {Promise<void>}
   */
  sendOtpEmail = async (to: string, otpCode: string) => {
    const subject = 'Verification Code - SmartStayAI';
    
    const text = `Dear user,
Your verification code is: ${otpCode}
This code is valid for 10 minutes. Do not share it with anyone.`;

    const html = this.getEmailWrapperHtml(
      'Your Verification Code',
      `
        <h2>Mã xác thực tài khoản</h2>
        <p>Xin chào,</p>
        <p>Cảm ơn bạn đã lựa chọn trải nghiệm dịch vụ quản gia cá nhân thế hệ mới của SmartStayAI.</p>
        <p>Dưới đây là mã xác thực (OTP) kích hoạt tài khoản đăng ký của bạn:</p>
        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
        </div>
        <p>Mã xác nhận này sẽ có hiệu lực trong vòng **10 phút**. Vì sự an toàn của tài khoản, tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
      `
    );

    await this.sendEmail(to, subject, text, html);
  };
}

export const emailService = new EmailService();
