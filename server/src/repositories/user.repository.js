import { BaseRepository } from './base.repository.js';
import { User } from '../models/User.model.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, selectPassword = false) {
    let q = this.model.findOne({ email: email.toLowerCase() });
    if (selectPassword) {
      q = q.select('+password +refreshToken +otp +otpExpires +passwordResetToken +passwordResetExpires');
    }
    return q;
  }

  async findByUsername(username) {
    return this.model.findOne({ username: username.toLowerCase() });
  }

  async findByGoogleId(googleId) {
    return this.model.findOne({ googleId });
  }

  async updateRefreshToken(userId, refreshToken) {
    return this.model.findByIdAndUpdate(userId, { refreshToken }, { new: true });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
