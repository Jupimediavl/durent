import nodemailer from 'nodemailer';

// Configure Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Your Gmail App Password (not regular password)
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const emailService = {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: 'DuRent Dubai',
          address: process.env.GMAIL_USER || 'noreply@gmail.com'
        },
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      };

      console.log('📧 Sending email to:', options.to);
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via Gmail');
      return true;
    } catch (error: any) {
      console.error('❌ Email sending failed:', error.message);
      if (error.code) {
        console.error('❌ Gmail SMTP error code:', error.code);
      }
      return false;
    }
  },

  async sendVerificationCode(email: string, code: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - DuRent Dubai</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; padding: 20px 0; background: linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899); border-radius: 8px; margin-bottom: 30px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">DURENT DUBAI</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your Dubai Rental Platform</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 0 20px;">
            <h2 style="color: #1a1a1a; margin-bottom: 20px;">Hello ${name}!</h2>
            <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">
              Welcome to DuRent Dubai! To complete your registration and secure your account, please use the verification code below:
            </p>
            
            <!-- Verification Code -->
            <div style="text-align: center; margin: 40px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: #ffffff; padding: 20px 30px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; text-align: center; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);">
                ${code}
              </div>
            </div>
            
            <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 20px; font-size: 16px;">
              This code will expire in <strong>24 hours</strong>. If you didn't create an account with DuRent Dubai, you can safely ignore this email.
            </p>
            
            <!-- Security Note -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #6366F1;">
              <h3 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 16px;">🔐 Security Tips:</h3>
              <ul style="color: #4a4a4a; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
                <li>Never share this code with anyone</li>
                <li>DuRent staff will never ask for your verification code</li>
                <li>If you suspect suspicious activity, contact our support team</li>
              </ul>
            </div>
            
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px;">
              Thank you for choosing DuRent Dubai - Your trusted partner in Dubai's rental market!
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 30px 20px 20px; border-top: 1px solid #eee; margin-top: 40px;">
            <p style="color: #999; margin: 0; font-size: 12px;">
              © 2024 DuRent Dubai. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hello ${name}!
      
      Welcome to DuRent Dubai! Your verification code is: ${code}
      
      This code will expire in 24 hours.
      
      If you didn't create an account with DuRent Dubai, you can safely ignore this email.
      
      Thank you for choosing DuRent Dubai!
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your DuRent Dubai Account',
      html,
      text
    });
  }
};