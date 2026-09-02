import { useMemo, useState } from "react";

const DEFAULT_ROLES = [
  {
    key: "user",
    name: "User",
    description: "Regular customer account",
  },
  {
    key: "vendor",
    name: "Vendor",
    description: "Marketplace seller account",
  },
  {
    key: "admin",
    name: "Admin",
    description: "Platform administrator",
  },
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Full platform administrator",
  },
];

const DEFAULT_PERMISSIONS = [
  {
    key: "dashboard_view",
    name: "Dashboard View",
    description: "View admin dashboard and statistics",
    group: "Dashboard",
  },
  {
    key: "users_view",
    name: "View Users",
    description: "View customer accounts",
    group: "Users",
  },
  {
    key: "users_create",
    name: "Create Users",
    description: "Create new user accounts",
    group: "Users",
  },
  {
    key: "users_update",
    name: "Update Users",
    description: "Edit user information",
    group: "Users",
  },
  {
    key: "users_delete",
    name: "Delete Users",
    description: "Delete user accounts",
    group: "Users",
  },
  {
    key: "vendors_view",
    name: "View Vendors",
    description: "View vendor accounts",
    group: "Vendors",
  },
  {
    key: "vendors_approve",
    name: "Approve Vendors",
    description: "Approve or reject vendor applications",
    group: "Vendors",
  },
  {
    key: "vendors_update",
    name: "Update Vendors",
    description: "Edit vendor information",
    group: "Vendors",
  },
  {
    key: "vendors_delete",
    name: "Delete Vendors",
    description: "Delete vendor accounts",
    group: "Vendors",
  },
  {
    key: "products_view",
    name: "View Products",
    description: "View products in the admin panel",
    group: "Products",
  },
  {
    key: "products_create",
    name: "Create Products",
    description: "Create products",
    group: "Products",
  },
  {
    key: "products_update",
    name: "Update Products",
    description: "Edit product information",
    group: "Products",
  },
  {
    key: "products_delete",
    name: "Delete Products",
    description: "Delete products",
    group: "Products",
  },
  {
    key: "orders_view",
    name: "View Orders",
    description: "View customer orders",
    group: "Orders",
  },
  {
    key: "orders_update",
    name: "Update Orders",
    description: "Update order status and information",
    group: "Orders",
  },
  {
    key: "orders_delete",
    name: "Delete Orders",
    description: "Delete orders",
    group: "Orders",
  },
  {
    key: "payments_view",
    name: "View Payments",
    description: "View payment transactions",
    group: "Payments",
  },
  {
    key: "payments_update",
    name: "Update Payments",
    description: "Update payment status",
    group: "Payments",
  },
  {
    key: "coupons_view",
    name: "View Coupons",
    description: "View coupons",
    group: "Coupons",
  },
  {
    key: "coupons_create",
    name: "Create Coupons",
    description: "Create discount coupons",
    group: "Coupons",
  },
  {
    key: "coupons_update",
    name: "Update Coupons",
    description: "Edit coupons",
    group: "Coupons",
  },
  {
    key: "coupons_delete",
    name: "Delete Coupons",
    description: "Delete coupons",
    group: "Coupons",
  },
  {
    key: "reports_view",
    name: "View Reports",
    description: "View business reports",
    group: "Reports",
  },
  {
    key: "support_view",
    name: "View Support",
    description: "View support tickets",
    group: "Support",
  },
  {
    key: "support_update",
    name: "Update Support",
    description: "Manage support tickets",
    group: "Support",
  },
  {
    key: "settings_view",
    name: "View Settings",
    description: "View platform settings",
    group: "Settings",
  },
  {
    key: "settings_update",
    name: "Update Settings",
    description: "Modify platform settings",
    group: "Settings",
  },
  {
    key: "permissions_manage",
    name: "Manage Permissions",
    description: "Manage roles and permissions",
    group: "Settings",
  },
];

const normalizeRole = (role) => {
  if (typeof role === "string") {
    return {
      key: role,
      name: role
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      description: "",
    };
  }

  return {
    key: role?.key || role?.value || role?.name || role?._id,
    name: role?.name || role?.label || role?.key || "Unnamed Role",
    description: role?.description || "",
  };
};

const normalizePermission = (permission) => {
  if (typeof permission === "string") {
    return {
      key: permission,
      name: permission
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      description: "",
      group: "Other",
    };
  }

  return {
    key:
      permission?.key ||
      permission?.value ||
      permission?.name ||
      permission?._id,
    name:
      permission?.name ||
      permission?.label ||
      permission?.key ||
      "Unnamed Permission",
    description: permission?.description || "",
    group: permission?.group || permission?.category || "Other",
  };
};

const getRoleKey = (role) => {
  if (typeof role === "string") {
    return role;
  }

  return role?.key || role?.value || role?.name || role?._id;
};

const getPermissionKey = (permission) => {
  if (typeof permission === "string") {
    return permission;
  }

  return (
    permission?.key || permission?.value || permission?.name || permission?._id
  );
};

const buildInitialMatrix = (normalizedRoles, normalizedPermissions, roles) => {
  const initialMatrix = {};

  normalizedRoles.forEach((role) => {
    initialMatrix[role.key] = {};

    const matchedRole = roles.find((item) => getRoleKey(item) === role.key);

    const rolePermissions = matchedRole?.permissions || [];

    const permissionKeys = rolePermissions
      .map(getPermissionKey)
      .filter(Boolean);

    normalizedPermissions.forEach((permission) => {
      initialMatrix[role.key][permission.key] = permissionKeys.includes(
        permission.key,
      );
    });
  });

  return initialMatrix;
};

const PermissionSettings = ({
  roles = [],
  permissions = [],
  loading = false,
  saving = false,
  onSave,
}) => {
  const availableRoles = roles.length ? roles : DEFAULT_ROLES;

  const availablePermissions = permissions.length
    ? permissions
    : DEFAULT_PERMISSIONS;

  const normalizedRoles = useMemo(
    () => availableRoles.map(normalizeRole).filter((role) => role.key),
    [availableRoles],
  );

  const normalizedPermissions = useMemo(
    () =>
      availablePermissions
        .map(normalizePermission)
        .filter((permission) => permission.key),
    [availablePermissions],
  );

  const initialMatrix = useMemo(
    () => buildInitialMatrix(normalizedRoles, normalizedPermissions, roles),
    [normalizedRoles, normalizedPermissions, roles],
  );

  const [selectedRole, setSelectedRole] = useState(
    normalizedRoles[0]?.key || "",
  );

  const [matrix, setMatrix] = useState(initialMatrix);

  const groupedPermissions = useMemo(() => {
    return normalizedPermissions.reduce((groups, permission) => {
      const group = permission.group || "Other";

      if (!groups[group]) {
        groups[group] = [];
      }

      groups[group].push(permission);

      return groups;
    }, {});
  }, [normalizedPermissions]);

  const isPermissionEnabled = (permissionKey) =>
    Boolean(matrix?.[selectedRole]?.[permissionKey]);

  const togglePermission = (permissionKey) => {
    setMatrix((previous) => ({
      ...previous,
      [selectedRole]: {
        ...(previous[selectedRole] || {}),
        [permissionKey]: !previous?.[selectedRole]?.[permissionKey],
      },
    }));
  };

  const getGroupPermissionCount = (groupPermissions) =>
    groupPermissions.filter((permission) => isPermissionEnabled(permission.key))
      .length;

  const toggleGroup = (groupPermissions) => {
    const allEnabled = groupPermissions.every((permission) =>
      isPermissionEnabled(permission.key),
    );

    setMatrix((previous) => {
      const rolePermissions = {
        ...(previous[selectedRole] || {}),
      };

      groupPermissions.forEach((permission) => {
        rolePermissions[permission.key] = !allEnabled;
      });

      return {
        ...previous,
        [selectedRole]: rolePermissions,
      };
    });
  };

  const handleSave = () => {
    if (!selectedRole) return;

    const selectedPermissions = Object.entries(matrix[selectedRole] || {})
      .filter(([, enabled]) => enabled)
      .map(([permission]) => permission);

    onSave?.({
      role: selectedRole,
      permissions: selectedPermissions,
      matrix,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-56 animate-pulse rounded bg-muted" />

        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />

        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />

          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Permission Settings
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage role-based permissions for your administration system.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Roles */}
        <aside className="h-fit rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-semibold text-foreground">Roles</h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Select a role to manage.
            </p>
          </div>

          <div className="space-y-1 p-3">
            {normalizedRoles.map((role) => {
              const selected = selectedRole === role.key;

              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setSelectedRole(role.key)}
                  className={[
                    "w-full rounded-xl p-3 text-left transition",
                    selected
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/50",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{role.name}</span>

                    {role.key === "super_admin" && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Full
                      </span>
                    )}
                  </div>

                  {role.description && (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {role.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Permissions */}
        <div className="min-w-0 space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Editing permissions for
              </p>

              <h3 className="mt-1 text-lg font-semibold text-foreground">
                {normalizedRoles.find((role) => role.key === selectedRole)
                  ?.name || "Role"}
              </h3>
            </div>

            <div className="rounded-xl bg-muted/50 px-4 py-2 text-sm">
              <span className="font-semibold text-foreground">
                {
                  Object.values(matrix[selectedRole] || {}).filter(Boolean)
                    .length
                }
              </span>

              <span className="ml-1 text-muted-foreground">
                / {normalizedPermissions.length} permissions
              </span>
            </div>
          </div>

          {Object.entries(groupedPermissions).map(
            ([group, groupPermissions]) => {
              const enabledCount = getGroupPermissionCount(groupPermissions);

              const allEnabled = enabledCount === groupPermissions.length;

              return (
                <div
                  key={group}
                  className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/20 px-5 py-4 sm:px-6">
                    <div>
                      <h3 className="font-semibold text-foreground">{group}</h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {enabledCount} of {groupPermissions.length} enabled
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleGroup(groupPermissions)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                    >
                      {allEnabled ? "Disable All" : "Enable All"}
                    </button>
                  </div>

                  <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                    {groupPermissions.map((permission) => {
                      const enabled = isPermissionEnabled(permission.key);

                      return (
                        <label
                          key={permission.key}
                          className={[
                            "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
                            enabled
                              ? "border-primary/30 bg-primary/5"
                              : "border-border hover:bg-muted/30",
                          ].join(" ")}
                        >
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => togglePermission(permission.key)}
                            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border accent-primary"
                          />

                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground">
                              {permission.name}
                            </span>

                            {permission.description && (
                              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                {permission.description}
                              </span>
                            )}

                            <span className="mt-2 block truncate text-[10px] text-muted-foreground">
                              {permission.key}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            },
          )}

          {/* Warning */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <span className="text-xl">⚠️</span>

              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  Permission Warning
                </h3>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Permission changes can immediately affect what administrators
                  can access. Backend middleware should always remain the final
                  authority for authorization.
                </p>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedRole}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PermissionSettings;
