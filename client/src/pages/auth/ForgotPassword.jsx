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
          navigate(`/login/reset-password?token=${token}`, {
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
    <
      
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
    </>
  );
};

export default ForgotPassword;
