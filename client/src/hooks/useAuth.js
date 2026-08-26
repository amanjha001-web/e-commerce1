import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";

import {
  login,
  logout,
  register,
  getCurrentUser,
} from "../store/slices/authSlice";

const useAuth = () => {
  const dispatch = useDispatch();

  const { user, isAuthenticated, isLoading, error, accessToken } = useSelector(
    (state) => state.auth,
  );

  const handleLogin = useCallback(
    (credentials) => {
      return dispatch(login(credentials));
    },
    [dispatch],
  );

  const handleRegister = useCallback(
    (userData) => {
      return dispatch(register(userData));
    },
    [dispatch],
  );

  const handleLogout = useCallback(() => {
    return dispatch(logout());
  }, [dispatch]);

  const handleGetCurrentUser = useCallback(() => {
    return dispatch(getCurrentUser());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,

    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    getCurrentUser: handleGetCurrentUser,

    role: user?.role || null,
    userId: user?._id || user?.id || null,
    username: user?.username || null,
    email: user?.email || null,
    fullName: user?.fullName || null,
    avatar: user?.avatar || null,
  };
};

export default useAuth;
