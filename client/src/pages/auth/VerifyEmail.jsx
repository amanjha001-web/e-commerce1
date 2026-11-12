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

  const email = location.state?.email || "";

  const [success, setSuccess] = useState(false);

  const handleVerify = async (data) => {
    if (!email || !onVerifyEmail) {
      return false;
    }

    try {
      const payload = {
        ...data,
        email,
        purpose: "verify-email",
      };

      const result = await onVerifyEmail(payload);

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
        purpose: "verify-email",
      });
    } catch {
      return false;
    }
  };

  // Success Screen
  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-2xl border border-[#E8DDE0] bg-white p-7 shadow-sm sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl font-bold text-emerald-600">
            ✓
          </div>

          <h2 className="mt-5 text-xl font-bold tracking-tight text-[#4C0519]">
            Verification Complete!
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#786D70]">
            Your email has been verified successfully. You can now continue to
            your ShopSphere account.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/login", {
              replace: true,
            })
          }
          className="w-full rounded-xl bg-[#881337] px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#881337]/15 transition duration-200 hover:bg-[#4C0519] focus:outline-none focus:ring-2 focus:ring-[#881337] focus:ring-offset-2"
        >
          Continue to Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verification Heading */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#881337]/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-[#881337]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l9 6 9-6"
            />
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#4C0519]">
          Verify Your Email
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#786D70]">
          Enter the verification code sent to your registered email address.
        </p>

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
  );
};

export default VerifyEmail;
