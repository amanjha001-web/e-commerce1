import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { Product } from '../../src/models/Product.model.js';
import { Inventory } from '../../src/models/Inventory.model.js';
import { StockMovement } from '../../src/models/StockMovement.model.js';
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

describe('Vendor Inventory Management Service & Routes Integration Tests', () => {
  const vendorUserId = '507f1f77bcf86cd799439091';
  const vendorStoreId = '507f1f77bcf86cd799439092';
  const customerId = '507f1f77bcf86cd799439011';
  const prod1Id = '507f1f77bcf86cd799439093';
  const prod2Id = '507f1f77bcf86cd799439094';
  const prod3Id = '507f1f77bcf86cd799439095';

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
        fullName: isVendor ? 'Vendor Seller' : 'Customer',
        role,
        isActive: true,
      }),
    });
  };

  it('enforces auth (401) and vendor role (403) on /api/v1/vendor/inventory', async () => {
    const unauth = await request(app).get('/api/v1/vendor/inventory');
    expect(unauth.status).toBe(401);

    mockAuthUser(ROLES.USER);
    const forbidden = await request(app)
      .get('/api/v1/vendor/inventory')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('GET /api/v1/vendor/inventory merges legacy products + inventory records, computes summary, filters, and paginates', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce({
      _id: vendorStoreId,
      userId: vendorUserId,
    });

    vi.spyOn(Product, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: prod1Id,
          name: 'Classic Tote',
          sku: 'TOTE-01',
          price: 1000,
          stock: 25,
          status: 'published',
          createdAt: new Date('2026-11-18'),
        },
        {
          _id: prod2Id,
          name: 'Ceramic Lamp',
          sku: 'LAMP-02',
          price: 500,
          stock: 5,
          status: 'published',
          createdAt: new Date('2026-11-19'),
        },
        {
          _id: prod3Id,
          name: 'Linen Throw',
          sku: 'LINEN-03',
          price: 800,
          stock: 0,
          status: 'published',
          createdAt: new Date('2026-11-20'),
        },
      ])
    );

    vi.spyOn(Inventory, 'find').mockReturnValueOnce(
      createQueryMock([
        { _id: 'inv1', productId: prod1Id, quantity: 25, lowStockThreshold: 10, reservedQuantity: 2 },
        // prod2 intentionally absent from Inventory doc (legacy product fallback)
        { _id: 'inv3', productId: prod3Id, quantity: 0, lowStockThreshold: 10, reservedQuantity: 0 },
      ])
    );

    const res = await request(app)
      .get('/api/v1/vendor/inventory?status=low_stock&search=Lamp&page=1&limit=10')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.summary.total).toBe(3);
    expect(data.summary.inStock).toBe(1);
    expect(data.summary.lowStock).toBe(1);
    expect(data.summary.outOfStock).toBe(1);
    expect(data.summary.totalUnits).toBe(28); // (25 - 2) + 5 + 0
    expect(data.items).toHaveLength(1);
    expect(data.items[0].productId.name).toBe('Ceramic Lamp');
    expect(data.items[0].stockStatus).toBe('low_stock');
    expect(data.pagination).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('PATCH /api/v1/vendor/inventory/:productId supports delta restock, threshold update, negative guard, and movement logging', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValue({
      _id: vendorStoreId,
      userId: vendorUserId,
    });

    const mockProduct = {
      _id: prod2Id,
      vendorId: vendorStoreId,
      stock: 5,
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(Product, 'findOne').mockResolvedValue(mockProduct);
    const invSpy = vi.spyOn(Inventory, 'findOneAndUpdate').mockResolvedValueOnce({
      _id: 'inv2',
      productId: prod2Id,
      quantity: 15,
      lowStockThreshold: 8,
    });
    const movSpy = vi.spyOn(StockMovement, 'create').mockResolvedValueOnce({});

    // Reject negative resulting stock
    const badRes = await request(app)
      .patch(`/api/v1/vendor/inventory/${prod2Id}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ mode: 'delta', quantity: -10 });
    expect(badRes.status).toBe(400);

    // Valid delta restock + threshold update
    const okRes = await request(app)
      .patch(`/api/v1/vendor/inventory/${prod2Id}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ mode: 'delta', quantity: 10, lowStockThreshold: 8, reason: 'New shipment' });

    expect(okRes.status).toBe(200);
    expect(mockProduct.stock).toBe(15);
    expect(invSpy).toHaveBeenCalledWith(
      { productId: prod2Id },
      expect.objectContaining({
        $set: expect.objectContaining({
          quantity: 15,
          lowStockThreshold: 8,
          isOutOfStock: false,
        }),
      }),
      { upsert: true, new: true }
    );
    expect(movSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'IN',
        quantity: 10,
        previousStock: 5,
        newStock: 15,
        reason: 'New shipment',
      })
    );
  });

  it('GET /api/v1/vendor/inventory/:productId/movements returns stock movement history', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce({
      _id: vendorStoreId,
      userId: vendorUserId,
    });
    vi.spyOn(Product, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: prod1Id, name: 'Classic Tote', sku: 'TOTE-01' })
    );
    vi.spyOn(StockMovement, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: 'm1',
          type: 'ADJUSTMENT',
          quantity: 5,
          previousStock: 20,
          newStock: 25,
          reason: 'Direct adjustment',
        },
      ])
    );

    const res = await request(app)
      .get(`/api/v1/vendor/inventory/${prod1Id}/movements`)
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].newStock).toBe(25);
  });
});
