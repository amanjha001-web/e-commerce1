
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout";
import RegisterForm from "../../components/auth/RegisterForm";
import SocialLogin from "../../components/auth/SocialLogin";

const Register = ({
  loading = false,
  error = "",
  onRegister,
  onSocialLogin,
}) => {
  const navigate = useNavigate();

  const [socialLoading, setSocialLoading] =
    useState(false);

  const handleRegister = async (data) => {
    const result = await onRegister?.(data);

    if (result !== false) {
      navigate("/login", {
        replace: true,
        state: {
          registered: true,
        },
      });
    }

    return result;
  };

  const handleSocialLogin = async (provider) => {
    try {
      setSocialLoading(true);

      const result =
        await onSocialLogin?.(provider);

      if (result !== false) {
        navigate("/", {
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
      title="Create Account"
      subtitle="Join ShopSphere and start shopping today"
    >
      <div className="space-y-6">
        {/* Register Form */}
        <RegisterForm
          loading={
            loading || socialLoading
          }
          error={error}
          onSubmit={handleRegister}
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

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;
