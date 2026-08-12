import jwt from "jsonwebtoken";
import crypto from "crypto";

import ApiError from "../utils/ApiError.js";
import userRepository from "../repositories/user.repository.js";


/*                              Cookie Options                                */


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};


/*                    Generate Access & Refresh Tokens                        */


const generateAccessAndRefreshTokens = async (userId) => {
  const user = await userRepository.getUserWithPasswordById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked");
  }

  const accessToken = user.generateAccessToken();

  const refreshToken = user.generateRefreshToken();

  await userRepository.updateRefreshToken(user._id, refreshToken);

  return {
    accessToken,
    refreshToken,
  };
};


/*                              Register User                                 */


const registerUser = async (userData) => {
  const { fullName, username, email, password } = userData;

  const emailExists = await userRepository.getUserByEmail(email);

  if (emailExists) {
    throw new ApiError(409, "Email already registered");
  }

  const usernameExists =
    await userRepository.getUserByUsername(username);

  if (usernameExists) {
    throw new ApiError(409, "Username already exists");
  }

  const user = await userRepository.createUser({
    fullName,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
  });

  const tokens =
    await generateAccessAndRefreshTokens(user._id);

  const createdUser =
    await userRepository.getUserById(user._id);

  return {
    user: createdUser,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    cookieOptions,
  };
};


/*                                Login User                                  */


const loginUser = async (loginData) => {
  const { email, password } = loginData;

  const user =
    await userRepository.getUserWithPasswordByEmail(
      email.toLowerCase(),
    );

  if (!user) {
    throw new ApiError(
      401,
      "Invalid email or password",
    );
  }

  if (user.isBlocked) {
    throw new ApiError(
      403,
      "Your account has been blocked",
    );
  }

  const isPasswordCorrect =
    await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(
      401,
      "Invalid email or password",
    );
  }

  user.lastLogin = new Date();

  await user.save({
    validateBeforeSave: false,
  });

  const {
    accessToken,
    refreshToken,
  } =
    await generateAccessAndRefreshTokens(
      user._id,
    );

  const loggedInUser =
    await userRepository.getUserById(
      user._id,
    );

  return {
    user: loggedInUser,
    accessToken,
    refreshToken,
    cookieOptions,
  };
};


/*                                Logout User                                 */


const logoutUser = async (userId) => {
  const user =
    await userRepository.getUserWithPasswordById(
      userId,
    );

  if (!user) {
    throw new ApiError(
      404,
      "User not found",
    );
  }

  await userRepository.updateRefreshToken(
    userId,
    "",
  );

  return {
    cookieOptions,
  };
};


/*                         Refresh Access Token                               */


const refreshAccessToken = async (
  incomingRefreshToken,
) => {
  if (!incomingRefreshToken) {
    throw new ApiError(
      401,
      "Unauthorized Request",
    );
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_SECRET,
    );
  } catch {
    throw new ApiError(
      401,
      "Invalid Refresh Token",
    );
  }

  const user =
    await userRepository.getUserWithPasswordById(
      decodedToken._id,
    );

  if (!user) {
    throw new ApiError(
      401,
      "Invalid Refresh Token",
    );
  }

  if (user.isBlocked) {
    throw new ApiError(
      403,
      "Your account has been blocked",
    );
  }

  if (
    user.refreshToken !==
    incomingRefreshToken
  ) {
    throw new ApiError(
      401,
      "Refresh Token Expired",
    );
  }

  const {
    accessToken,
    refreshToken,
  } =
    await generateAccessAndRefreshTokens(
      user._id,
    );

  return {
    accessToken,
    refreshToken,
    cookieOptions,
  };
};


/*                           Get Current User                                 */


const getCurrentUser = async (userId) => {
  const user =
    await userRepository.getUserById(
      userId,
    );

  if (!user) {
    throw new ApiError(
      404,
      "User not found",
    );
  }

  if (user.isBlocked) {
    throw new ApiError(
      403,
      "Your account has been blocked",
    );
  }

  return user;
};


/*                        Change Current Password                             */


const changeCurrentPassword = async (
  userId,
  oldPassword,
  newPassword,
) => {
  const user =
    await userRepository.getUserWithPasswordById(
      userId,
    );

  if (!user) {
    throw new ApiError(
      404,
      "User not found",
    );
  }

  if (user.isBlocked) {
    throw new ApiError(
      403,
      "Your account has been blocked",
    );
  }

  const isPasswordCorrect =
    await user.isPasswordCorrect(
      oldPassword,
    );

  if (!isPasswordCorrect) {
    throw new ApiError(
      400,
      "Old password is incorrect",
    );
  }

  user.password = newPassword;

  await user.save();

  return true;
};


/*                        Update Account Details                              */


const updateAccountDetails = async (
  userId,
  updateData,
) => {
  const {
    fullName,
    email,
  } = updateData;

  const user =
    await userRepository.getUserById(
      userId,
    );

  if (!user) {
    throw new ApiError(
      404,
      "User not found",
    );
  }

  if (user.isBlocked) {
    throw new ApiError(
      403,
      "Your account has been blocked",
    );
  }

  if (
    email &&
    email.toLowerCase() !== user.email
  ) {
    const existingUser =
      await userRepository.getUserByEmail(
        email,
      );

    if (
      existingUser &&
      existingUser._id.toString() !==
        userId.toString()
    ) {
      throw new ApiError(
        409,
        "Email already exists",
      );
    }
  }

  const updatedUser =
    await userRepository.updateUser(
      userId,
      {
        fullName,
        email: email?.toLowerCase(),
      },
    );

  return updatedUser;
};


/*                         Generate Secure Token                              */


const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex");
};


/*                         Verify Email                                       */


const verifyEmail = async (token) => {
  const user =
    await userRepository.getUserByVerificationToken(
      token,
    );

  if (!user) {
    throw new ApiError(
      400,
      "Invalid email verification token",
    );
  }

  if (
    !user.emailVerificationExpires ||
    user.emailVerificationExpires < new Date()
  ) {
    throw new ApiError(
      400,
      "Email verification token has expired",
    );
  }

  if (user.isVerified) {
    throw new ApiError(
      400,
      "Email is already verified",
    );
  }

  await userRepository.updateUser(
    user._id,
    {
      isVerified: true,
      emailVerificationToken: "",
      emailVerificationExpires: null,
    },
  );

  return true;
};


/*                      Resend Email Verification                             */


const resendVerification = async (email) => {
  const user =
    await userRepository.getUserByEmail(
      email,
    );

  if (!user) {
    throw new ApiError(
      404,
      "User not found",
    );
  }

  if (user.isVerified) {
    throw new ApiError(
      400,
      "Email is already verified",
    );
  }

  const verificationToken =
    generateSecureToken();

  const verificationExpires =
    new Date(
      Date.now() + 15 * 60 * 1000,
    );

  await userRepository.updateUser(
    user._id,
    {
      emailVerificationToken:
        verificationToken,

      emailVerificationExpires:
        verificationExpires,
    },
  );

  return {
    token: verificationToken,
    expiresAt: verificationExpires,
  };
};


/*                         Forgot Password                                    */


const forgotPassword = async (email) => {
  const user =
    await userRepository.getUserByEmail(
      email,
    );

  if (!user) {
    throw new ApiError(
      404,
      "User not found",
    );
  }

  if (user.isBlocked) {
    throw new ApiError(
      403,
      "Your account has been blocked",
    );
  }

  const resetToken =
    generateSecureToken();

  const resetExpires =
    new Date(
      Date.now() + 15 * 60 * 1000,
    );

  await userRepository.updateUser(
    user._id,
    {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    },
  );

  return {
    token: resetToken,
    expiresAt: resetExpires,
  };
};


/*                           Reset Password                                   */


const resetPassword = async (
  token,
  newPassword,
) => {
  const user =
    await userRepository.getUserByPasswordResetToken(
      token,
    );

  if (!user) {
    throw new ApiError(
      400,
      "Invalid password reset token",
    );
  }

  if (
    !user.passwordResetExpires ||
    user.passwordResetExpires < new Date()
  ) {
    throw new ApiError(
      400,
      "Password reset token has expired",
    );
  }

  if (user.isBlocked) {
    throw new ApiError(
      403,
      "Your account has been blocked",
    );
  }

  user.password = newPassword;
  user.passwordResetToken = "";
  user.passwordResetExpires = null;

  await user.save();

  await userRepository.updateRefreshToken(
    user._id,
    "",
  );

  return true;
};


/*                                  Export                                    */


export default {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,

  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};