import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import LoginForm from "../../components/auth/LoginForm";
import SocialLogin from "../../components/auth/SocialLogin";
import useAuth from "../../hooks/useAuth";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getDashboardPath = (role) => {
  const normalizedRole = normalizeRole(role);

  if (["admin", "super_admin"].includes(normalizedRole)) {
    return "/admin";
  }

  if (["vendor", "seller"].includes(normalizedRole)) {
    return "/vendor";
  }

  if (normalizedRole === "customer") {
    return "/";
  }

  return null;
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

  const loginTitle = loginTitles[requestedRole] || "Login";

  const handleLogin = async (credentials) => {
    setRoleError("");

    const allowedRoles = ["customer", "vendor", "admin"];

    if (!allowedRoles.includes(requestedRole)) {
      setRoleError("Invalid login role.");
      return false;
    }

    // Send the selected login role to the backend.
    const result = await login({
      ...credentials,
      role: requestedRole,
    });

    if (result?.meta?.requestStatus !== "fulfilled") {
      return false;
    }

    const responseUser = result.payload?.data?.user;

   const actualRole = normalizeRole(responseUser?.role);

    

    // Verify the actual authenticated user's role.
    const roleMatches =
      requestedRole === actualRole ||
      (requestedRole === "admin" && actualRole === "super_admin") ||
      (requestedRole === "vendor" && actualRole === "seller");

    if (!roleMatches) {
      setRoleError(
        "Your account does not have permission to log in through this page.",
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
      <h1 className="text-center text-xl font-semibold text-foreground">
        {loginTitle}
      </h1>

      <LoginForm onSubmit={handleLogin} loading={loading || socialLoading} />

      {(error || roleError) && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {roleError || error}
        </div>
      )}

      <div className="text-right">
        <Link
          to="/login/forgot-password"
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Forgot Password?
        </Link>
      </div>

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

      {requestedRole === "customer" && (
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/login/register"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Create an account
          </Link>
        </p>
      )}
    </div>
  );
};

export default Login;
