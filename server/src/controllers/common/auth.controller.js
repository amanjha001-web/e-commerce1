import { authService } from '../../services/common/auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.created(res, result, 'Registration successful. Verification code sent to email.');
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, result, 'Login successful');
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user?._id);
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  return ApiResponse.success(res, null, 'Logged out successfully');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.refreshToken(token);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, result, 'Token refreshed successfully');
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  return ApiResponse.success(res, user, 'Current user retrieved');
});

export const sendVerificationOTP = asyncHandler(async (req, res) => {
  const result = await authService.sendVerificationOTP(req.body.email);
  return ApiResponse.success(res, result, result.message);
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const result = await authService.verifyOTP(req.body);
  return ApiResponse.success(res, result, result.message);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyOTP(req.body);
  return ApiResponse.success(res, result, result.message);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return ApiResponse.success(res, result, result.message);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const result = await authService.resetPassword(token, password);
  return ApiResponse.success(res, result, result.message);
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body);
  return ApiResponse.success(res, result, result.message);
});

export const googleLogin = asyncHandler(async (req, res) => {
  const result = await authService.googleLogin(req.body);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, result, 'Google login successful');
});

export const checkUsername = asyncHandler(async (req, res) => {
  const result = await authService.checkUsername(req.params.username);
  return ApiResponse.success(res, result, 'Username availability checked');
});

export const checkEmail = asyncHandler(async (req, res) => {
  const result = await authService.checkEmail(req.params.email);
  return ApiResponse.success(res, result, 'Email availability checked');
});
