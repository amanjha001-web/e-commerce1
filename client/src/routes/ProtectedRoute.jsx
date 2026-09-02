
import { Navigate, Outlet, useLocation } from "react-router-dom";

import Loader from "../components/common/Loader";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = ({
  allowedRoles = [],
  children,
}) => {
  const location = useLocation();
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user?.role)
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (children) {
    return children;
  }

  return <Outlet />;
};

export default ProtectedRoute;
