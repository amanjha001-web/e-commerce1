import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { Product } from '../../src/models/Product.model.js';
import { ProductVariant } from '../../src/models/ProductVariant.model.js';
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

describe('Vendor My Products Service & Routes Integration Tests', () => {
  const vendorUserId = '507f1f77bcf86cd799439051';
  const otherVendorStoreId = '507f1f77bcf86cd799439099';
  const vendorStoreId = '507f1f77bcf86cd799439052';
  const customerId = '507f1f77bcf86cd799439011';
  const categoryId = '507f1f77bcf86cd799439061';
  const productId = '507f1f77bcf86cd799439071';

  const vendorToken = generateAccessToken({ id: vendorUserId, role: ROLES.VENDOR });
  const customerToken = generateAccessToken({ id: customerId, role: ROLES.USER });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAuthUser = (role = ROLES.VENDOR, withVendorId = true) => {
    const isVendor = role === ROLES.VENDOR;
    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: isVendor ? vendorUserId : customerId,
        fullName: isVendor ? 'Vendor Seller' : 'Customer',
        role,
        isActive: true,
        ...(isVendor && withVendorId ? { vendorId: vendorStoreId } : {}),
      }),
    });
  };

  it('enforces auth (401) and vendor role (403) on /api/v1/vendor/products', async () => {
    const unauth = await request(app).get('/api/v1/vendor/products');
    expect(unauth.status).toBe(401);

    mockAuthUser(ROLES.USER);
    const forbidden = await request(app)
      .get('/api/v1/vendor/products')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('checkVendorProductOwnership resolves legacy vendor without user.vendorId and blocks non-owners (403)', async () => {
    mockAuthUser(ROLES.VENDOR, false); // user.vendorId omitted
    vi.spyOn(Product, 'findById').mockResolvedValueOnce({
      _id: productId,
      vendorId: otherVendorStoreId,
      name: 'Foreign Product',
    });
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: vendorStoreId, userId: vendorUserId })
    );

    const forbidden = await request(app)
      .get(`/api/v1/vendor/products/${productId}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(forbidden.status).toBe(403);

    // Owned product when user.vendorId is omitted succeeds via Vendor fallback
    vi.spyOn(Product, 'findById').mockResolvedValueOnce({
      _id: productId,
      vendor: vendorUserId, // legacy vendor field
      name: 'Legacy Vendor Product',
    });
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce({
      _id: vendorStoreId,
      userId: vendorUserId,
    });
    vi.spyOn(Product, 'findOne').mockReturnValueOnce(
      createQueryMock({
        _id: productId,
        name: 'Legacy Vendor Product',
        price: 1299,
        stock: 8,
        status: 'draft',
      })
    );
    vi.spyOn(ProductVariant, 'find').mockReturnValueOnce(
      createQueryMock([{ _id: 'v1', title: 'Red / M', price: 1299, stock: 4 }])
    );

    const allowed = await request(app)
      .get(`/api/v1/vendor/products/${productId}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.name).toBe('Legacy Vendor Product');
    expect(allowed.body.data.variants).toHaveLength(1);
  });

  it('GET /api/v1/vendor/products supports pagination, search, status normalization, and summary counts', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce({
      _id: vendorStoreId,
      userId: vendorUserId,
    });

    const findSpy = vi.spyOn(Product, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: productId,
          name: 'Handloom Silk Saree',
          category: { _id: categoryId, name: 'Fashion' },
          price: 2499,
          stock: 6,
          status: 'pending_approval',
        },
      ])
    );
    vi.spyOn(Product, 'countDocuments').mockResolvedValueOnce(25);
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([
      { total: 40, published: 20, pending: 10, draft: 5, rejected: 5, lowStock: 8 },
    ]);

    const res = await request(app)
      .get('/api/v1/vendor/products?page=2&limit=10&search=Silk&status=Pending%20approval')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.pagination).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
    expect(res.body.data.summary.total).toBe(40);
    expect(res.body.data.summary.pending).toBe(10);

    const appliedFilter = findSpy.mock.calls[0][0];
    expect(JSON.stringify(appliedFilter)).toContain('pending_approval');
    expect(appliedFilter.$and[2].$or[0].name.source).toBe('Silk');
  });

  it('POST /api/v1/vendor/products handles optional empty brand/compareAtPrice, draft status, and initializes inventory', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce({
      _id: vendorStoreId,
      userId: vendorUserId,
    });
    vi.spyOn(Product, 'findOne').mockResolvedValueOnce(null); // unique slug check
    const createSpy = vi.spyOn(Product, 'create').mockResolvedValueOnce({
      _id: productId,
      name: 'Artisan Wallet',
      price: 799,
      stock: 15,
      status: 'draft',
    });
    const invSpy = vi.spyOn(Inventory, 'create').mockResolvedValueOnce({});
    const movSpy = vi.spyOn(StockMovement, 'create').mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/v1/vendor/products')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        name: 'Artisan Wallet',
        description: 'Genuine stitched leather bifold wallet.',
        category: categoryId,
        brand: '',
        compareAtPrice: '',
        price: 799,
        stock: 15,
        status: 'draft',
      });

    expect(res.status).toBe(201);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Artisan Wallet',
        status: 'draft',
        vendorId: vendorStoreId,
      })
    );
    expect(createSpy.mock.calls[0][0].brand).toBeUndefined();
    expect(invSpy).toHaveBeenCalledTimes(1);
    expect(movSpy).toHaveBeenCalledTimes(1);
  });

  it('PATCH /stock and DELETE /api/v1/vendor/products/:productId synchronize inventory and cleanup variants', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Product, 'findById').mockResolvedValue({
      _id: productId,
      vendorId: vendorStoreId,
      stock: 5,
    });
    vi.spyOn(Vendor, 'findOne').mockResolvedValue({
      _id: vendorStoreId,
      userId: vendorUserId,
    });

    const mockProductDoc = {
      _id: productId,
      vendorId: vendorStoreId,
      stock: 5,
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(Product, 'findOne').mockResolvedValueOnce(mockProductDoc);
    const invUpdateSpy = vi.spyOn(Inventory, 'findOneAndUpdate').mockResolvedValueOnce({});
    const movCreateSpy = vi.spyOn(StockMovement, 'create').mockResolvedValueOnce({});

    const stockRes = await request(app)
      .patch(`/api/v1/vendor/products/${productId}/stock`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ stock: 22 });

    expect(stockRes.status).toBe(200);
    expect(mockProductDoc.stock).toBe(22);
    expect(invUpdateSpy).toHaveBeenCalledWith(
      { productId },
      expect.objectContaining({ quantity: 22, isOutOfStock: false }),
      { upsert: true }
    );
    expect(movCreateSpy).toHaveBeenCalledTimes(1);

    vi.spyOn(Product, 'findOneAndDelete').mockResolvedValueOnce({
      _id: productId,
      images: [],
    });
    const invDelSpy = vi.spyOn(Inventory, 'findOneAndDelete').mockResolvedValueOnce({});
    const varDelSpy = vi.spyOn(ProductVariant, 'deleteMany').mockResolvedValueOnce({});

    const delRes = await request(app)
      .delete(`/api/v1/vendor/products/${productId}`)
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(delRes.status).toBe(200);
    expect(invDelSpy).toHaveBeenCalledWith({ productId });
    expect(varDelSpy).toHaveBeenCalledWith({ productId });
  });
});
