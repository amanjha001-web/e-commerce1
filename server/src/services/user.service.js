import bcrypt from "bcrypt";

import ApiError from "../utils/ApiError.js";

import userRepository from "../repositories/user.repository.js";

import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

/*                              Helper Functions                              */

const getUser = async (userId) => {
  const user = await userRepository.getUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const getAddress = (user, addressId) => {
  const address = user.addresses.id(addressId);

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  return address;
};

const validateAddress = (addressData) => {
  const requiredFields = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "postalCode",
    "country",
  ];

  for (const field of requiredFields) {
    if (
      addressData[field] === undefined ||
      addressData[field] === null ||
      String(addressData[field]).trim() === ""
    ) {
      throw new ApiError(400, `${field} is required`);
    }
  }
};

/*                           Get My Profile                                   */

const getMyProfile = async (userId) => {
  const user = await getUser(userId);

  return {
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    coverImage: user.coverImage,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
/*                             Update Profile                                 */

const updateProfile = async (
  userId,
  updateData,
) => {
  const user =
    await getUser(userId);

  const allowedFields = [
    "fullName",
    "username",
    "phone",
    "gender",
    "dateOfBirth",
  ];

  const data = {};

  /* ---------------- Allow Only Valid Fields ---------------- */

  for (const field of allowedFields) {
    if (
      updateData[field] !==
      undefined
    ) {
      data[field] =
        updateData[field];
    }
  }

  /* ---------------- Username Check ---------------- */

  if (
    data.username &&
    data.username !==
      user.username
  ) {
    const existingUser =
      await userRepository.getUserByUsername(
        data.username,
      );

    if (
      existingUser &&
      existingUser._id.toString() !==
        userId.toString()
    ) {
      throw new ApiError(
        409,
        "Username already exists",
      );
    }
  }

  /* ---------------- Phone Check ---------------- */

  if (
    data.phone &&
    data.phone !==
      user.phone
  ) {
    const existingUser =
      await userRepository.getUserByPhone(
        data.phone,
      );

    if (
      existingUser &&
      existingUser._id.toString() !==
        userId.toString()
    ) {
      throw new ApiError(
        409,
        "Phone number already exists",
      );
    }
  }

  Object.assign(
    user,
    data,
  );

  await user.save();

  return {
    _id: user._id,
    fullName:
      user.fullName,
    username:
      user.username,
    email: user.email,
    phone: user.phone,
    avatar:
      user.avatar,
    role: user.role,
    isVerified:
      user.isVerified,
    updatedAt:
      user.updatedAt,
  };
};
/*                             Upload Avatar                                  */

const uploadAvatar = async (
  userId,
  file,
) => {
  const user =
    await getUser(userId);

  if (!file) {
    throw new ApiError(
      400,
      "Avatar image is required",
    );
  }

  const uploaded =
    await uploadOnCloudinary(
      file.path,
    );

  if (!uploaded) {
    throw new ApiError(
      500,
      "Avatar upload failed",
    );
  }

  /* ---------------- Save Old Avatar ---------------- */

  const oldAvatar =
    user.avatar?.publicId;

  user.avatar = {
    url: uploaded.secure_url,
    publicId:
      uploaded.public_id,
  };

  await user.save();

  /* ---------------- Delete Old Avatar ---------------- */

  if (oldAvatar) {
    await deleteFromCloudinary(
      oldAvatar,
    );
  }

  return {
    avatar:
      user.avatar,
  };
};

/*                             Remove Avatar                                  */

const removeAvatar = async (
  userId,
) => {
  const user =
    await getUser(userId);

  if (
    user.avatar?.publicId
  ) {
    await deleteFromCloudinary(
      user.avatar.publicId,
    );
  }

  user.avatar = {
    url: "",
    publicId: "",
  };

  await user.save();

  return {
    message:
      "Avatar removed successfully",
  };
};

//cover image upload and remove functions can be added here in a similar manner as avatar functions

const updateCoverImage = async (userId, file) => {
  const user = await getUser(userId);

  if (!file) {
    throw new ApiError(400, "Cover image is required");
  }

  const uploaded = await uploadOnCloudinary(file.path);

  if (!uploaded) {
    throw new ApiError(500, "Cover image upload failed");
  }

  /* ---------------- Save Old Cover Image ---------------- */

  const oldCoverImage = user.coverImage?.publicId;

  user.coverImage = {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
  };

  await user.save();

  /* ---------------- Delete Old Cover Image ---------------- */

  if (oldCoverImage) {
    await deleteFromCloudinary(oldCoverImage);
  }

  return {
    coverImage: user.coverImage,
  };
};

/*                             Change Password                                */

const changePassword = async (userId, passwordData) => {
  const { currentPassword, newPassword, confirmPassword } = passwordData;
  /* ---------------- Get User With Password ---------------- */ const user =
    await userRepository.getUserWithPasswordById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  /* ---------------- Required Validation ---------------- */ if (
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {
    throw new ApiError(400, "All password fields are required");
  }
  /* ---------------- Password Match ---------------- */ if (
    newPassword !== confirmPassword
  ) {
    throw new ApiError(400, "Passwords do not match");
  }
  /* ---------------- Same Password ---------------- */ if (
    currentPassword === newPassword
  ) {
    throw new ApiError(
      400,
      "New password must be different from current password",
    );
  }
  /* ---------------- Verify Current Password ---------------- */ const isPasswordCorrect =
    await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Current password is incorrect");
  }
  /* ---------------- Set New Password ---------------- */ /* * Do NOT hash here. * User model's pre("save") middleware * will hash the password automatically. */ user.password =
    newPassword;
  /* ---------------- Save New Password ---------------- */ await user.save();
  return { success: true, message: "Password changed successfully" };
};

/*                                  Export                                    */

export default {
  getMyProfile,
  updateProfile,

  uploadAvatar,
  removeAvatar,
  updateCoverImage,

  changePassword,

 
};