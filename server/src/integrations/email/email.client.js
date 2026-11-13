import transporter from '../../config/mail.js';
import { env } from '../../config/env.js';
import { emailTemplates } from './email.templates.js';
import logger from '../../config/logger.js';

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text: text || '',
      html: html || '',
    });
    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    // Don't crash main transaction if notification email fails
    return null;
  }
};

export const sendOtpEmail = async (email, name, otp) => {
  const template = emailTemplates.otpVerification({ name, otp });
  return sendEmail({ to: email, ...template });
};

export const sendWelcomeEmail = async (email, name) => {
  const template = emailTemplates.welcome({ name });
  return sendEmail({ to: email, ...template });
};

export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const template = emailTemplates.passwordReset({ name, resetUrl });
  return sendEmail({ to: email, ...template });
};

export const sendOrderConfirmationEmail = async (email, name, orderNumber, totalAmount) => {
  const template = emailTemplates.orderConfirmation({ name, orderNumber, totalAmount });
  return sendEmail({ to: email, ...template });
};

export const sendVendorStatusEmail = async (email, storeName, status, reason = '') => {
  const template = emailTemplates.vendorStatusUpdate({ storeName, status, reason });
  return sendEmail({ to: email, ...template });
};

export default {
  sendEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendVendorStatusEmail,
};
