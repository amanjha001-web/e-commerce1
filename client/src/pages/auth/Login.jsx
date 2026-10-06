import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import LoginForm from "../../components/auth/LoginForm";
import SocialLogin from "../../components/auth/SocialLogin";
import useAuth from "../../hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, loading, error } = useAuth();

  const [socialLoading, setSocialLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (credentials) => {
    const result = await login(credentials);

    if (result.meta.requestStatus === "fulfilled") {
      navigate(from, {
        replace: true,
      });

      return true;
    }

    return false;
  };

  const handleSocialLogin = async () => {
    try {
      setSocialLoading(true);

      return false;
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <LoginForm onSubmit={handleLogin} loading={loading} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Forgot Password */}
      <div className="text-right">
        <Link
          to="/login/forgot-password"
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-sm text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Login */}
      <SocialLogin
        loading={loading || socialLoading}
        onLogin={handleSocialLogin}
      />

      {/* Register */}
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          to="/login/register"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default Login;
