
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";

const ForgotPassword = ({
  loading = false,
  error = "",
  onForgotPassword,
}) => {
  const navigate = useNavigate();

  const [submitted, setSubmitted] =
    useState(false);

  const handleSubmit = async (data) => {
    const result =
      await onForgotPassword?.(data);

    if (result !== false) {
      setSubmitted(true);

      navigate("/verify-otp", {
        replace: true,
        state: {
          email: data?.email,
          purpose: "reset-password",
        },
      });
    }

    return result;
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email address and we'll help you reset your password"
    >
      <div className="space-y-6">
        {submitted ? (
          <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              OTP Sent
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              We've sent a verification code to your email address.
              Please check your inbox and continue with verification.
            </p>

            <Link
              to="/verify-otp"
              state={{
                purpose: "reset-password",
              }}
              className="mt-5 inline-flex font-medium text-primary hover:text-primary/80"
            >
              Verify OTP
            </Link>
          </div>
        ) : (
          <ForgotPasswordForm
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
          />
        )}

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
