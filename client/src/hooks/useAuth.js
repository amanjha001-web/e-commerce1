import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";

import {
  login,
  logout,
  register,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword,
} from "../store/slices/authSlice";

const useAuth = () => {
  const dispatch = useDispatch();

  const {
    user,
    isAuthenticated,
    loading,
    updatingProfile,
    error,
    accessToken,
  } = useSelector((state) => state.auth);

  // Login
  const handleLogin = useCallback(
    (credentials) => {
      return dispatch(login(credentials));
    },
    [dispatch],
  );

  // Register
  const handleRegister = useCallback(
    (userData) => {
      return dispatch(register(userData));
    },
    [dispatch],
  );

  // Logout
  const handleLogout = useCallback(() => {
    return dispatch(logout());
  }, [dispatch]);

  // Get Current User
  const handleGetCurrentUser = useCallback(() => {
    return dispatch(getCurrentUser());
  }, [dispatch]);

  // Update Profile
  const handleUpdateProfile = useCallback(
    (userData) => {
      return dispatch(updateProfile(userData));
    },
    [dispatch],
  );

  // Forgot Password
  const handleForgotPassword = useCallback(
    (email) => {
      return dispatch(forgotPassword(email)).unwrap();
    },
    [dispatch],
  );

  // Reset Password
  const handleResetPassword = useCallback(
    ({ token, password, confirmPassword }) => {
      return dispatch(
        resetPassword({
          token,
          password,
          confirmPassword,
        }),
      ).unwrap();
    },
    [dispatch],
  );

  return {
    user,
    isAuthenticated,
    loading,
    updatingProfile,
    error,
    accessToken,

    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    getCurrentUser: handleGetCurrentUser,
    updateProfile: handleUpdateProfile,

    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,

    role: user?.role || null,
    userId: user?._id || user?.id || null,
    username: user?.username || null,
    email: user?.email || null,
    fullName: user?.fullName || null,
    phone: user?.phone || null,
    avatar: user?.avatar || null,
    avatarUrl: user?.avatar?.url || null,
    isVerified: user?.isVerified || false,
    isBlocked: user?.isBlocked || false,
  };
};

export default useAuth;
