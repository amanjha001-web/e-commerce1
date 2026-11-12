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

      return true;
    } catch {
      return false;
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      setSocialLoading(true);
      console.info("Social login provider:", provider);
      return false;
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-[var(--line)] bg-white p-7 sm:p-9 shadow-xl dark:bg-card dark:border-line">
      {/* Registration Heading */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-block text-2xl font-black text-[var(--primary)]">
          Shop<span className="text-[var(--gold)]">Sphere</span>.
        </Link>

        <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--text)] dark:text-foreground">
          Create your account
        </h1>

        <p className="mt-1 text-xs text-[var(--muted)]">
          Join ShopSphere and discover curated everyday essentials.
        </p>
      </div>

      {/* Registration Form */}
      <RegisterForm
        loading={loading || socialLoading}
        error={error}
        onSubmit={handleRegister}
      />

      {/* Divider */}
      <div className="relative my-6 flex items-center">
        <div className="w-full border-t border-[var(--line)]" />
        <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-3 text-[11px] font-bold text-[var(--muted)] dark:bg-card">
          Or continue with
        </span>
      </div>

      {/* Social Registration */}
      <SocialLogin
        loading={loading || socialLoading}
        onLogin={handleSocialLogin}
      />

      {/* Return to Login */}
      <div className="mt-6 border-t border-[var(--line)] pt-5 text-center">
        <p className="text-xs text-[var(--muted)]">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-bold text-[var(--primary)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
