import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

const ResetPassword = ({ loading = false, error = "", onResetPassword }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [success, setSuccess] = useState(false);

  // URL:
  // /login/reset-password?token=xxxxxxxx
  const token = searchParams.get("token");

  const handleSubmit = async (data) => {
    if (!token) {
      return false;
    }

    try {
      const result = await onResetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (result?.success === true) {
        setSuccess(true);
        return result;
      }

      return false;
    } catch {
      return false;
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-2xl border border-border bg-muted/30 p-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
            ✓
          </div>

          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Password Updated
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your password has been reset successfully. You can now sign in with
            your new password.
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Missing */}
      {!token && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          Your password reset link is invalid or incomplete. Please start the
          password reset process again.
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
  );
};

export default ResetPassword;
