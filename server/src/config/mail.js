import nodemailer from 'nodemailer';
import { env } from './env.js';
import logger from './logger.js';

let transporter = null;

const isPlaceholderEmail =
  !env.SMTP_USER ||
  !env.SMTP_PASS ||
  env.SMTP_USER.includes('yourgmail') ||
  env.SMTP_PASS.includes('your_app_password');

if (!isPlaceholderEmail) {
  const transportConfig = env.MAIL_SERVICE
    ? {
        service: env.MAIL_SERVICE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      }
    : {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      };

  transporter = nodemailer.createTransport(transportConfig);
  logger.info('SMTP Mail transporter initialized.');
} else {
  // Test logger transport fallback
  transporter = {
    sendMail: async (options) => {
      logger.info(
        `[MOCK EMAIL SENT] To: ${options.to} | Subject: ${options.subject} | Text/HTML: ${options.text || options.html}`
      );
      return { messageId: `mock-${Date.now()}` };
    },
  };
  logger.info('SMTP credentials not configured or set to placeholder. Using mock mail transporter.');
}

export { transporter };
export default transporter;
