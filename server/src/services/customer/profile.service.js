import { User } from '../../models/User.model.js';
import { ApiError } from '../../utils/apiError.js';
import { sanitizeUser } from '../../utils/helpers.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';
import { generateOtp, getGravatarUrl } from '../../utils/crypto.utils.js';
import { sendOtpEmail } from '../../integrations/email/email.client.js';
import logger from '../../config/logger.js';

export class CustomerProfileService {
  async getProfile(userId) {
    const user = await User.findById(userId).populate('vendorId');
    if (!user) throw ApiError.notFound('User not found');
    return sanitizeUser(user);
  }

  async updateProfile(userId, updateData = {}) {
    const user = await User.findById(userId).select('+otp +otpExpires +pendingEmail');
    if (!user) throw ApiError.notFound('User not found');

    // Name / FullName
    if (updateData.fullName || updateData.name) {
      const nameVal = (updateData.fullName || updateData.name).trim();
      user.name = nameVal;
      user.fullName = nameVal;
    }

    // Phone
    if (updateData.phone !== undefined) {
      user.phone = String(updateData.phone).trim();
    }

    // Username
    if (updateData.username && updateData.username.trim().toLowerCase() !== user.username) {
      const normalizedUsername = updateData.username.trim().toLowerCase();
      const existing = await User.findOne({ username: normalizedUsername, _id: { $ne: userId } });
      if (existing) throw ApiError.conflict('Username is already taken');
      user.username = normalizedUsername;
    }

    // Gender
    if (updateData.gender !== undefined) {
      user.gender = updateData.gender;
    }

    // Date of Birth
    if (updateData.dateOfBirth !== undefined) {
      user.dateOfBirth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
    }

    // Bio
    if (updateData.bio !== undefined) {
      user.bio = String(updateData.bio).trim();
    }

    // Avatar direct URL / object
    if (updateData.avatar !== undefined) {
      if (typeof updateData.avatar === 'string') {
        user.avatar = { url: updateData.avatar, publicId: '' };
      } else if (updateData.avatar && typeof updateData.avatar === 'object') {
        user.avatar = {
          url: updateData.avatar.url || '',
          publicId: updateData.avatar.publicId || '',
        };
      }
    }

    // Email update handling (with OTP verification)
    if (updateData.email && updateData.email.trim().toLowerCase() !== user.email) {
      const normalizedEmail = updateData.email.trim().toLowerCase();
      
      // If OTP is provided, verify and commit email change
      if (updateData.otp) {
        if (!user.otp || !user.otpExpires || user.otp !== updateData.otp || user.otpExpires < new Date()) {
          throw ApiError.badRequest('Invalid or expired verification code');
        }
        const existingEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
        if (existingEmail) throw ApiError.conflict('Email is already registered with another account');

        user.email = normalizedEmail;
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.pendingEmail = undefined;
      } else {
        throw ApiError.badRequest('Email change requires OTP verification. Please request a verification code.');
      }
    }

    await user.save();
    return sanitizeUser(user);
  }

  async requestEmailUpdate(userId, newEmail) {
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      throw ApiError.badRequest('Please provide a valid email address');
    }
    const normalizedEmail = newEmail.trim().toLowerCase();
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.email === normalizedEmail) {
      throw ApiError.badRequest('New email is identical to your current email');
    }

    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
    if (existing) {
      throw ApiError.conflict('This email is already in use by another account');
    }

    const otp = generateOtp(6);
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.pendingEmail = normalizedEmail;
    await user.save();

    sendOtpEmail(normalizedEmail, user.name || 'User', otp).catch((err) => {
      logger.warn('Failed to send verification OTP email:', err);
    });

    return {
      message: `Verification code sent to ${normalizedEmail}`,
      pendingEmail: normalizedEmail,
    };
  }

  async verifyEmailUpdate(userId, otp, updateData = {}) {
    if (!otp) throw ApiError.badRequest('Verification code (OTP) is required');

    const user = await User.findById(userId).select('+otp +otpExpires +pendingEmail');
    if (!user) throw ApiError.notFound('User not found');

    if (!user.otp || !user.otpExpires || user.otp !== String(otp).trim() || user.otpExpires < new Date()) {
      throw ApiError.badRequest('Invalid or expired verification code');
    }

    const targetEmail = user.pendingEmail || updateData.email;
    if (!targetEmail) {
      throw ApiError.badRequest('No pending email update found');
    }

    const normalizedEmail = targetEmail.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
    if (existing) {
      throw ApiError.conflict('This email is already registered with another account');
    }

    user.email = normalizedEmail;
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.pendingEmail = undefined;

    // Apply any additional profile updates passed alongside
    if (updateData.fullName || updateData.name) {
      const nameVal = (updateData.fullName || updateData.name).trim();
      user.name = nameVal;
      user.fullName = nameVal;
    }
    if (updateData.phone !== undefined) user.phone = String(updateData.phone).trim();
    if (updateData.username) user.username = updateData.username.trim().toLowerCase();
    if (updateData.gender !== undefined) user.gender = updateData.gender;
    if (updateData.dateOfBirth !== undefined) {
      user.dateOfBirth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
    }
    if (updateData.bio !== undefined) user.bio = String(updateData.bio).trim();

    await user.save();
    return sanitizeUser(user);
  }

  async fetchGravatar(userId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const gravatarUrl = getGravatarUrl(user.email);
    user.avatar = {
      url: gravatarUrl,
      publicId: '',
    };
    await user.save();

    return sanitizeUser(user);
  }

  async updateAvatar(userId, file) {
    if (!file) throw ApiError.badRequest('Avatar image is required');
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId).catch(() => {});
    }

    const uploaded = await uploadToCloudinary(file.buffer, 'avatars');
    user.avatar = {
      url: uploaded.url,
      publicId: uploaded.publicId,
    };
    await user.save();

    return sanitizeUser(user);
  }

  async deleteAvatar(userId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId).catch(() => {});
    }

    user.avatar = { url: '', publicId: '' };
    await user.save();

    return sanitizeUser(user);
  }

  async updateUsername(userId, username) {
    const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: userId } });
    if (existing) throw ApiError.conflict('Username is already taken');

    const user = await User.findByIdAndUpdate(
      userId,
      { username: username.toLowerCase() },
      { new: true }
    );
    return sanitizeUser(user);
  }

  async updateEmail(userId, email) {
    const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
    if (existing) throw ApiError.conflict('Email is already in use');

    const user = await User.findByIdAndUpdate(
      userId,
      { email: email.toLowerCase(), isEmailVerified: false },
      { new: true }
    );
    return sanitizeUser(user);
  }

  async deactivateAccount(userId) {
    await User.findByIdAndUpdate(userId, { isActive: false, refreshToken: null });
    return { message: 'Account deactivated successfully' };
  }

  async deleteAccount(userId) {
    await User.findByIdAndDelete(userId);
    return { message: 'Account deleted permanently' };
  }
}

export const customerProfileService = new CustomerProfileService();
export default customerProfileService;
