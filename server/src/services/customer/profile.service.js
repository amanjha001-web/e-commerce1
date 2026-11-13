import { User } from '../../models/User.model.js';
import { ApiError } from '../../utils/apiError.js';
import { sanitizeUser } from '../../utils/helpers.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';

export class CustomerProfileService {
  async getProfile(userId) {
    const user = await User.findById(userId).populate('vendorId');
    if (!user) throw ApiError.notFound('User not found');
    return sanitizeUser(user);
  }

  async updateProfile(userId, updateData) {
    const allowed = ['name', 'phone'];
    const filtered = {};
    for (const key of allowed) {
      if (updateData[key] !== undefined) filtered[key] = updateData[key];
    }

    const user = await User.findByIdAndUpdate(userId, filtered, {
      new: true,
      runValidators: true,
    });
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
