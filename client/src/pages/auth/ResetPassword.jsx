
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

const ResetPassword = ({
  loading = false,
  error = "",
  onResetPassword,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [success, setSuccess] =
    useState(false);

  const email =
    location.state?.email || "";

  const otp =
    location.state?.otp || "";

  const handleSubmit = async (data) => {
    const payload = {
      ...data,
      email,
      otp,
    };

    const result =
      await onResetPassword?.(payload);

    if (result !== false) {
      setSuccess(true);
    }

    return result;
  };

  if (success) {
    return (
      <AuthLayout
        title="Password Reset Successful"
        subtitle="Your password has been updated successfully"
      >
        <div className="space-y-6 text-center">
          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
              ✓
            </div>

            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Password Updated
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your password has been reset successfully.
              You can now sign in with your new password.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/login", {
                replace: true,
              })
            }
            className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Continue to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create a new secure password for your account"
    >
      <div className="space-y-6">
        {!email && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            Your reset session is incomplete.
            Please start the password reset process again.
          </div>
        )}

        <ResetPasswordForm
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
        />

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

export default ResetPassword;
