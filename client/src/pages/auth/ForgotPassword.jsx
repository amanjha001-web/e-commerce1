import { useNavigate } from "react-router-dom";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";

const ForgotPassword = ({ loading = false, error = "", onForgotPassword }) => {
  const navigate = useNavigate();

  const handleSubmit = async (email) => {
    try {
      const result = await onForgotPassword?.(email);

      if (result?.success) {
        const token = result?.data?.token;

        if (token) {
          navigate(`/login/reset-password?token=${encodeURIComponent(token)}`, {
            replace: true,
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Forgot password error:", error);
      return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDFB] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#E8DDE0] bg-white p-6 shadow-xl shadow-[#881337]/5 sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#881337]/10">
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
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#4C0519]">
              Forgot Password?
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#786D70]">
              Enter your registered email address and we'll help you reset your
              password.
            </p>
          </div>

          <ForgotPasswordForm
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
          />

          <div className="mt-6 border-t border-[#E8DDE0] pt-5 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#881337] transition-colors duration-200 hover:text-[#4C0519]"
            >
              <span aria-hidden="true">←</span>
              Back to Login
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#786D70]">
          © {new Date().getFullYear()} ShopSphere. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
