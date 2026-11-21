import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
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

describe('Vendor Shop Profile & Store Settings Integration Tests', () => {
  const vendorUserId = '507f1f77bcf86cd799439201';
  const vendorStoreId = '507f1f77bcf86cd799439202';
  const customerId = '507f1f77bcf86cd799439011';

  const vendorToken = generateAccessToken({ id: vendorUserId, role: ROLES.VENDOR });
  const customerToken = generateAccessToken({ id: customerId, role: ROLES.USER });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAuthUser = (role = ROLES.VENDOR) => {
    const isVendor = role === ROLES.VENDOR;
    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: isVendor ? vendorUserId : customerId,
        fullName: isVendor ? 'Test Vendor' : 'Customer User',
        role,
        isActive: true,
      }),
    });
  };

  it('enforces authentication (401) and vendor role (403) on store and profile routes', async () => {
    const unauthStore = await request(app).get('/api/v1/vendor/store');
    expect(unauthStore.status).toBe(401);

    const unauthProfile = await request(app).get('/api/v1/vendor/profile');
    expect(unauthProfile.status).toBe(401);

    mockAuthUser(ROLES.USER);
    const forbiddenStore = await request(app)
      .patch('/api/v1/vendor/store')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ storeName: 'Forbidden Update' });
    expect(forbiddenStore.status).toBe(403);

    mockAuthUser(ROLES.USER);
    const forbiddenProfile = await request(app)
      .get('/api/v1/vendor/profile')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbiddenProfile.status).toBe(403);
  });

  it('GET /api/v1/vendor/store and /api/v1/vendor/profile support legacy user filter and populated userId', async () => {
    const storeDoc = {
      _id: vendorStoreId,
      userId: {
        _id: vendorUserId,
        fullName: 'Mainboard Owner',
        email: 'owner@example.com',
        phone: '9876543210',
      },
      storeName: 'Mainboard Electronics',
      slug: 'mainboard-electronics',
      email: 'dashboard@gmail.com',
      phone: '8888877777',
      address: {
        street: 'At+Po Dagmara',
        city: 'Supaul',
        state: 'Bihar',
        postalCode: '852218',
        country: 'India',
      },
      businessDetails: {
        taxNumber: '10ABCDE1234F1Z5',
        businessLicense: 'UDYAM-BR-01-0001234',
        bankAccount: {
          accountHolderName: 'Mainboard Owner',
          bankName: 'State Bank of India',
          accountNumber: '123456789012',
          ifscCode: 'SBIN0001234',
        },
      },
      status: 'approved',
      commissionRate: 10,
    };

    mockAuthUser(ROLES.VENDOR);
    const findOneStoreSpy = vi
      .spyOn(Vendor, 'findOne')
      .mockReturnValueOnce(createQueryMock(storeDoc));

    const storeRes = await request(app)
      .get('/api/v1/vendor/store')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(storeRes.status).toBe(200);
    expect(storeRes.body.success).toBe(true);
    expect(storeRes.body.data.storeName).toBe('Mainboard Electronics');
    expect(findOneStoreSpy).toHaveBeenCalledWith({
      $or: [{ userId: vendorUserId }, { user: vendorUserId }],
    });

    mockAuthUser(ROLES.VENDOR);
    const findOneProfileSpy = vi
      .spyOn(Vendor, 'findOne')
      .mockReturnValueOnce(createQueryMock(storeDoc));

    const profileRes = await request(app)
      .get('/api/v1/vendor/profile')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.success).toBe(true);
    expect(profileRes.body.data.businessDetails.taxNumber).toBe('10ABCDE1234F1Z5');
    expect(findOneProfileSpy).toHaveBeenCalledWith({
      $or: [{ userId: vendorUserId }, { user: vendorUserId }],
    });
  });

  it('PATCH /api/v1/vendor/store normalizes nested/flat fields, preserves existing nested subfields, and strips privileged fields', async () => {
    const existingVendor = {
      _id: vendorStoreId,
      userId: vendorUserId,
      storeName: 'Mainboard',
      slug: 'mainboard',
      email: 'old@example.com',
      phone: '8888877777',
      description: 'Original shop',
      status: 'pending',
      commissionRate: 12,
      rating: 4.5,
      isActive: true,
      address: {
        street: 'At+Po Dagmara',
        city: 'Supaul',
        state: 'Bihar',
        postalCode: '852218',
        country: 'India',
      },
      businessDetails: {
        taxNumber: '10OLDGST1234F1Z5',
        businessLicense: 'LIC-OLD-99',
        bankAccount: {
          accountHolderName: 'Existing Holder',
          bankName: 'HDFC Bank',
          accountNumber: '999988887777',
          ifscCode: 'HDFC0000123',
        },
      },
    };

    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(createQueryMock(existingVendor));

    const updatedDoc = {
      ...existingVendor,
      storeName: 'Mainboard Pro',
      email: 'shop@mainboard.in',
      businessDetails: {
        ...existingVendor.businessDetails,
        taxNumber: '10NEWGST1234F1Z2',
        bankAccount: {
          ...existingVendor.businessDetails.bankAccount,
          ifscCode: 'SBIN0004321',
        },
      },
    };

    const updateSpy = vi
      .spyOn(Vendor, 'findByIdAndUpdate')
      .mockReturnValueOnce(createQueryMock(updatedDoc));

    const res = await request(app)
      .patch('/api/v1/vendor/store')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        storeName: '  Mainboard Pro  ',
        email: 'SHOP@MAINBOARD.IN',
        address: {
          city: 'Patna',
        },
        gstin: '10NEWGST1234F1Z2',
        bankDetails: {
          ifscCode: 'sbin0004321',
        },
        // Attempted mass-assignment of privileged fields must be stripped
        status: 'approved',
        commissionRate: 0,
        rating: 5,
        isActive: false,
        slug: 'hijacked-slug',
        rejectionReason: 'cleared',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    const [calledId, updatePayload] = updateSpy.mock.calls[0];
    expect(calledId).toBe(vendorStoreId);
    const safeSet = updatePayload.$set;

    expect(safeSet.storeName).toBe('Mainboard Pro');
    expect(safeSet.email).toBe('shop@mainboard.in');
    // Existing address subfields preserved when only city updates
    expect(safeSet.address).toEqual({
      street: 'At+Po Dagmara',
      city: 'Patna',
      state: 'Bihar',
      postalCode: '852218',
      country: 'India',
    });
    // Existing businessDetails subfields preserved when gstin and partial bankDetails update
    expect(safeSet.businessDetails.taxNumber).toBe('10NEWGST1234F1Z2');
    expect(safeSet.businessDetails.businessLicense).toBe('LIC-OLD-99');
    expect(safeSet.businessDetails.bankAccount).toEqual({
      accountHolderName: 'Existing Holder',
      bankName: 'HDFC Bank',
      accountNumber: '999988887777',
      ifscCode: 'SBIN0004321',
    });
    // Privileged fields stripped
    expect(safeSet.status).toBeUndefined();
    expect(safeSet.commissionRate).toBeUndefined();
    expect(safeSet.rating).toBeUndefined();
    expect(safeSet.isActive).toBeUndefined();
    expect(safeSet.slug).toBeUndefined();
    expect(safeSet.rejectionReason).toBeUndefined();
  });

  it('PATCH /api/v1/vendor/store supports flat StoreSettings aliases (name, pincode, string address) and validates storeName & email', async () => {
    const existingVendor = {
      _id: vendorStoreId,
      userId: vendorUserId,
      storeName: 'Mainboard',
      address: { street: '', city: '', state: '', postalCode: '', country: 'India' },
      businessDetails: { bankAccount: {} },
    };

    // Invalid short storeName -> 400
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(createQueryMock(existingVendor));
    const shortNameRes = await request(app)
      .patch('/api/v1/vendor/store')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ storeName: 'A' });
    expect(shortNameRes.status).toBe(400);
    expect(shortNameRes.body.message).toContain('Shop name must be at least 2 characters');

    // Invalid email -> 400
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(createQueryMock(existingVendor));
    const badEmailRes = await request(app)
      .patch('/api/v1/vendor/store')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ email: 'not-an-email' });
    expect(badEmailRes.status).toBe(400);
    expect(badEmailRes.body.message).toContain('Please enter a valid business email address');

    // Flat StoreSettings aliases
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(createQueryMock(existingVendor));
    const updateSpy = vi
      .spyOn(Vendor, 'findByIdAndUpdate')
      .mockReturnValueOnce(createQueryMock({ ...existingVendor, storeName: 'Alias Shop' }));

    const aliasRes = await request(app)
      .patch('/api/v1/vendor/store')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        name: 'Alias Shop',
        address: 'Ward 5, Main Market',
        city: 'Supaul',
        state: 'Bihar',
        pincode: '852218',
        taxNumber: '10ALIAS1234F1Z5',
      });

    expect(aliasRes.status).toBe(200);
    const safeSet = updateSpy.mock.calls[0][1].$set;
    expect(safeSet.storeName).toBe('Alias Shop');
    expect(safeSet.address).toEqual({
      street: 'Ward 5, Main Market',
      city: 'Supaul',
      state: 'Bihar',
      postalCode: '852218',
      country: 'India',
    });
    expect(safeSet.businessDetails.taxNumber).toBe('10ALIAS1234F1Z5');
  });

  it('PATCH /api/v1/vendor/profile applies identical safe sanitization and blocks mass assignment', async () => {
    const existingVendor = {
      _id: vendorStoreId,
      userId: vendorUserId,
      storeName: 'Legacy Shop',
      email: 'legacy@example.com',
      address: { street: 'Old St', city: 'Old City', state: 'Bihar', postalCode: '800001', country: 'India' },
      businessDetails: { taxNumber: '', businessLicense: '', bankAccount: {} },
    };

    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(createQueryMock(existingVendor));
    const updateSpy = vi
      .spyOn(Vendor, 'findByIdAndUpdate')
      .mockReturnValueOnce(createQueryMock({ ...existingVendor, storeName: 'Safe Profile Shop' }));

    const res = await request(app)
      .patch('/api/v1/vendor/profile')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        storeName: 'Safe Profile Shop',
        website: 'https://shop.example.com',
        businessType: 'retail',
        commissionRate: 0,
        status: 'approved',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const safeSet = updateSpy.mock.calls[0][1].$set;
    expect(safeSet.storeName).toBe('Safe Profile Shop');
    expect(safeSet.website).toBe('https://shop.example.com');
    expect(safeSet.businessType).toBe('retail');
    expect(safeSet.commissionRate).toBeUndefined();
    expect(safeSet.status).toBeUndefined();
  });
});
