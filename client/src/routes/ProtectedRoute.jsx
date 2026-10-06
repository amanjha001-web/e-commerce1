import { Navigate, Outlet, useLocation } from "react-router-dom";

import Loader from "../components/common/Loader";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const location = useLocation();

  const { user, loading, isAuthenticated } = useAuth();

  // Auth request chal raha hai
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  // Login nahi hai
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // Role check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Child component
  if (children) {
    return children;
  }

  return <Outlet />;
};

export default ProtectedRoute;
