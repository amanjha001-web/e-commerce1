import mongoose from 'mongoose';
import { Role } from '../../models/Role.model.js';
import { Permission } from '../../models/Permission.model.js';
import { User } from '../../models/User.model.js';
import { Category } from '../../models/Category.model.js';
import { Brand } from '../../models/Brand.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { Product } from '../../models/Product.model.js';
import { Banner } from '../../models/Banner.model.js';
import { Tax } from '../../models/Tax.model.js';
import { ShippingZone } from '../../models/ShippingZone.model.js';
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../../constants/permissions.constant.js';
import { ROLES } from '../../constants/roles.constant.js';
import { hashPassword } from '../../utils/crypto.utils.js';
import { env } from '../../config/env.js';
import logger from '../../config/logger.js';

export const seedDatabase = async () => {
  logger.info('Starting database seeding...');

  // 1. Seed Permissions
  const permissionDocs = [];
  for (const [key, code] of Object.entries(PERMISSIONS)) {
    const [module] = code.split(':');
    let perm = await Permission.findOne({ code });
    if (!perm) {
      perm = await Permission.create({
        name: key.replace(/_/g, ' '),
        code,
        module: module || 'system',
        description: `Permission to ${key.toLowerCase().replace(/_/g, ' ')}`,
      });
    }
    permissionDocs.push(perm);
  }
  logger.info(`Permissions synchronized (${permissionDocs.length})`);

  // 2. Seed System Roles
  const permMap = {};
  permissionDocs.forEach((p) => {
    permMap[p.code] = p._id;
  });

  for (const roleCode of Object.values(ROLES)) {
    const allowedPermCodes = DEFAULT_ROLE_PERMISSIONS[roleCode] || [];
    const rolePermIds = allowedPermCodes.map((c) => permMap[c]).filter(Boolean);

    let role = await Role.findOne({ code: roleCode });
    if (!role) {
      role = await Role.create({
        name: roleCode.toUpperCase(),
        code: roleCode,
        description: `System role for ${roleCode}`,
        permissions: rolePermIds,
        isSystem: true,
      });
    } else {
      role.permissions = rolePermIds;
      await role.save();
    }
  }
  logger.info('System roles synchronized');

  // 3. Seed Initial Super Admin
  const adminEmail = env.INITIAL_ADMIN_EMAIL.toLowerCase();
  let superAdmin = await User.findOne({ email: adminEmail });
  if (!superAdmin) {
    const hashedPassword = await hashPassword(env.INITIAL_ADMIN_PASSWORD);
    superAdmin = await User.create({
      name: env.INITIAL_ADMIN_NAME,
      email: adminEmail,
      username: 'superadmin',
      password: hashedPassword,
      role: ROLES.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    });
    logger.info(`Super Admin initialized: ${adminEmail}`);
  } else {
    logger.info(`Super Admin account already exists: ${adminEmail}`);
  }

  // 4. Seed Categories
  const defaultCategories = [
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets, devices and tech accessories' },
    { name: 'Fashion & Apparel', slug: 'fashion-apparel', description: 'Clothing, footwear and accessories' },
    { name: 'Home & Living', slug: 'home-living', description: 'Furniture, decor and kitchen essentials' },
    { name: 'Beauty & Wellness', slug: 'beauty-wellness', description: 'Skincare, cosmetics and wellness' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Fitness gear, sportswear and equipment' },
  ];

  const categoryMap = {};
  for (const cat of defaultCategories) {
    let doc = await Category.findOne({ slug: cat.slug });
    if (!doc) {
      doc = await Category.create(cat);
    }
    categoryMap[cat.slug] = doc._id;
  }
  logger.info('Categories seeded');

  // 5. Seed Brands
  const defaultBrands = [
    { name: 'Apple', slug: 'apple', website: 'https://apple.com' },
    { name: 'Samsung', slug: 'samsung', website: 'https://samsung.com' },
    { name: 'Sony', slug: 'sony', website: 'https://sony.com' },
    { name: 'Nike', slug: 'nike', website: 'https://nike.com' },
    { name: 'Adidas', slug: 'adidas', website: 'https://adidas.com' },
  ];

  const brandMap = {};
  for (const brand of defaultBrands) {
    let doc = await Brand.findOne({ slug: brand.slug });
    if (!doc) {
      doc = await Brand.create(brand);
    }
    brandMap[brand.slug] = doc._id;
  }
  logger.info('Brands seeded');

  // 6. Seed Sample Vendor & Products
  const vendorEmail = 'vendor@shopsphere.com';
  let vendorUser = await User.findOne({ email: vendorEmail });
  if (!vendorUser) {
    const hashedPassword = await hashPassword('Vendor@ShopSphere2026!');
    vendorUser = await User.create({
      name: 'TechHub Store',
      email: vendorEmail,
      username: 'techhub',
      password: hashedPassword,
      role: ROLES.VENDOR,
      isEmailVerified: true,
      isActive: true,
    });
  }

  let vendor = await Vendor.findOne({ userId: vendorUser._id });
  if (!vendor) {
    vendor = await Vendor.create({
      userId: vendorUser._id,
      storeName: 'TechHub Official',
      slug: 'techhub-official',
      email: vendorEmail,
      phone: '+91 9876543210',
      description: 'Authorized retailer of premium electronics and accessories.',
      status: 'approved',
      isActive: true,
      rating: 4.8,
      numReviews: 24,
    });
    vendorUser.vendorId = vendor._id;
    await vendorUser.save();
  }

  // Sample Product
  const sampleProductSlug = 'apple-airpods-pro-2nd-gen';
  let product = await Product.findOne({ slug: sampleProductSlug });
  if (!product) {
    product = await Product.create({
      name: 'Apple AirPods Pro (2nd Generation)',
      slug: sampleProductSlug,
      description: 'Active Noise Cancellation, Adaptive Audio, and Transparency mode for immersive sound.',
      shortDescription: 'Wireless earbuds with active noise cancellation',
      vendorId: vendor._id,
      category: categoryMap['electronics'],
      brand: brandMap['apple'],
      price: 24900,
      compareAtPrice: 26900,
      discountPercentage: 7,
      stock: 50,
      sku: 'APP-AIRPODS-PRO2',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80',
          isDefault: true,
        },
      ],
      status: 'published',
      isActive: true,
      isFeatured: true,
      isTrending: true,
      isBestSeller: true,
      rating: 4.9,
      numReviews: 48,
    });
    logger.info('Sample product seeded');
  }

  // 7. Seed Sample Hero Banner
  const bannerSlug = 'mega-tech-sale-2026';
  let banner = await Banner.findOne({ slug: bannerSlug });
  if (!banner) {
    await Banner.create({
      title: 'Mega Tech Sale 2026',
      subtitle: 'Up to 50% Off on Leading Electronics',
      slug: bannerSlug,
      link: '/category/electronics',
      position: 'home_hero',
      image: {
        url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80',
      },
      isActive: true,
      sortOrder: 1,
    });
    logger.info('Sample banner seeded');
  }

  // 8. Seed Default Tax & Shipping Zone
  const tax = await Tax.findOne({ name: 'Standard GST' });
  if (!tax) {
    await Tax.create({
      name: 'Standard GST',
      rate: 18,
      country: 'India',
      state: 'ALL',
      isActive: true,
    });
  }

  const shippingZone = await ShippingZone.findOne({ name: 'Pan India Standard' });
  if (!shippingZone) {
    await ShippingZone.create({
      name: 'Pan India Standard',
      countries: ['India'],
      rate: 50,
      freeShippingThreshold: 1000,
      isActive: true,
    });
  }

  logger.info('Database seeding completed successfully!');
};

export default seedDatabase;
