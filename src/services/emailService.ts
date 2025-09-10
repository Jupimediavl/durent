import nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure with Gmail SMTP or your preferred email service
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App password for Gmail
      },
    });
  }

  async sendVerificationEmail(userEmail: string, userName: string, userId: string): Promise<boolean> {
    try {
      // Generate verification token
      const verificationToken = randomUUID();
      
      // Store token in database
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerificationToken: verificationToken }
      });

      // Create verification URL
      const verificationUrl = `${process.env.APP_URL || 'http://localhost:4000'}/api/auth/verify-email/${verificationToken}`;

      // Email HTML template
      const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #0F0F23; color: #FFFFFF; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1A1A2E, #16213E); padding: 40px; border-radius: 15px; }
            .logo { text-align: center; margin-bottom: 30px; }
            .logo h1 { color: #6366F1; font-size: 32px; margin: 0; letter-spacing: 2px; }
            .content { text-align: center; }
            .welcome { font-size: 24px; margin-bottom: 20px; color: #FFFFFF; }
            .message { font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: #94A3B8; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 1px; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #64748B; }
            .link { color: #6366F1; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>🏠 DURENT DUBAI</h1>
            </div>
            <div class="content">
              <div class="welcome">Welcome ${userName.toUpperCase()}!</div>
              <div class="message">
                Thank you for joining duRent Dubai! To complete your account setup, please verify your email address by clicking the button below.
              </div>
              <a href="${verificationUrl}" class="button">VERIFY EMAIL ADDRESS</a>
              <div class="footer">
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p class="link">${verificationUrl}</p>
                <br>
                <p>This link will expire in 24 hours for security reasons.</p>
                <p>If you didn't create an account with duRent Dubai, please ignore this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email
      await this.transporter.sendMail({
        from: `"duRent Dubai" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Verify Your duRent Dubai Account',
        html: emailHTML,
      });

      console.log(`✅ Verification email sent to ${userEmail}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return false;
    }
  }

  async verifyEmailToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Find user with this token
      const user = await prisma.user.findFirst({
        where: { emailVerificationToken: token }
      });

      if (!user) {
        return { success: false, error: 'Invalid verification token' };
      }

      if (user.emailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      // Verify email and clear token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null
        }
      });

      console.log(`✅ Email verified for user: ${user.email}`);
      return { success: true, userId: user.id };

    } catch (error) {
      console.error('❌ Failed to verify email token:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  async resendVerificationEmail(userEmail: string): Promise<boolean> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (!user) {
        console.log('❌ User not found for resend verification');
        return false;
      }

      if (user.emailVerified) {
        console.log('❌ Email already verified');
        return false;
      }

      // Send verification email
      return await this.sendVerificationEmail(user.email, user.name, user.id);

    } catch (error) {
      console.error('❌ Failed to resend verification email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();