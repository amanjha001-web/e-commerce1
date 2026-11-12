import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

const ResetPassword = ({ loading = false, error = "", onResetPassword }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [success, setSuccess] = useState(false);

  // URL: /login/reset-password?token=xxxxxxxx
  const token = searchParams.get("token");

  const handleSubmit = async (data) => {
    if (!token || !onResetPassword) {
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

  // Success Screen
  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-2xl border border-[#E8DDE0] bg-white p-7 shadow-sm sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl font-bold text-emerald-600">
            ✓
          </div>

          <h2 className="mt-5 text-xl font-bold tracking-tight text-[#4C0519]">
            Password Updated!
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#786D70]">
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
          className="w-full rounded-xl bg-[#881337] px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#881337]/15 transition duration-200 hover:bg-[#4C0519] focus:outline-none focus:ring-2 focus:ring-[#881337] focus:ring-offset-2"
        >
          Continue to Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
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
              d="M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 20a7 7 0 0114 0"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 8v4m-2-2h4"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#4C0519]">
          Reset Your Password
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#786D70]">
          Create a new secure password for your ShopSphere account.
        </p>
      </div>

      {/* Token Missing */}
      {!token ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
        >
          Your password reset link is invalid or incomplete. Please start the
          password reset process again.
          <div className="mt-3">
            <Link
              to="/login/forgot-password"
              className="font-semibold text-[#881337] underline underline-offset-2 hover:text-[#4C0519]"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      ) : (
        <ResetPasswordForm
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
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

export default ResetPassword;
