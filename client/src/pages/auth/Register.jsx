import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import RegisterForm from "../../components/auth/RegisterForm";
import SocialLogin from "../../components/auth/SocialLogin";
import useAuth from "../../hooks/useAuth";

const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();

  const [socialLoading, setSocialLoading] = useState(false);

  const handleRegister = async (data) => {
    try {
      await register(data).unwrap();

      navigate("/login/verify-email", {
        replace: true,
        state: {
          email: data?.email,
        },
      });
    } catch {
      // Registration error is displayed through RegisterForm.
      return false;
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      setSocialLoading(true);

      // Connect the existing social-login implementation here.
      console.info("Social login provider:", provider);

      return false;
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <RegisterForm
        loading={loading || socialLoading}
        error={error}
        onSubmit={handleRegister}
      />

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

      <SocialLogin
        loading={loading || socialLoading}
        onLogin={handleSocialLogin}
      />

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
  );
};

export default Register;
