import { Navigate, Outlet, useLocation } from "react-router-dom";

import Loader from "../components/common/Loader";
import useAuth from "../hooks/useAuth";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const location = useLocation();

  const { user, loading, isAuthenticated } = useAuth();

  console.log("PROTECTED ROUTE", {
    loading,
    isAuthenticated,
    user,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRole = normalizeRole(user.role);

  const permittedRoles = allowedRoles.map(normalizeRole);

  if (permittedRoles.length > 0 && !permittedRoles.includes(userRole)) {
    let redirectPath = "/";

    if (["admin", "super_admin"].includes(userRole)) {
      redirectPath = "/admin";
    } else if (["vendor", "seller"].includes(userRole)) {
      redirectPath = "/vendor";
    }

    return <Navigate to={redirectPath} replace />;
  }

  if (children) {
    return children;
  }

  return <Outlet />;
};

export default ProtectedRoute;
