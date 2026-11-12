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
    if (!email || !onVerifyOTP) {
      return false;
    }

    try {
      const payload = {
        ...data,
        email,
        purpose,
      };

      const result = await onVerifyOTP(payload);

      if (result !== false) {
        setSuccess(true);
      }

      return result;
    } catch {
      return false;
    }
  };

  const handleResend = async () => {
    if (!email || !onResendOTP) {
      return false;
    }

    try {
      return await onResendOTP({
        email,
        purpose,
      });
    } catch {
      return false;
    }
  };

  const isPasswordReset = purpose === "reset-password";

  // Success Screen
  if (success) {
    return (
      <AuthLayout
        title={isPasswordReset ? "OTP Verified" : "Verification Successful"}
        subtitle="Your OTP has been verified successfully."
      >
        <div className="space-y-6 text-center">
          <div className="rounded-2xl border border-[#E8DDE0] bg-white p-7 shadow-sm sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl font-bold text-emerald-600">
              ✓
            </div>

            <h2 className="mt-5 text-xl font-bold tracking-tight text-[#4C0519]">
              OTP Verified!
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#786D70]">
              {isPasswordReset
                ? "Your OTP has been verified. You can now create a new password."
                : "Your OTP has been verified successfully. You can now continue to your account."}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(isPasswordReset ? "/reset-password" : "/login", {
                replace: true,
                state: {
                  email,
                  otp: location.state?.otp,
                },
              })
            }
            className="w-full rounded-xl bg-[#881337] px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#881337]/15 transition duration-200 hover:bg-[#4C0519] focus:outline-none focus:ring-2 focus:ring-[#881337] focus:ring-offset-2"
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
        {/* Verification Icon */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#881337]/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-[#881337]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l9 6 9-6"
              />
            </svg>
          </div>

          {email && (
            <p className="mt-3 break-all text-sm font-semibold text-[#881337]">
              {email}
            </p>
          )}
        </div>

        {/* Missing Email */}
        {!email ? (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
          >
            Email information is missing. Please start the verification process
            again.
            <div className="mt-3">
              <Link
                to="/login/register"
                className="font-semibold text-[#881337] underline underline-offset-2 hover:text-[#4C0519]"
              >
                Go to Registration
              </Link>
            </div>
          </div>
        ) : (
          <OTPForm
            loading={loading}
            error={error}
            onSubmit={handleVerify}
            onResend={handleResend}
          />
        )}

        {/* Back to Login */}
        <div className="border-t border-[#E8DDE0] pt-5 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#881337] transition-colors duration-200 hover:text-[#4C0519]"
          >
            <span aria-hidden="true">←</span>
            Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyOTP;
