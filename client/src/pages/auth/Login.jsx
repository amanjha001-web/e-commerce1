
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout";
import LoginForm from "../../components/auth/LoginForm";
import SocialLogin from "../../components/auth/SocialLogin";

const Login = ({
  loading = false,
  error = "",
  onLogin,
  onSocialLogin,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [socialLoading, setSocialLoading] =
    useState(false);

  const from =
    location.state?.from?.pathname || "/";

  const handleLogin = async (data) => {
    const result = await onLogin?.(data);

    if (result !== false) {
      navigate(from, { replace: true });
    }

    return result;
  };

  const handleSocialLogin = async (provider) => {
    try {
      setSocialLoading(true);

      const result =
        await onSocialLogin?.(provider);

      if (result !== false) {
        navigate(from, {
          replace: true,
        });
      }

      return result;
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your ShopSphere account"
    >
      <div className="space-y-6">
        {/* Login Form */}
        <LoginForm
          loading={loading}
          error={error}
          onSubmit={handleLogin}
        />

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
          loading={
            loading || socialLoading
          }
          onLogin={handleSocialLogin}
        />

        {/* Register */}
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
