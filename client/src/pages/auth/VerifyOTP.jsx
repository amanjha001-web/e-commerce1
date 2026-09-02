
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout";
import OTPForm from "../../components/auth/OTPForm";

const VerifyOTP = ({
  loading = false,
  error = "",
  onVerifyOTP,
  onResendOTP,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const purpose = location.state?.purpose || "verify-email";

  const [success, setSuccess] = useState(false);

  const handleVerify = async (data) => {
    const payload = {
      ...data,
      email,
      purpose,
    };

    const result = await onVerifyOTP?.(payload);

    if (result !== false) {
      setSuccess(true);
    }

    return result;
  };

  const handleResend = async () => {
    return onResendOTP?.({
      email,
      purpose,
    });
  };

  if (success) {
    const isPasswordReset = purpose === "reset-password";

    return (
      <AuthLayout
        title={
          isPasswordReset
            ? "OTP Verified"
            : "Verification Successful"
        }
        subtitle={
          isPasswordReset
            ? "Your OTP has been verified successfully"
            : "Your OTP has been verified successfully"
        }
      >
        <div className="space-y-6 text-center">
          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
              ✓
            </div>

            <h2 className="mt-4 text-lg font-semibold text-foreground">
              OTP Verified
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isPasswordReset
                ? "Your OTP has been verified. You can now create a new password."
                : "Your OTP has been verified successfully."}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                isPasswordReset
                  ? "/reset-password"
                  : "/login",
                {
                  replace: true,
                  state: {
                    email,
                    otp: location.state?.otp,
                  },
                }
              )
            }
            className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            {isPasswordReset
              ? "Continue to Reset Password"
              : "Continue to Login"}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={
        email
          ? `Enter the OTP sent to ${email}`
          : "Enter the OTP sent to your email"
      }
    >
      <div className="space-y-6">
        {!email && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            Email information is missing. Please start
            the verification process again.
          </div>
        )}

        <OTPForm
          loading={loading}
          error={error}
          onSubmit={handleVerify}
          onResend={handleResend}
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

export default VerifyOTP;
