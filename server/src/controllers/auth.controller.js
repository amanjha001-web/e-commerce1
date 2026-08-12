import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

import authService from "../services/auth.service.js";

/*                              Register User                                 */

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  if (
    [fullName, username, email, password].some(
      (field) => !field || field.trim() === "",
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const result = await authService.registerUser(req.body);

  return res
    .status(201)
    .cookie("accessToken", result.accessToken, result.cookieOptions)
    .cookie("refreshToken", result.refreshToken, result.cookieOptions)
    .json(
      new ApiResponse(
        201,
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        "User registered successfully",
      ),
    );
});

/*                                Login User                                  */

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const result = await authService.loginUser(req.body);

  return res
    .status(200)
    .cookie("accessToken", result.accessToken, result.cookieOptions)
    .cookie("refreshToken", result.refreshToken, result.cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        "Login successful",
      ),
    );
});
/*                               Logout User                                  */

const logoutUser = asyncHandler(async (req, res) => {
  const result = await authService.logoutUser(
    req.user._id,
  );

  return res
    .status(200)
    .clearCookie(
      "accessToken",
      result.cookieOptions,
    )
    .clearCookie(
      "refreshToken",
      result.cookieOptions,
    )
    .json(
      new ApiResponse(
        200,
        {},
        "User logged out successfully",
      ),
    );
});

/*                         Refresh Access Token                               */

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken ||
    req.body.refreshToken;

  const result =
    await authService.refreshAccessToken(
      incomingRefreshToken,
    );

  return res
    .status(200)
    .cookie(
      "accessToken",
      result.accessToken,
      result.cookieOptions,
    )
    .cookie(
      "refreshToken",
      result.refreshToken,
      result.cookieOptions,
    )
    .json(
      new ApiResponse(
        200,
        {
          accessToken:
            result.accessToken,
          refreshToken:
            result.refreshToken,
        },
        "Access token refreshed successfully",
      ),
    );
});

/*                           Get Current User                                 */

const getCurrentUser = asyncHandler(async (req, res) => {
  const user =
    await authService.getCurrentUser(
      req.user._id,
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Current user fetched successfully",
      ),
    );
});
/*                        Change Current Password                             */

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const {
    oldPassword,
    newPassword,
  } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(
      400,
      "Both passwords are required",
    );
  }

  await authService.changeCurrentPassword(
    req.user._id,
    oldPassword,
    newPassword,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password changed successfully",
      ),
    );
});

/*                        Update Account Details                              */

const updateAccountDetails = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
  } = req.body;

  if (!fullName || !email) {
    throw new ApiError(
      400,
      "All fields are required",
    );
  }

  const updatedUser =
    await authService.updateAccountDetails(
      req.user._id,
      req.body,
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        "Account updated successfully",
      ),
    );
});

//verify email

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  await authService.verifyEmail(token);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Email verified successfully"));
});


//resend verification email

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const result = await authService.resendVerification(email);

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Verification email resent successfully"),
    );
});

//forget password

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const result = await authService.forgotPassword(email);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Password reset link generated successfully",
      ),
    );
});

//reset password

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!token) {
    throw new ApiError(400, "Reset token is required");
  }

  if (!password || !confirmPassword) {
    throw new ApiError(400, "Password and confirm password are required");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  await authService.resetPassword(token, password);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

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