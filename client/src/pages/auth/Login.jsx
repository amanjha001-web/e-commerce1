import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import LoginForm from "../../components/auth/LoginForm";
import SocialLogin from "../../components/auth/SocialLogin";
import useAuth from "../../hooks/useAuth";

const normalizeRole = (role) => {
  const r = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (r === "user") return "customer";
  if (r === "seller") return "vendor";
  return r;
};

const getDashboardPath = (role) => {
  const normalizedRole = normalizeRole(role);

  if (["admin", "super_admin"].includes(normalizedRole)) {
    return "/admin";
  }

  if (["vendor", "seller"].includes(normalizedRole)) {
    return "/vendor";
  }

  if (["customer", "user"].includes(normalizedRole)) {
    return "/";
  }

  return "/";
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { login, loading, error } = useAuth();

  const [socialLoading, setSocialLoading] = useState(false);
  const [roleError, setRoleError] = useState("");

  const requestedRole = normalizeRole(searchParams.get("role") || "customer");

  const loginTitles = {
    customer: "Customer Login",
    vendor: "Seller / Vendor Login",
    seller: "Seller / Vendor Login",
    admin: "Admin Login",
    super_admin: "Admin Login",
  };

  const loginTitle = loginTitles[requestedRole] || "Sign in";

  const handleLogin = async (credentials) => {
    setRoleError("");

    const allowedRoles = ["customer", "vendor", "admin"];

    if (!allowedRoles.includes(requestedRole)) {
      setRoleError("Invalid login role.");
      return false;
    }

    try {
      const result = await login({
        ...credentials,
        role: requestedRole,
      });

      if (result?.meta?.requestStatus !== "fulfilled") {
        return false;
      }

      const responseUser = result.payload?.data?.user || result.payload?.user;
      const actualRole = normalizeRole(responseUser?.role);
      const reqRole = normalizeRole(requestedRole);

      const roleMatches =
        reqRole === actualRole ||
        (reqRole === "customer" && (actualRole === "customer" || actualRole === "user")) ||
        (reqRole === "admin" && (actualRole === "admin" || actualRole === "super_admin")) ||
        (reqRole === "vendor" && (actualRole === "vendor" || actualRole === "seller"));

      if (!roleMatches) {
        setRoleError(
          "Your account does not have permission to log in through this portal.",
        );
        return false;
      }

      const dashboardPath = getDashboardPath(actualRole);

      if (!dashboardPath) {
        setRoleError("Unsupported account role.");
        return false;
      }

      navigate(dashboardPath, { replace: true });
      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  const handleSocialLogin = async (provider) => {
    setRoleError("");
    setSocialLoading(true);

    try {
      console.log(`Continue with ${provider}`);
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-[var(--line)] bg-white p-7 sm:p-9 shadow-xl dark:bg-card dark:border-line">
      {/* Header */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-block text-2xl font-black text-[var(--primary)]">
          Shop<span className="text-[var(--gold)]">Sphere</span>.
        </Link>

        <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--text)] dark:text-foreground">
          {loginTitle}
        </h1>

        <p className="mt-1 text-xs text-[var(--muted)]">
          Sign in to access your ShopSphere account.
        </p>
      </div>

      {/* Login Form */}
      <LoginForm
        onSubmit={handleLogin}
        loading={loading || socialLoading}
        onForgotPassword={() => navigate("/login/forgot-password")}
      />

      {/* Error Message */}
      {(error || roleError) && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-xs font-bold text-[var(--red)]"
        >
          {roleError || error}
        </div>
      )}

      {/* Divider */}
      <div className="relative my-6 flex items-center">
        <div className="w-full border-t border-[var(--line)]" />
        <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-3 text-[11px] font-bold text-[var(--muted)] dark:bg-card">
          Or continue with
        </span>
      </div>

      {/* Social Login */}
      <SocialLogin
        loading={loading || socialLoading}
        onLogin={handleSocialLogin}
      />

      {/* Customer Registration */}
      {requestedRole === "customer" && (
        <div className="mt-6 border-t border-[var(--line)] pt-5 text-center">
          <p className="text-xs text-[var(--muted)]">
            Don't have an account?{" "}
            <Link
              to="/login/register"
              className="font-bold text-[var(--primary)] hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      )}

      {/* Portal Switcher Notice */}
      <div className="mt-6 rounded-xl border border-[#f0dfb9] bg-[#fff8e9] p-3 text-[11px] font-medium text-[#76571d]">
        Role: <b className="uppercase">{requestedRole}</b>. Switch portal:{" "}
        <Link to="/login" className="underline font-bold">Customer</Link> ·{" "}
        <Link to="/login?role=vendor" className="underline font-bold">Seller</Link> ·{" "}
        <Link to="/login?role=admin" className="underline font-bold">Admin</Link>
      </div>
    </div>
  );
};

export default Login;
