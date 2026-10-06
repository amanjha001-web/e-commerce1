import { Navigate, Route, Routes } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import VerifyEmail from "../pages/auth/VerifyEmail";
import VerifyOTP from "../pages/auth/VerifyOTP";

import useAuth from "../hooks/useAuth";

const AuthRoutes = () => {
  const { forgotPassword, resetPassword, loading, error } = useAuth();

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        {/* Login */}
        <Route index element={<Login />} />

        {/* Register */}
        <Route path="register" element={<Register />} />

        {/* Forgot Password */}
        <Route
          path="forgot-password"
          element={
            <ForgotPassword
              loading={loading}
              error={error}
              onForgotPassword={forgotPassword}
            />
          }
        />

        {/* Reset Password */}
        <Route
          path="reset-password"
          element={
            <ResetPassword
              loading={loading}
              error={error}
              onResetPassword={resetPassword}
            />
          }
        />

        {/* Verify Email */}
        <Route path="verify-email" element={<VerifyEmail />} />

        {/* Verify OTP */}
        <Route path="verify-otp" element={<VerifyOTP />} />

        {/* Invalid Auth Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
};

export default AuthRoutes;
