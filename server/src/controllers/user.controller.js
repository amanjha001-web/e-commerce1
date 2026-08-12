import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import userService from "../services/user.service.js";
import { uploadAvatar } from "../middlewares/index.js";

/*                              Get My Profile                                */

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getMyProfile(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile fetched successfully"));
});

/*                             Update Profile                                 */

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully"));
});

/*                            Change Password                                 */

const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user._id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

/*                             Update Avatar                                  */

/*                             Update Avatar                                  */

const updateAvatar = asyncHandler(async (req, res) => {
  const user = await userService.uploadAvatar(req.user._id, req.file);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

/*                          Update Cover Image                                */

const updateCoverImage = asyncHandler(async (req, res) => {
  const user = await userService.updateCoverImage(req.user._id, req.file);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

/*                             Delete Account                                 */

const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Account deleted successfully"));
});
/*                              Get All Users                                 */

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

/*                              Get User By ID                                */

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

/*                               Update User                                  */

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.userId, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

/*                           Update User Status                               */

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.updateUserStatus(
    req.params.userId,
    req.body.status,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User status updated successfully"));
});

/*                               Delete User                                  */

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.userId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User deleted successfully"));
});

export default {
  getMyProfile,
  updateProfile,
  changePassword,
  updateAvatar,
  updateCoverImage,
  deleteAccount,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
};
