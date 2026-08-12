import { Router } from "express";

import { userController } from "../controllers/index.js";

import {
  authMiddleware,
  authorizeRoles,
  uploadAvatar,
  uploadCoverImage,
} from "../middlewares/index.js";

const router = Router();

/*                               Customer Routes                              */

// My Profile
router.get("/me", authMiddleware, userController.getMyProfile);

// Update Profile
router.patch("/me", authMiddleware, userController.updateProfile);

// Change Password
router.patch(
  "/me/change-password",
  authMiddleware,
  userController.changePassword,
);

// Update Avatar
router.patch(
  "/me/avatar",
  authMiddleware,
  uploadAvatar,
  userController.updateAvatar,
);

// Update Cover Image
router.patch(
  "/me/cover-image",
  authMiddleware,
  uploadCoverImage,
  userController.updateCoverImage,
);

// Delete Own Account
router.delete("/me", authMiddleware, userController.deleteAccount);

/*                                Admin Routes                                */

// Get All Users
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN"),
  userController.getAllUsers,
);

// Get User By ID
router.get(
  "/:userId",
  authMiddleware,
  authorizeRoles("ADMIN"),
  userController.getUserById,
);

// Update User
router.patch(
  "/:userId",
  authMiddleware,
  authorizeRoles("ADMIN"),
  userController.updateUser,
);

// Update User Status
router.patch(
  "/:userId/status",
  authMiddleware,
  authorizeRoles("ADMIN"),
  userController.updateUserStatus,
);

// Delete User
router.delete(
  "/:userId",
  authMiddleware,
  authorizeRoles("ADMIN"),
  userController.deleteUser,
);

export { router as userRoutes };
