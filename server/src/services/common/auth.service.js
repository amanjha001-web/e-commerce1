import { User } from '../../models/User.model.js';
import { ApiError } from '../../utils/apiError.js';
import {
  hashPassword,
  comparePassword,
  generateOtp,
  generateRandomToken,
  hashToken,
} from '../../utils/crypto.utils.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/token.utils.js';
import { sanitizeUser } from '../../utils/helpers.js';
import { sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../../integrations/email/email.client.js';
import { verifyGoogleIdToken } from '../../integrations/google/google.client.js';
import { env } from '../../config/env.js';
import { ROLES } from '../../constants/roles.constant.js';

export class AuthService {
  async register(payload) {
    const name = payload.fullName || payload.name;
    const { email, password, phone, username, role } = payload;
    const confirmPassword = payload.confirmPassword ?? payload.conformPassword;

    if (confirmPassword !== undefined && confirmPassword !== null && confirmPassword !== '') {
      if (password !== confirmPassword) {
        throw ApiError.badRequest('Passwords do not match');
      }
    }

    if (!name) {
      throw ApiError.badRequest('Full name is required');
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      throw ApiError.conflict('Email is already registered');
    }

    if (username) {
      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) {
        throw ApiError.conflict('Username is already taken');
      }
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOtp(6);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let assignedRole = ROLES.USER;
    if (role) {
      const normalizedRole = String(role).trim().toLowerCase();
      if (normalizedRole === 'vendor' || normalizedRole === 'seller') {
        assignedRole = ROLES.VENDOR;
      } else if (normalizedRole === 'user' || normalizedRole === 'customer') {
        assignedRole = ROLES.USER;
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username: username ? username.toLowerCase() : undefined,
      password: hashedPassword,
      phone: phone || '',
      role: assignedRole,
      otp,
      otpExpires,
      isEmailVerified: false,
    });

    // Send verification OTP asynchronously
    sendOtpEmail(user.email, user.name, otp).catch(() => {});
    sendWelcomeEmail(user.email, user.name).catch(() => {});

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password, role }) {
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +refreshToken')
      .populate('vendorId');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
    }

    if (!user.password) {
      throw ApiError.badRequest('This account was registered via Google. Please log in with Google.');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // If role is provided in request body, verify role authorization
    if (role) {
      const reqRole = String(role).trim().toLowerCase().replace(/[\s-]+/g, '_');
      const userRole = String(user.role).trim().toLowerCase();

      const isCustomer = (reqRole === 'customer' || reqRole === 'user') && (userRole === 'user' || userRole === 'customer');
      const isVendor = (reqRole === 'vendor' || reqRole === 'seller') && userRole === 'vendor';
      const isAdmin = (reqRole === 'admin' || reqRole === 'super_admin') && (userRole === 'admin' || userRole === 'super_admin');
      const isDirectMatch = reqRole === userRole;

      if (!isCustomer && !isVendor && !isAdmin && !isDirectMatch) {
        throw ApiError.forbidden(`Access denied: You do not have permission to log in as ${role}`);
      }
    }

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.name = user.name || user.fullName || user.username || 'User';
    user.fullName = user.fullName || user.name;
    await user.save({ validateModifiedOnly: true });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async logout(userId) {
    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshToken: null });
    }
    return { message: 'Logged out successfully' };
  }

  async refreshToken(oldRefreshToken) {
    if (!oldRefreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or deactivated');
    }

    if (user.refreshToken !== oldRefreshToken) {
      // Refresh token rotation violation -> revoke
      user.refreshToken = null;
      await user.save();
      throw ApiError.unauthorized('Refresh token reuse detected. Please log in again.');
    }

    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user._id, role: user.role });

    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId).populate('vendorId');
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return sanitizeUser(user);
  }

  async sendVerificationOTP(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw ApiError.notFound('No user found with this email');
    }

    const otp = generateOtp(6);
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, user.name, otp);
    return { message: 'Verification OTP sent successfully' };
  }

  async verifyOTP({ email, otp }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpires');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.otp || !user.otpExpires || user.otp !== otp || user.otpExpires < new Date()) {
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.isEmailVerified = true;
    await user.save();

    return { message: 'Email verified successfully', isEmailVerified: true };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Avoid revealing user existence
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    const rawToken = generateRandomToken(32);
    user.passwordResetToken = hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    const resetUrl = `${env.CLIENT_URL}/reset-password/${rawToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return { message: 'Password reset instructions sent to your email.' };
  }

  async resetPassword(token, newPassword) {
    const hashed = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw ApiError.badRequest('Password reset token is invalid or has expired.');
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = null; // Revoke active sessions
    await user.save();

    return { message: 'Password reset successful. Please log in with your new password.' };
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      throw ApiError.badRequest('Incorrect current password.');
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return { message: 'Password changed successfully.' };
  }

  async googleLogin({ token, idToken, credential }) {
    const googleToken = token || idToken || credential;
    if (!googleToken) {
      throw ApiError.badRequest('Google ID token is required');
    }

    const payload = await verifyGoogleIdToken(googleToken);
    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }],
    });

    if (!user) {
      user = await User.create({
        name: payload.name || 'Google User',
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
        avatar: { url: payload.picture || '' },
        isEmailVerified: true,
        role: ROLES.USER,
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.isEmailVerified = true;
      if (!user.avatar?.url && payload.picture) {
        user.avatar = { url: payload.picture };
      }
      await user.save();
    }

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.name = user.name || user.fullName || user.username || 'User';
    user.fullName = user.fullName || user.name;
    await user.save({ validateModifiedOnly: true });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async checkUsername(username) {
    const exists = await User.findOne({ username: username.toLowerCase() });
    return { available: !exists };
  }

  async checkEmail(email) {
    const exists = await User.findOne({ email: email.toLowerCase() });
    return { available: !exists };
  }
}

export const authService = new AuthService();
export default authService;
