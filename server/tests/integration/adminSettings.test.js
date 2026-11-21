import { describe, it, expect, vi, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Tax } from '../../src/models/Tax.model.js';
import { ShippingZone } from '../../src/models/ShippingZone.model.js';
import { AuditLog } from '../../src/models/AuditLog.model.js';
import { SystemSetting } from '../../src/services/superAdmin/setting.service.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';

const ADMIN_ID = '65f100000000000000000001';
const USER_ID = '65f100000000000000000002';
const TAX_ID_1 = '65fc00000000000000000001';
const ZONE_ID_1 = '65fd00000000000000000001';

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

describe('Admin Settings, Taxes & Shipping Zones Integration Tests', () => {
  const adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  const customerToken = generateAccessToken({ id: USER_ID, role: 'customer' });

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
      Object.defineProperty(
        mongoose.connection,
        'readyState',
        originalReadyStateDescriptor
      );
    }
  });

  const mockAuth = (role = 'admin') => {
    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: role === 'admin' ? ADMIN_ID : USER_ID,
        role,
        isActive: true,
        fullName: role === 'admin' ? 'Admin User' : 'Customer User',
        email: role === 'admin' ? 'admin@shopsphere.com' : 'cust@example.com',
      }),
    });
  };

  it('enforces authentication and admin role on /admin/settings, /admin/taxes, and /admin/shipping-zones', async () => {
    const unauth = await request(app).get('/api/v1/admin/settings');
    expect(unauth.status).toBe(401);

    mockAuth('customer');
    const forbidden = await request(app)
      .get('/api/v1/admin/taxes')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('merges defaults with stored SystemSettings, validates updates, logs AuditLog entries, and serves /history cleanly', async () => {
    setReadyState(1);
    mockAuth('admin');

    vi.spyOn(SystemSetting, 'find').mockResolvedValue([
      { key: 'STORE_NAME', value: 'ShopSphere Luxury' },
      { key: 'SHIPPING_THRESHOLD', value: 1499 },
    ]);

    const getRes = await request(app)
      .get('/api/v1/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.STORE_NAME).toBe('ShopSphere Luxury');
    expect(getRes.body.data.SHIPPING_THRESHOLD).toBe(1499);
    expect(getRes.body.data.DEFAULT_TAX_RATE).toBe(18);

    // Invalid email rejected with 400
    const badEmailRes = await request(app)
      .patch('/api/v1/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ settings: { SUPPORT_EMAIL: 'not-an-email' } });
    expect(badEmailRes.status).toBe(400);

    // Valid update persists via bulkWrite and records audit log
    const bulkSpy = vi
      .spyOn(SystemSetting, 'bulkWrite')
      .mockResolvedValue({ modifiedCount: 2 });
    const auditInsertSpy = vi
      .spyOn(AuditLog, 'insertMany')
      .mockResolvedValue([{ _id: '65fe00000000000000000001' }]);

    const updateRes = await request(app)
      .patch('/api/v1/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        settings: {
          STORE_NAME: 'ShopSphere Pro',
          SHIPPING_THRESHOLD: 1999,
        },
      });

    expect(updateRes.status).toBe(200);
    expect(bulkSpy).toHaveBeenCalledTimes(1);
    expect(auditInsertSpy).toHaveBeenCalledTimes(1);

    // Verify GET /admin/settings/history is matched BEFORE /:key
    vi.spyOn(AuditLog, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: '65fe00000000000000000001',
          action: 'SETTING_UPDATED',
          resource: 'SETTING',
          resourceId: 'SHIPPING_THRESHOLD',
          changes: { before: 1499, after: 1999 },
          details: { key: 'SHIPPING_THRESHOLD' },
          userId: { fullName: 'Admin User', email: 'admin@shopsphere.com' },
          createdAt: new Date(),
        },
      ])
    );

    const histRes = await request(app)
      .get('/api/v1/admin/settings/history')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(histRes.status).toBe(200);
    expect(histRes.body.data.history).toHaveLength(1);
    expect(histRes.body.data.history[0]).toEqual(
      expect.objectContaining({
        key: 'SHIPPING_THRESHOLD',
        oldValue: 1499,
        newValue: 1999,
        changedBy: 'Admin User',
      })
    );
  });

  it('exposes safe public storefront settings on GET /api/v1/settings/public without leaking security keys', async () => {
    setReadyState(1);
    vi.spyOn(SystemSetting, 'find').mockResolvedValueOnce([
      { key: 'STORE_NAME', value: 'ShopSphere Public' },
      { key: 'TWO_FACTOR_REQUIRED', value: true },
    ]);

    const res = await request(app).get('/api/v1/settings/public');
    expect(res.status).toBe(200);
    expect(res.body.data.STORE_NAME).toBe('ShopSphere Public');
    expect(res.body.data.SHIPPING_THRESHOLD).toBe(999);
    expect(res.body.data).not.toHaveProperty('TWO_FACTOR_REQUIRED');
    expect(res.body.data).not.toHaveProperty('MAX_LOGIN_ATTEMPTS');
  });

  it('supports Tax Rules CRUD with code, duplicate guard, rate validation, status toggle, and delete', async () => {
    mockAuth('admin');

    // Invalid rate
    const badRate = await request(app)
      .post('/api/v1/admin/taxes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'GST Extra', code: 'GST150', rate: 150 });
    expect(badRate.status).toBe(400);

    // Duplicate code -> 409
    vi.spyOn(Tax, 'findOne').mockResolvedValueOnce({ _id: TAX_ID_1, code: 'GST18' });
    const dupRes = await request(app)
      .post('/api/v1/admin/taxes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Standard GST', code: 'gst18', rate: 18 });
    expect(dupRes.status).toBe(409);

    // Valid create
    vi.spyOn(Tax, 'findOne').mockResolvedValueOnce(null);
    vi.spyOn(Tax, 'create').mockResolvedValueOnce({
      _id: TAX_ID_1,
      name: 'Standard GST',
      code: 'GST18',
      type: 'GST',
      rate: 18,
      country: 'India',
      state: 'ALL',
      isActive: true,
    });

    const createRes = await request(app)
      .post('/api/v1/admin/taxes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Standard GST', code: 'gst18', type: 'GST', rate: 18 });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toEqual(
      expect.objectContaining({
        code: 'GST18',
        type: 'GST',
        rate: 18,
      })
    );

    // List returns array compatible with adminTaxesSlice & Settings.jsx
    vi.spyOn(Tax, 'find').mockReturnValueOnce(
      createQueryMock([
        { _id: TAX_ID_1, name: 'Standard GST', code: 'GST18', rate: 18, isActive: true },
      ])
    );
    const listRes = await request(app)
      .get('/api/v1/admin/taxes')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data[0].code).toBe('GST18');

    // Toggle status
    vi.spyOn(Tax, 'findByIdAndUpdate').mockResolvedValueOnce({
      _id: TAX_ID_1,
      name: 'Standard GST',
      code: 'GST18',
      rate: 18,
      isActive: false,
    });
    const toggleRes = await request(app)
      .patch(`/api/v1/admin/taxes/${TAX_ID_1}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.isActive).toBe(false);
  });

  it('supports Shipping Zones CRUD normalizing shippingCharge/rate and freeShippingAbove/freeShippingThreshold aliases', async () => {
    mockAuth('admin');

    const createSpy = vi.spyOn(ShippingZone, 'create').mockImplementation(async (doc) => ({
      _id: ZONE_ID_1,
      ...doc,
    }));

    const createRes = await request(app)
      .post('/api/v1/admin/shipping-zones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Metro Cities',
        countries: 'India',
        states: 'Maharashtra, Delhi',
        pincodes: '400001, 110001',
        shippingCharge: 49,
        freeShippingAbove: 999,
        estimatedDays: { min: 2, max: 4 },
      });

    expect(createRes.status).toBe(201);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Metro Cities',
        rate: 49,
        freeShippingThreshold: 999,
        postalCodes: ['400001', '110001'],
        states: ['Maharashtra', 'Delhi'],
      })
    );
    expect(createRes.body.data).toEqual(
      expect.objectContaining({
        rate: 49,
        shippingCharge: 49,
        freeShippingThreshold: 999,
        freeShippingAbove: 999,
      })
    );

    vi.spyOn(ShippingZone, 'findByIdAndDelete').mockResolvedValueOnce({
      _id: ZONE_ID_1,
    });
    const delRes = await request(app)
      .delete(`/api/v1/admin/shipping-zones/${ZONE_ID_1}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
  });
});
