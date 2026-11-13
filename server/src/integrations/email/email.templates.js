export const emailTemplates = {
  welcome: ({ name }) => ({
    subject: 'Welcome to ShopSphere!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Welcome to ShopSphere, ${name}!</h2>
        <p>Thank you for joining our marketplace. We are thrilled to have you with us.</p>
        <p>Start exploring thousands of curated products from trusted vendors today.</p>
        <div style="margin-top: 30px; font-size: 12px; color: #6B7280;">
          &copy; ${new Date().getFullYear()} ShopSphere Inc. All rights reserved.
        </div>
      </div>
    `,
  }),

  otpVerification: ({ name, otp }) => ({
    subject: 'Your ShopSphere Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Your one-time verification code is:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #111827; padding: 16px; background: #F3F4F6; border-radius: 8px; text-align: center; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  }),

  passwordReset: ({ name, resetUrl }) => ({
    subject: 'Reset Your ShopSphere Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You requested a password reset for your ShopSphere account. Click the button below to set a new password:</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>This link is valid for 15 minutes. If you did not request this reset, your account is safe and no action is required.</p>
      </div>
    `,
  }),

  orderConfirmation: ({ name, orderNumber, totalAmount }) => ({
    subject: `Order Confirmed: #${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10B981;">Order Confirmed!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for shopping with ShopSphere. Your order <strong>#${orderNumber}</strong> has been received and is being processed.</p>
        <p>Total Amount: <strong>₹${totalAmount}</strong></p>
        <p>You will receive another update when your package ships.</p>
      </div>
    `,
  }),

  vendorStatusUpdate: ({ storeName, status, reason }) => ({
    subject: `Vendor Application Status: ${status.toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>ShopSphere Vendor Update</h2>
        <p>Dear ${storeName},</p>
        <p>Your vendor application status has been updated to: <strong>${status}</strong>.</p>
        ${reason ? `<p>Details: ${reason}</p>` : ''}
      </div>
    `,
  }),
};

export default emailTemplates;
