export const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Customer',
  email: 'customer@test.com',
  role: 'user',
  isActive: true,
  isEmailVerified: true,
};

export const mockAdmin = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Test Admin',
  email: 'admin@test.com',
  role: 'admin',
  isActive: true,
  isEmailVerified: true,
};

export const mockSuperAdmin = {
  _id: '507f1f77bcf86cd799439013',
  name: 'Test Super Admin',
  email: 'superadmin@test.com',
  role: 'super_admin',
  isActive: true,
  isEmailVerified: true,
};

export const mockVendor = {
  _id: '507f1f77bcf86cd799439014',
  name: 'Test Vendor User',
  email: 'vendor@test.com',
  role: 'vendor',
  vendorId: '507f1f77bcf86cd799439015',
  isActive: true,
  isEmailVerified: true,
};

export const mockProduct = {
  _id: '507f1f77bcf86cd799439020',
  name: 'Test Wireless Headphones',
  slug: 'test-wireless-headphones',
  description: 'High quality wireless sound with active noise reduction.',
  price: 4999,
  stock: 25,
  status: 'published',
  isActive: true,
  vendorId: '507f1f77bcf86cd799439015',
};
