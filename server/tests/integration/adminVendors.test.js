import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { Product } from '../../src/models/Product.model.js';
import { Order } from '../../src/models/Order.model.js';
import { VendorEarnings } from '../../src/models/VendorEarnings.model.js';
import { VendorRequest } from '../../src/models/VendorRequest.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';
import { ROLES } from '../../src/constants/roles.constant.js';
import { VENDOR_STATUS } from '../../src/constants/vendorStatus.constant.js';

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

describe('Admin Vendors Management Service & Routes Integration Tests', () => {
  const adminId = '507f1f77bcf86cd799439012';
  const customerId = '507f1f77bcf86cd799439011';
  const vendorUserId = '507f1f77bcf86cd799439013';
  const vendorId = '507f1f77bcf86cd799439014';

  const adminToken = generateAccessToken({ id: adminId, role: ROLES.ADMIN });
  const customerToken = generateAccessToken({ id: customerId, role: ROLES.USER });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAuth = (role = ROLES.ADMIN) => {
    vi.spyOn(User, 'findById').mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({
        _id: role === ROLES.ADMIN ? adminId : customerId,
        fullName: role === ROLES.ADMIN ? 'Admin User' : 'Customer User',
        email: role === ROLES.ADMIN ? 'admin@shopsphere.com' : 'cust@example.com',
        role,
        isActive: true,
      }),
    });
  };

  it('rejects unauthenticated (401) and non-admin (403) requests on /api/v1/admin/vendors', async () => {
    const unauth = await request(app).get('/api/v1/admin/vendors');
    expect(unauth.status).toBe(401);

    mockAuth(ROLES.USER);
    const forbidden = await request(app)
      .get('/api/v1/admin/vendors')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('GET /api/v1/admin/vendors enriches vendors with productCount, orderCount, revenue, ownerName, and summary', async () => {
    mockAuth(ROLES.ADMIN);

    const vendorDoc = {
      _id: vendorId,
      userId: { _id: vendorUserId, name: 'Tech Owner', email: 'owner@techhub.com', phone: '9876543210' },
      storeName: 'TechHub Official',
      slug: 'techhub-official',
      email: 'vendor@shopsphere.com',
      phone: '9876543210',
      description: 'Electronics store',
      address: { street: 'MG Road', city: 'Bengaluru', state: 'KA', postalCode: '560001', country: 'India' },
      businessDetails: { taxNumber: '29ABCDE1234F1Z5', businessLicense: 'Private Ltd' },
      commissionRate: 10,
      status: VENDOR_STATUS.APPROVED,
      isActive: true,
      rating: 4.7,
      numReviews: 12,
    };

    const findSpy = vi.spyOn(Vendor, 'find').mockReturnValue(createQueryMock([vendorDoc]));
    vi.spyOn(Vendor, 'countDocuments')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([{ _id: vendorId, count: 6 }]);
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([
      { _id: vendorId, orderCount: 3, grossSales: 9500 },
    ]);
    vi.spyOn(VendorEarnings, 'find').mockReturnValueOnce(
      createQueryMock([{ vendorId, totalRevenue: 9500, netEarnings: 8550, availableBalance: 4200 }])
    );
    vi.spyOn(VendorRequest, 'find').mockReturnValueOnce(createQueryMock([]));

    const res = await request(app)
      .get('/api/v1/admin/vendors?status=active')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: VENDOR_STATUS.APPROVED })
    );
    expect(res.body.data.summary).toEqual({
      total: 4,
      approved: 1,
      pending: 2,
      suspended: 1,
      rejected: 0,
      inactive: 1,
    });
    expect(res.body.data.vendors).toHaveLength(1);
    expect(res.body.data.vendors[0]).toMatchObject({
      shopName: 'TechHub Official',
      ownerName: 'Tech Owner',
      gstNumber: '29ABCDE1234F1Z5',
      productCount: 6,
      orderCount: 3,
      revenue: 9500,
      netEarnings: 8550,
    });
  });

  it('GET /api/v1/admin/vendors/:vendorId validates ID and returns detailed vendor analytics', async () => {
    mockAuth(ROLES.ADMIN);
    const badId = await request(app)
      .get('/api/v1/admin/vendors/not-an-id')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(badId.status).toBe(400);

    mockAuth(ROLES.ADMIN);
    vi.spyOn(Vendor, 'findById').mockReturnValueOnce(
      createQueryMock({
        _id: vendorId,
        userId: { _id: vendorUserId, name: 'Aman Seller', email: 'aman@vendor.com', phone: '9000011111' },
        storeName: 'Aman Electronics',
        status: VENDOR_STATUS.PENDING,
        isActive: true,
        businessDetails: { taxNumber: 'GST123', bankAccount: { bankName: 'HDFC', accountNumber: '123456' } },
      })
    );
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([{ _id: vendorId, count: 2 }]);
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(VendorEarnings, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(VendorRequest, 'find').mockReturnValueOnce(
      createQueryMock([{ userId: vendorUserId, businessType: 'Retailer', website: 'https://aman.shop' }])
    );
    vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock([{ _id: 'p1', name: 'Headphones', price: 999, stock: 5 }]));
    vi.spyOn(Order, 'find').mockReturnValueOnce(createQueryMock([]));

    const res = await request(app)
      .get(`/api/v1/admin/vendors/${vendorId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.ownerName).toBe('Aman Seller');
    expect(res.body.data.businessType).toBe('Retailer');
    expect(res.body.data.website).toBe('https://aman.shop');
    expect(res.body.data.gstNumber).toBe('GST123');
    expect(res.body.data.productCount).toBe(2);
    expect(res.body.data.recentProducts).toHaveLength(1);
  });

  it('PATCH /api/v1/admin/vendors/:vendorId maps shopName/shopDescription/pincode/gstNumber/commissionRate', async () => {
    mockAuth(ROLES.ADMIN);

    const editableVendor = {
      _id: vendorId,
      userId: vendorUserId,
      storeName: 'Old Shop',
      description: 'Old desc',
      email: 'old@shop.com',
      phone: '111',
      address: {},
      businessDetails: {},
      commissionRate: 10,
      status: VENDOR_STATUS.PENDING,
      isActive: true,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Vendor, 'findById')
      .mockResolvedValueOnce(editableVendor)
      .mockReturnValueOnce(
        createQueryMock({
          ...editableVendor,
          storeName: 'Updated Store',
          slug: 'updated-store',
          description: 'Updated description',
          website: 'https://updated.in',
          businessType: 'LLP',
          commissionRate: 12,
          address: { street: 'Park St', city: 'Mumbai', state: 'MH', postalCode: '400001', country: 'India' },
          businessDetails: { taxNumber: '27AAAAA0000A1Z5' },
        })
      );
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(createQueryMock(null));
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(VendorEarnings, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(VendorRequest, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Order, 'find').mockReturnValueOnce(createQueryMock([]));

    const res = await request(app)
      .patch(`/api/v1/admin/vendors/${vendorId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        shopName: 'Updated Store',
        shopDescription: 'Updated description',
        website: 'https://updated.in',
        businessType: 'LLP',
        gstNumber: '27AAAAA0000A1Z5',
        commissionRate: 12,
        address: { street: 'Park St', city: 'Mumbai', state: 'MH', pincode: '400001', country: 'India' },
      });

    expect(res.status).toBe(200);
    expect(editableVendor.storeName).toBe('Updated Store');
    expect(editableVendor.slug).toBe('updated-store');
    expect(editableVendor.description).toBe('Updated description');
    expect(editableVendor.address.postalCode).toBe('400001');
    expect(editableVendor.businessDetails.taxNumber).toBe('27AAAAA0000A1Z5');
    expect(editableVendor.commissionRate).toBe(12);
    expect(editableVendor.save).toHaveBeenCalledWith({ validateModifiedOnly: true });
  });

  it('PATCH /api/v1/admin/vendors/:vendorId/status syncs status/isActive/commission and approve/reject work cleanly', async () => {
    const adminUser = {
      _id: adminId,
      fullName: 'Admin User',
      email: 'admin@shopsphere.com',
      role: ROLES.ADMIN,
      isActive: true,
    };

    const vendorDoc = {
      _id: vendorId,
      userId: vendorUserId,
      storeName: 'TechHub Official',
      slug: 'techhub-official',
      status: VENDOR_STATUS.APPROVED,
      isActive: true,
      commissionRate: 10,
      rejectionReason: '',
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(User, 'findById')
      .mockReturnValueOnce({ populate: vi.fn().mockResolvedValue(adminUser) })
      .mockResolvedValueOnce(null)
      .mockReturnValueOnce({ populate: vi.fn().mockResolvedValue(adminUser) })
      .mockResolvedValueOnce(null);

    vi.spyOn(Vendor, 'findById')
      .mockResolvedValueOnce(vendorDoc)
      .mockReturnValueOnce(
        createQueryMock({ ...vendorDoc, status: VENDOR_STATUS.SUSPENDED, isActive: false })
      )
      .mockResolvedValueOnce(vendorDoc)
      .mockReturnValueOnce(
        createQueryMock({ ...vendorDoc, status: VENDOR_STATUS.APPROVED, isActive: true, rejectionReason: '' })
      );
    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(VendorEarnings, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(VendorRequest, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Order, 'find').mockReturnValueOnce(createQueryMock([]));

    const suspendRes = await request(app)
      .patch(`/api/v1/admin/vendors/${vendorId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false, rejectionReason: 'Policy check' });

    expect(suspendRes.status).toBe(200);
    expect(vendorDoc.isActive).toBe(false);
    expect(vendorDoc.status).toBe(VENDOR_STATUS.SUSPENDED);
    expect(vendorDoc.rejectionReason).toBe('Policy check');

    // Approve vendor via /approve endpoint
    const userUpdateSpy = vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
    const earningsUpsertSpy = vi.spyOn(VendorEarnings, 'findOneAndUpdate').mockResolvedValue({});
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(VendorEarnings, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(VendorRequest, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Order, 'find').mockReturnValueOnce(createQueryMock([]));

    const approveRes = await request(app)
      .patch(`/api/v1/admin/vendors/${vendorId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);
    expect(vendorDoc.status).toBe(VENDOR_STATUS.APPROVED);
    expect(vendorDoc.isActive).toBe(true);
    expect(userUpdateSpy).toHaveBeenCalledWith(vendorUserId, { role: ROLES.VENDOR, vendorId });
    expect(earningsUpsertSpy).toHaveBeenCalledTimes(1);
  });
});
