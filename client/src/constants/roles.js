export const ROLES = {
  USER: "user",
  VENDOR: "vendor",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
};

export const ROLE_LABELS = {
  [ROLES.USER]: "Customer",
  [ROLES.VENDOR]: "Vendor",
  [ROLES.ADMIN]: "Admin",
  [ROLES.SUPER_ADMIN]: "Super Admin",
};

export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

export const VENDOR_ROLES = [ROLES.VENDOR];

export const CUSTOMER_ROLES = [ROLES.USER];

export const ALL_ROLES = Object.values(ROLES);

export const isAdminRole = (role) => {
  return ADMIN_ROLES.includes(role);
};

export const isVendorRole = (role) => {
  return VENDOR_ROLES.includes(role);
};

export const isCustomerRole = (role) => {
  return CUSTOMER_ROLES.includes(role);
};

export const isValidRole = (role) => {
  return ALL_ROLES.includes(role);
};

export default ROLES;
