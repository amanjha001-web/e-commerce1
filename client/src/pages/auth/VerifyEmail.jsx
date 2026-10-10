
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";


import OTPForm from "../../components/auth/OTPForm";

const VerifyEmail = ({
  loading = false,
  error = "",
  onVerifyEmail,
  onResendOTP,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email || "";

  const [success, setSuccess] =
    useState(false);

  const handleVerify = async (data) => {
    const payload = {
      ...data,
      email,
      purpose: "verify-email",
    };

    const result =
      await onVerifyEmail?.(payload);

    if (result !== false) {
      setSuccess(true);
    }

    return result;
  };

  const handleResend = async () => {
    return onResendOTP?.({
      email,
      purpose: "verify-email",
    });
  };

  if (success) {
    return (
      <
      >
        <div className="space-y-6 text-center">
          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
              ✓
            </div>

            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Verification Complete
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your email has been verified successfully.
              You can now continue to your account.
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
      </>
    );
  }

  return (
    <
    >
      <div className="space-y-6">
        {!email && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            Email information is missing.
            Please start the verification process again.
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
    </>
  );
};

export default VerifyEmail;