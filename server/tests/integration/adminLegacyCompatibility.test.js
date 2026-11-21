import { describe, it, expect, vi, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { VendorRequest } from '../../src/models/VendorRequest.model.js';
import { VendorEarnings } from '../../src/models/VendorEarnings.model.js';
import { Product } from '../../src/models/Product.model.js';
import { Category } from '../../src/models/Category.model.js';
import { Order } from '../../src/models/Order.model.js';
import { Payment } from '../../src/models/Payment.model.js';
import { Refund } from '../../src/models/Refund.model.js';
import { ReturnRequest } from '../../src/models/ReturnRequest.model.js';
import { Address } from '../../src/models/Address.model.js';
import { SupportTicket } from '../../src/models/SupportTicket.model.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';
import { ROLES } from '../../src/constants/roles.constant.js';

const createQueryMock = (result) => {
  const query = {
    populate: vi.fn(() => query),
    select: vi.fn(() => query),
    sort: vi.fn(() => query),
    skip: vi.fn(() => query),
    limit: vi.fn(() => query),
    lean: vi.fn(() => query),
    exec: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

describe('Admin Legacy DB Schema Compatibility Tests', () => {
  const adminId = '507f1f77bcf86cd799439012';
  const adminToken = generateAccessToken({ id: adminId, role: ROLES.ADMIN });
  const originalReadyStateDescriptor = Object.getOwnPropertyDescriptor(
    mongoose.connection,
    'readyState'
  );

  const setReadyState = (state) => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      get: () => state,
    });
  };

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalReadyStateDescriptor) {
      Object.defineProperty(mongoose.connection, 'readyState', originalReadyStateDescriptor);
    } else {
      delete mongoose.connection.readyState;
    }
  });

  const mockAdminAuth = () => {
    vi.spyOn(User, 'findById').mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({
        _id: adminId,
        fullName: 'Admin User',
        email: 'admin@shopsphere.com',
        role: ROLES.ADMIN,
        isActive: true,
      }),
    });
  };

  it('Vendor Requests: includes old docs missing isDeleted and resolves legacy user ref & storeName', async () => {
    setReadyState(1);
    mockAdminAuth();

    const legacyUserId = '6a782e3c88c02038e7a6a7f2';
    const legacyReq = {
      _id: '6a782fa188c02038e7a6a901',
      user: legacyUserId, // legacy field instead of userId
      shopName: 'Aman Electronics Stores',
      email: 'aman.vendor@example.com',
      phone: '9123456780',
      status: 'Pending', // legacy capitalized status
      createdAt: new Date('2026-08-09T07:43:29.722Z'),
      // Notice: isDeleted is absent completely (undefined)
    };

    const reqFindSpy = vi
      .spyOn(VendorRequest, 'find')
      .mockReturnValueOnce(createQueryMock([legacyReq]));
    vi.spyOn(VendorRequest, 'countDocuments')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    vi.spyOn(User, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: legacyUserId,
          fullName: 'Aman Jha',
          email: 'aman.vendor@example.com',
          isEmailVerified: true,
          isActive: true,
        },
      ])
    );

    const res = await request(app)
      .get('/api/v1/admin/vendor-requests')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(reqFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({ isDeleted: { $ne: true } })
    );
    expect(res.body.data.requests[0]).toMatchObject({
      applicant: 'Aman Jha',
      business: 'Aman Electronics Stores',
      status: 'pending',
      isUserVerified: true,
      userVerificationStatus: 'verified',
    });
  });

  it('Vendors: resolves legacy user, shopName, shopSlug, bankDetails, and product counts via vendor field', async () => {
    setReadyState(1);
    mockAdminAuth();

    const vendorId = '6a782fa188c02038e7a6a826';
    const userId = '6a782e3c88c02038e7a6a7f2';
    const legacyVendor = {
      _id: vendorId,
      user: userId,
      shopName: 'Anew Electronics Stores',
      shopSlug: 'anew-electronics-stores',
      shopDescription: 'Legacy storefront description',
      email: 'aman.vendor@example.com',
      phone: '9123456780',
      bankDetails: { bankName: 'SBI', accountNumber: '123456789012', ifscCode: 'SBIN0001234' },
      isApproved: true,
      isActive: false,
      status: 'pending',
    };

    vi.spyOn(Vendor, 'find').mockReturnValueOnce(createQueryMock([legacyVendor]));
    vi.spyOn(Vendor, 'countDocuments')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    vi.spyOn(User, 'find').mockReturnValueOnce(
      createQueryMock([
        { _id: userId, name: 'Aman Kumar', email: 'aman.vendor@example.com', isEmailVerified: true, isActive: true },
      ])
    );
    // Old product used `vendor: userId` and was grouped by userId
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([{ _id: userId, count: 3 }]);
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([{ _id: vendorId, orderCount: 2, grossSales: 4500 }]);
    vi.spyOn(VendorEarnings, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(VendorRequest, 'find').mockReturnValueOnce(createQueryMock([]));

    const res = await request(app)
      .get('/api/v1/admin/vendors')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.vendors[0]).toMatchObject({
      storeName: 'Anew Electronics Stores',
      shopName: 'Anew Electronics Stores',
      slug: 'anew-electronics-stores',
      ownerName: 'Aman Kumar',
      productCount: 3,
      orderCount: 2,
      revenue: 4500,
      isUserVerified: true,
      bankAccount: expect.objectContaining({ bankName: 'SBI' }),
    });
  });

  it('Products: converts thumbnail object to string and resolves legacy vendor refs and shopName', async () => {
    setReadyState(1);
    mockAdminAuth();

    const vendorId = '6a782fa188c02038e7a6a826';
    const userId = '6a782e3c88c02038e7a6a7f2';
    const catId = '6ad91ce214bbd1e05e31d50a';

    const legacyProducts = [
      {
        _id: '6ad994585d38ccc815c4da8c',
        name: 'Test infinixs',
        price: 499,
        stock: 25,
        status: 'published',
        isActive: true,
        thumbnail: { url: 'https://cdn.example.com/infinix.jpg', publicId: 'img1' },
        images: [],
        category: { _id: catId, name: 'Electronics admin', slug: 'electronics-admin' },
        vendorId: { _id: vendorId, shopName: 'Anew Electronics Stores', status: 'pending', isActive: false },
      },
      {
        _id: '6ad994585d38ccc815c4da99',
        name: 'dashboard',
        price: 799,
        stock: 5,
        status: 'published',
        isActive: true,
        thumbnail: { url: '', publicId: '' },
        images: [],
        vendorId: null,
        vendor: userId, // legacy User ref instead of Vendor.vendorId
        category: { _id: catId, name: 'Electronics trailed', slug: 'electronics-trailed' },
      },
    ];

    vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock(legacyProducts));
    vi.spyOn(Product, 'countDocuments').mockResolvedValue(2);
    vi.spyOn(Vendor, 'find').mockReturnValueOnce(
      createQueryMock([{ _id: vendorId, user: userId, shopName: 'Anew Electronics Stores', status: 'approved', isActive: true }])
    );
    vi.spyOn(User, 'find').mockReturnValueOnce(createQueryMock([]));

    const res = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.products[0]).toMatchObject({
      vendorName: 'Anew Electronics Stores',
      thumbnail: 'https://cdn.example.com/infinix.jpg',
    });
    expect(res.body.data.products[1]).toMatchObject({
      vendorName: 'Anew Electronics Stores',
      thumbnail: '',
    });
  });

  it('Categories: resolves parentCategory and counts published legacy active products', async () => {
    setReadyState(1);
    mockAdminAuth();

    const parentCatId = '6a6ae1ce562a17cf0cda6cc1';
    const childCatId = '6ad91ce214bbd1e05e31d50a';

    vi.spyOn(Category, 'find')
      .mockReturnValueOnce(
        createQueryMock([
          {
            _id: childCatId,
            name: 'Electronics admin',
            slug: 'electronics-admin',
            parent: null,
            parentCategory: parentCatId,
            image: { url: '', publicId: '' },
            isActive: true,
          },
        ])
      )
      .mockReturnValueOnce(createQueryMock([{ _id: parentCatId, name: 'Electronics', slug: 'electronics' }]));
    vi.spyOn(Category, 'countDocuments').mockResolvedValue(1);
    vi.spyOn(Product, 'countDocuments').mockResolvedValueOnce(14);
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([
      { _id: childCatId, productCount: 6, publishedProductCount: 5 },
    ]);
    vi.spyOn(Category, 'aggregate').mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.categories[0]).toMatchObject({
      name: 'Electronics admin',
      parentName: 'Electronics',
      productCount: 6,
      publishedProductCount: 5,
    });
  });

  it('Users: treats legacy isBlocked=true as blocked and loads legacy user-keyed orders in detail view', async () => {
    setReadyState(1);
    mockAdminAuth();

    const targetId = '507f1f77bcf86cd799439077';
    vi.spyOn(User, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: targetId,
          name: 'Legacy Blocked User',
          email: 'legacy.user@example.com',
          role: 'Customer',
          isBlocked: true,
        },
      ])
    );
    vi.spyOn(User, 'countDocuments').mockResolvedValue(1);

    const listRes = await request(app)
      .get('/api/v1/admin/users?status=blocked&role=customer')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.users[0]).toMatchObject({
      fullName: 'Legacy Blocked User',
      role: 'customer',
      isBlocked: true,
      status: 'blocked',
    });

    vi.spyOn(User, 'findById')
      .mockReturnValueOnce({
        populate: vi.fn().mockResolvedValue({
          _id: adminId,
          fullName: 'Admin User',
          email: 'admin@shopsphere.com',
          role: ROLES.ADMIN,
          isActive: true,
        }),
      })
      .mockReturnValueOnce(
        createQueryMock({ _id: targetId, name: 'Legacy Blocked User', email: 'legacy.user@example.com', role: 'user' })
      );
    vi.spyOn(Address, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Order, 'find').mockReturnValueOnce(
      createQueryMock([{ _id: '65f300000000000000000099', user: targetId, total: 899, status: 'Delivered' }])
    );
    vi.spyOn(Order, 'countDocuments').mockResolvedValueOnce(1);
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([{ totalSpent: 899 }]);
    vi.spyOn(SupportTicket, 'countDocuments').mockResolvedValueOnce(0);
    vi.spyOn(VendorRequest, 'findOne').mockReturnValueOnce(createQueryMock(null));
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(createQueryMock(null));

    const detailRes = await request(app)
      .get(`/api/v1/admin/users/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.recentOrders[0]).toMatchObject({
      totalAmount: 899,
      orderStatus: 'Delivered',
    });
  });

  it('Orders: resolves legacy user, total, and status fields cleanly', async () => {
    setReadyState(1);
    mockAdminAuth();

    const custId = '507f1f77bcf86cd799439088';
    const orderId = '65f300000000000000000088';

    vi.spyOn(Order, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: orderId,
          user: custId,
          total: 2499,
          status: 'Delivered',
          isPaid: true,
          items: [{ name: 'USB Mouse', price: 2499, quantity: 1 }],
          createdAt: new Date('2026-08-18T10:00:00Z'),
        },
      ])
    );
    vi.spyOn(Order, 'countDocuments').mockResolvedValueOnce(1);
    vi.spyOn(User, 'find').mockReturnValueOnce(
      createQueryMock([{ _id: custId, fullName: 'Old Buyer', email: 'buyer@example.com' }])
    );

    const res = await request(app)
      .get('/api/v1/admin/orders?status=delivered')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders[0]).toMatchObject({
      customerName: 'Old Buyer',
      totalAmount: 2499,
      orderStatus: 'delivered',
      orderNumber: `#SS-${orderId.slice(-5).toUpperCase()}`,
    });
  });

  it('Refund & Return Requests: merges legacy Order-based refunds/returns alongside Refund/ReturnRequest collections', async () => {
    setReadyState(1);
    mockAdminAuth();

    const custId = '507f1f77bcf86cd799439051';
    const orderId1 = '65f300000000000000000051';
    const orderId2 = '65f300000000000000000052';
    const refundId = '65f500000000000000000051';

    vi.spyOn(Refund, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: refundId,
          order: orderId1,
          user: custId,
          refundAmount: 799,
          refundReason: 'Wrong cable',
          status: 'Pending',
          createdAt: new Date('2026-10-05T10:00:00Z'),
        },
      ])
    );
    vi.spyOn(Order, 'find')
      // candidateOrders with refund status
      .mockReturnValueOnce(
        createQueryMock([
          {
            _id: orderId2,
            orderNumber: 'ORD-OLD-99',
            user: custId,
            total: 1599,
            status: 'refund_pending',
            paymentStatus: 'refund_pending',
            cancellation: { reason: 'Customer returned defective mouse' },
            createdAt: new Date('2026-08-20T10:00:00Z'),
          },
        ])
      )
      // resolveLegacyRelations lookup for Refund.order = orderId1
      .mockReturnValueOnce(
        createQueryMock([
          {
            _id: orderId1,
            orderNumber: 'ORD-OLD-88',
            totalAmount: 799,
            orderStatus: 'delivered',
            isPaid: true,
          },
        ])
      );
    vi.spyOn(User, 'find')
      .mockReturnValueOnce(createQueryMock([{ _id: custId, fullName: 'Legacy Riya', email: 'riya@old.com' }]))
      .mockReturnValueOnce(createQueryMock([{ _id: custId, fullName: 'Legacy Riya', email: 'riya@old.com' }]));

    const refRes = await request(app)
      .get('/api/v1/admin/refunds')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(refRes.status).toBe(200);
    expect(refRes.body.data.refunds).toHaveLength(2);
    expect(refRes.body.data.refunds[0]).toMatchObject({
      _id: refundId,
      orderNumber: 'ORD-OLD-88',
      amount: 799,
      reason: 'Wrong cable',
      status: 'pending',
      customerName: 'Legacy Riya',
    });
    expect(refRes.body.data.refunds[1]).toMatchObject({
      _id: orderId2,
      isLegacyOrderRecord: true,
      orderNumber: 'ORD-OLD-99',
      amount: 1599,
      status: 'pending',
      customerName: 'Legacy Riya',
    });
    expect(refRes.body.data.summary.total).toBe(2);
    expect(refRes.body.data.summary.pending).toBe(2);

    // Return requests merge test
    mockAdminAuth();
    vi.spyOn(ReturnRequest, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Order, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: orderId2,
          orderNumber: 'ORD-RET-12',
          user: custId,
          total: 1299,
          orderStatus: 'return_requested',
          returnRequest: { reason: 'Broken seal', status: 'requested', requestedAt: new Date('2026-08-22T10:00:00Z') },
        },
      ])
    );
    vi.spyOn(User, 'find').mockReturnValueOnce(
      createQueryMock([{ _id: custId, fullName: 'Legacy Kabir', email: 'kabir@old.com' }])
    );

    const retRes = await request(app)
      .get('/api/v1/admin/refunds/returns')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(retRes.status).toBe(200);
    expect(retRes.body.data.returns).toHaveLength(1);
    expect(retRes.body.data.returns[0]).toMatchObject({
      isLegacyOrderRecord: true,
      orderNumber: 'ORD-RET-12',
      customerName: 'Legacy Kabir',
      amount: 1299,
      reason: 'Broken seal',
      status: 'pending',
    });
  });
});
