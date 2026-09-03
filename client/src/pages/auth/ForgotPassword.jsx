
import { useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";

const ForgotPassword = ({
  loading = false,
  error = "",
  onForgotPassword,
}) => {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    const result = await onForgotPassword?.(data);

    if (result !== false) {
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
        <ForgotPasswordForm
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
        />

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
