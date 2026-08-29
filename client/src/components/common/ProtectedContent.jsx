
import { useAuth } from "../../hooks/useAuth";
import { usePermission } from "../../hooks/usePermission";

const ProtectedContent = ({
  children,
  roles = [],
  permissions = [],
  requireAllPermissions = false,
  fallback = null,
}) => {
  const { user, isAuthenticated } = useAuth();

  const { hasAnyPermission, hasAllPermissions } = usePermission();

  // Check authentication
  if (!isAuthenticated || !user) {
    return fallback;
  }

  // Check roles
  if (roles.length > 0) {
    const hasRole = roles.includes(user.role);

    if (!hasRole) {
      return fallback;
    }
  }

  // Check permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      return fallback;
    }
  }

  // User is authorized
  return children;
};

export default ProtectedContent;
