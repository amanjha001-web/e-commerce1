export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  VENDOR: 'vendor',
  USER: 'user',
  CUSTOMER: 'user', // Alias for USER
};

export const ROLE_LIST = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.VENDOR,
  ROLES.USER,
  'customer',
];

export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

export const VENDOR_ROLES = [ROLES.VENDOR];

export const CUSTOMER_ROLES = [ROLES.USER];

export default ROLES;
