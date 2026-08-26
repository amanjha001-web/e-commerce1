import { useMemo } from "react";
import { useSelector } from "react-redux";

import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isVendor,
  isCustomer,
} from "../utils/permissions";

const usePermission = () => {
  const user = useSelector((state) => state.auth.user);

  const role = user?.role || null;

  const checkPermission = useMemo(
    () => (permission) => {
      if (!role) {
        return false;
      }

      return hasPermission(role, permission);
    },
    [role],
  );

  const checkAnyPermission = useMemo(
    () => (permissions) => {
      if (!role) {
        return false;
      }

      return hasAnyPermission(role, permissions);
    },
    [role],
  );

  const checkAllPermissions = useMemo(
    () => (permissions) => {
      if (!role) {
        return false;
      }

      return hasAllPermissions(role, permissions);
    },
    [role],
  );

  return {
    role,

    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,

    isAdmin: isAdmin(role),
    isVendor: isVendor(role),
    isCustomer: isCustomer(role),
  };
};

export default usePermission;
