import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Coupon } from '../../src/models/Coupon.model.js';
import { CouponUsage } from '../../src/models/CouponUsage.model.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';

const ADMIN_ID = '65f100000000000000000001';
const USER_ID = '65f100000000000000000002';
const COUPON_ID_1 = '65f900000000000000000001';
const COUPON_ID_2 = '65f900000000000000000002';

const createQueryMock = (result) => ({
  populate: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue(result),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
});

const mockAdminAuth = () => {
  vi.spyOn(User, 'findById').mockReturnValue({
    populate: vi.fn().mockResolvedValue({
      _id: ADMIN_ID,
      role: 'admin',
      isActive: true,
      name: 'Admin User',
    }),
  });
  return generateAccessToken({ id: ADMIN_ID, role: 'admin' });
};

const mockCustomerAuth = () => {
  vi.spyOn(User, 'findById').mockReturnValue({
    populate: vi.fn().mockResolvedValue({
      _id: USER_ID,
      role: 'customer',
      isActive: true,
      name: 'Customer User',
    }),
  });
  return generateAccessToken({ id: USER_ID, role: 'customer' });
};

describe('Admin & Public Coupons Integration Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated and non-admin requests to /api/v1/admin/coupons', async () => {
    const unauth = await request(app).get('/api/v1/admin/coupons');
    expect(unauth.status).toBe(401);

    const customerToken = mockCustomerAuth();
    const forbidden = await request(app)
      .get('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('normalizes legacy fields, computes expired/scheduled/inactive/active statuses, and returns summary & pagination', async () => {
    const token = mockAdminAuth();
    const pastDate = new Date(Date.now() - 10 * 86400000);
    const futureStart = new Date(Date.now() + 5 * 86400000);
    const futureExpiry = new Date(Date.now() + 30 * 86400000);

    vi.spyOn(Coupon, 'find').mockReturnValue(
      createQueryMock([
        {
          _id: COUPON_ID_1,
          code: 'EXPIRED10',
          discountType: 'percentage',
          discountValue: 10,
          usedCount: 3,
          expiresAt: pastDate,
          isActive: false,
          isPublic: true,
        },
        {
          _id: COUPON_ID_2,
          code: 'VIPFUTURE',
          discountType: 'fixed',
          discountAmount: 250,
          minOrderAmount: 1000,
          maxUses: 50,
          usageCount: 2,
          startsAt: futureStart,
          expiryDate: futureExpiry,
          isActive: true,
          isPublic: false,
        },
      ])
    );

    vi.spyOn(Coupon, 'countDocuments')
      .mockResolvedValueOnce(2) // filtered total
      .mockResolvedValueOnce(5) // summary total
      .mockResolvedValueOnce(2) // active
      .mockResolvedValueOnce(1) // scheduled
      .mockResolvedValueOnce(1) // expired
      .mockResolvedValueOnce(1) // inactive
      .mockResolvedValueOnce(3); // publicCount

    const res = await request(app)
      .get('/api/v1/admin/coupons?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.coupons).toHaveLength(2);

    const expiredItem = data.coupons[0];
    expect(expiredItem.code).toBe('EXPIRED10');
    expect(expiredItem.discountAmount).toBe(10);
    expect(expiredItem.discountValue).toBe(10);
    expect(expiredItem.computedStatus).toBe('expired');
    expect(expiredItem.statusLabel).toBe('Expired');
    expect(expiredItem.usedCount).toBe(3);

    const scheduledPrivateItem = data.coupons[1];
    expect(scheduledPrivateItem.computedStatus).toBe('scheduled');
    expect(scheduledPrivateItem.statusLabel).toBe('Scheduled');
    expect(scheduledPrivateItem.isPublic).toBe(false);
    expect(scheduledPrivateItem.minPurchaseAmount).toBe(1000);
    expect(scheduledPrivateItem.usageLimit).toBe(50);

    expect(data.summary).toEqual({
      total: 5,
      active: 2,
      scheduled: 1,
      expired: 1,
      inactive: 1,
      publicCount: 3,
    });
    expect(data.pagination.total).toBe(2);
    expect(data.pagination.totalPages).toBe(1);
  });

  it('combines search, status, discountType, and visibility filters cleanly with $and', async () => {
    const token = mockAdminAuth();
    const findSpy = vi.spyOn(Coupon, 'find').mockReturnValue(createQueryMock([]));
    vi.spyOn(Coupon, 'countDocuments').mockResolvedValue(0);

    const res = await request(app)
      .get('/api/v1/admin/coupons?status=expired&type=percentage&visibility=private&search=FEST')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const queryUsed = findSpy.mock.calls[0][0];
    expect(Array.isArray(queryUsed.$and)).toBe(true);
    expect(queryUsed.$and).toContainEqual({ discountType: 'percentage' });
    expect(queryUsed.$and).toContainEqual({ isPublic: false });
    expect(
      queryUsed.$and.some(
        (cond) => Array.isArray(cond.$or) && cond.$or.some((sub) => sub.code && sub.code.$regex === 'FEST')
      )
    ).toBe(true);
  });

  it('creates a coupon accepting both canonical & discountValue aliases and validates business rules', async () => {
    const token = mockAdminAuth();
    const futureExpiry = new Date(Date.now() + 20 * 86400000).toISOString();

    const invalidPct = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'OVER100',
        discountType: 'percentage',
        discountValue: 150,
        expiryDate: futureExpiry,
      });
    expect(invalidPct.status).toBe(422);

    vi.spyOn(Coupon, 'findOne').mockResolvedValueOnce({ _id: COUPON_ID_1, code: 'DUP10' });
    const dupRes = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'DUP10',
        discountType: 'percentage',
        discountAmount: 10,
        expiryDate: futureExpiry,
      });
    expect(dupRes.status).toBe(409);

    vi.spyOn(Coupon, 'findOne').mockResolvedValueOnce(null);
    const createSpy = vi.spyOn(Coupon, 'create').mockImplementation(async (doc) => ({
      _id: COUPON_ID_1,
      ...doc,
    }));

    const okRes = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'festive25',
        discountType: 'percentage',
        discountValue: 25,
        minOrderAmount: 999,
        maxUses: 200,
        expiryDate: '2027-12-31',
        isPublic: false,
      });

    expect(okRes.status).toBe(201);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'FESTIVE25',
        discountAmount: 25,
        minPurchaseAmount: 999,
        usageLimit: 200,
        isPublic: false,
      })
    );
    expect(okRes.body.data.discountAmount).toBe(25);
    expect(okRes.body.data.isPublic).toBe(false);
  });

  it('guards updateCoupon against invalid ID, duplicate code conflicts, and >100% percentage updates', async () => {
    const token = mockAdminAuth();

    const badId = await request(app)
      .patch('/api/v1/admin/coupons/not-an-object-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ discountAmount: 20 });
    expect(badId.status).toBe(400);

    vi.spyOn(Coupon, 'findById').mockResolvedValue({
      _id: COUPON_ID_1,
      code: 'SAVE10',
      discountType: 'percentage',
      discountAmount: 10,
      startDate: new Date('2026-01-01T00:00:00Z'),
      expiryDate: new Date('2027-01-01T00:00:00Z'),
    });

    // Reject percentage > 100 even when discountType is omitted from PATCH body
    const pctOverRes = await request(app)
      .patch(`/api/v1/admin/coupons/${COUPON_ID_1}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ discountAmount: 120 });
    expect(pctOverRes.status).toBe(400);

    // Reject duplicate code on update
    vi.spyOn(Coupon, 'findOne').mockResolvedValueOnce({ _id: COUPON_ID_2, code: 'SAVE20' });
    const dupUpdate = await request(app)
      .patch(`/api/v1/admin/coupons/${COUPON_ID_1}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'SAVE20' });
    expect(dupUpdate.status).toBe(409);

    vi.spyOn(Coupon, 'findByIdAndUpdate').mockReturnValue(
      createQueryMock({
        _id: COUPON_ID_1,
        code: 'SAVE10',
        discountType: 'percentage',
        discountAmount: 15,
        isActive: true,
        isPublic: false,
        expiryDate: new Date('2027-01-01T00:00:00Z'),
      })
    );
    const okUpdate = await request(app)
      .patch(`/api/v1/admin/coupons/${COUPON_ID_1}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ discountAmount: 15, isPublic: false });

    expect(okUpdate.status).toBe(200);
    expect(okUpdate.body.data.discountAmount).toBe(15);
    expect(okUpdate.body.data.isPublic).toBe(false);
  });

  it('toggles status cleanly and returns structured coupon usage stats + redemption history', async () => {
    const token = mockAdminAuth();
    const saveMock = vi.fn().mockResolvedValue(true);

    vi.spyOn(Coupon, 'findById').mockResolvedValueOnce({
      _id: COUPON_ID_1,
      code: 'SAVE10',
      discountType: 'percentage',
      discountAmount: 10,
      isActive: true,
      expiryDate: new Date('2027-12-31T00:00:00Z'),
      save: saveMock,
    });

    const toggleRes = await request(app)
      .patch(`/api/v1/admin/coupons/${COUPON_ID_1}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(toggleRes.status).toBe(200);
    expect(saveMock).toHaveBeenCalled();
    expect(toggleRes.body.data.isActive).toBe(false);
    expect(toggleRes.body.data.computedStatus).toBe('inactive');

    vi.spyOn(Coupon, 'findById').mockReturnValueOnce(
      createQueryMock({
        _id: COUPON_ID_1,
        code: 'SAVE10',
        usageCount: 25,
        usageLimit: 100,
      })
    );
    vi.spyOn(CouponUsage, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: '65f900000000000000000099',
          userId: { name: 'Riya Sharma', email: 'riya@example.com' },
          orderId: { orderNumber: 'SS-10470', totalAmount: 2499 },
          discountAmount: 249.9,
        },
      ])
    );

    const usageRes = await request(app)
      .get(`/api/v1/admin/coupons/${COUPON_ID_1}/usage`)
      .set('Authorization', `Bearer ${token}`);

    expect(usageRes.status).toBe(200);
    expect(usageRes.body.data).toEqual(
      expect.objectContaining({
        code: 'SAVE10',
        usedCount: 25,
        usageLimit: 100,
        usagePercentage: 25,
        remainingUses: 75,
      })
    );
    expect(usageRes.body.data.usages).toHaveLength(1);
  });

  it('exposes only non-exhausted active public coupons on GET /api/v1/coupons while still validating private checkout codes', async () => {
    const futureExpiry = new Date(Date.now() + 30 * 86400000);

    // Exhausted coupon & active public coupon returned from query -> exhausted filtered out safely
    vi.spyOn(Coupon, 'find').mockReturnValue(
      createQueryMock([
        {
          _id: COUPON_ID_1,
          code: 'PUBLIC15',
          description: 'Sitewide promo',
          discountType: 'percentage',
          discountAmount: 15,
          minPurchaseAmount: 500,
          usageLimit: 50,
          usageCount: 10,
          expiryDate: futureExpiry,
          isActive: true,
          isPublic: true,
          vendorId: null,
        },
        {
          _id: COUPON_ID_2,
          code: 'MAXEDOUT',
          discountType: 'fixed',
          discountAmount: 100,
          usageLimit: 10,
          usageCount: 10,
          expiryDate: futureExpiry,
          isActive: true,
          isPublic: true,
        },
      ])
    );

    const publicRes = await request(app).get('/api/v1/coupons');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.coupons).toHaveLength(1);
    expect(publicRes.body.data.coupons[0]).toEqual(
      expect.objectContaining({
        code: 'PUBLIC15',
        discountLabel: '15% OFF',
        remainingUses: 40,
        isGlobal: true,
      })
    );

    // Verify GET /api/v1/coupons query explicitly requires isActive & isPublic
    const queryFilter = Coupon.find.mock.calls[0][0];
    expect(queryFilter.$and).toContainEqual({ isActive: { $ne: false } });
    expect(queryFilter.$and).toContainEqual({ isPublic: { $ne: false } });

    // Private coupon still validates when entered manually at checkout
    vi.spyOn(Coupon, 'findOne').mockResolvedValueOnce({
      _id: COUPON_ID_2,
      code: 'VIPSECRET20',
      discountType: 'percentage',
      discountAmount: 20,
      minPurchaseAmount: 500,
      maxDiscountAmount: 300,
      usageLimit: 100,
      usageCount: 5,
      usageLimitPerUser: 1,
      isActive: true,
      isPublic: false,
      expiryDate: futureExpiry,
    });

    const validateRes = await request(app)
      .post('/api/v1/coupons/validate')
      .send({ couponCode: 'vipsecret20', cartTotal: 2000 });

    expect(validateRes.status).toBe(200);
    expect(validateRes.body.data.isValid).toBe(true);
    expect(validateRes.body.data.coupon.discountCalculated).toBe(300);
  });
});
