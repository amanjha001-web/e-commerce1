import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Product } from '../../src/models/Product.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { Category } from '../../src/models/Category.model.js';
import { Inventory } from '../../src/models/Inventory.model.js';
import { StockMovement } from '../../src/models/StockMovement.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';
import { ROLES } from '../../src/constants/roles.constant.js';
import { PRODUCT_STATUS } from '../../src/constants/productStatus.constant.js';

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

describe('Admin Products & Inventory Management Integration Tests', () => {
  const adminId = '507f1f77bcf86cd799439012';
  const customerId = '507f1f77bcf86cd799439011';
  const vendorId = '507f1f77bcf86cd799439014';
  const vendorUserId = '507f1f77bcf86cd799439013';
  const categoryId = '507f1f77bcf86cd799439022';
  const productId = '507f1f77bcf86cd799439088';

  const adminToken = generateAccessToken({ id: adminId, role: ROLES.ADMIN });
  const customerToken = generateAccessToken({ id: customerId, role: ROLES.USER });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAdminAuth = (role = ROLES.ADMIN) => {
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

  it('rejects unauthenticated (401) and non-admin (403) access on /api/v1/admin/products', async () => {
    const unauth = await request(app).get('/api/v1/admin/products');
    expect(unauth.status).toBe(401);

    mockAdminAuth(ROLES.USER);
    const forbidden = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('GET /api/v1/admin/products maps vendorId/category fields, status/stock filters, and catalog summary', async () => {
    mockAdminAuth(ROLES.ADMIN);

    const prodDoc = {
      _id: productId,
      name: 'AirPods Pro (2nd Generation)',
      sku: 'AP-PRO-2',
      price: 24900,
      stock: 6,
      status: PRODUCT_STATUS.PUBLISHED,
      isActive: true,
      category: { _id: categoryId, name: 'Electronics', slug: 'electronics' },
      vendorId: { _id: vendorId, storeName: 'TechHub Official', email: 'vendor@shopsphere.com', status: 'approved', isActive: true },
      images: [{ url: 'https://cdn.example.com/ap.jpg' }],
    };

    vi.spyOn(Vendor, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Category, 'find').mockReturnValueOnce(createQueryMock([]));
    const findSpy = vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock([prodDoc]));
    vi.spyOn(Product, 'countDocuments')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);

    const res = await request(app)
      .get('/api/v1/admin/products?status=published&stock=low_stock&search=AirPods')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PRODUCT_STATUS.PUBLISHED,
        stock: { $gt: 0, $lte: 10 },
      })
    );
    expect(res.body.data.summary).toEqual({
      total: 10,
      published: 7,
      pendingApproval: 2,
      rejected: 1,
      disabled: 1,
      lowStock: 3,
      outOfStock: 1,
    });
    expect(res.body.data.products[0]).toMatchObject({
      name: 'AirPods Pro (2nd Generation)',
      vendorName: 'TechHub Official',
      categoryName: 'Electronics',
      thumbnail: 'https://cdn.example.com/ap.jpg',
    });
  });

  it('PATCH /approve & /reject update status/isActive, clear/store reason, upsert Inventory, and notify vendor', async () => {
    const adminUser = {
      _id: adminId,
      fullName: 'Admin User',
      role: ROLES.ADMIN,
      isActive: true,
    };

    const productDoc = {
      _id: productId,
      name: 'Smart Watch',
      vendorId,
      stock: 15,
      status: PRODUCT_STATUS.PENDING_APPROVAL,
      isActive: true,
      rejectionReason: 'Old reason',
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(User, 'findById')
      .mockReturnValueOnce({ populate: vi.fn().mockResolvedValue(adminUser) })
      .mockReturnValueOnce({ populate: vi.fn().mockResolvedValue(adminUser) });

    vi.spyOn(Product, 'findById')
      .mockResolvedValueOnce(productDoc)
      .mockReturnValueOnce(
        createQueryMock({
          ...productDoc,
          status: PRODUCT_STATUS.PUBLISHED,
          isActive: true,
          rejectionReason: '',
          vendorId: { _id: vendorId, storeName: 'TechHub Official' },
        })
      )
      .mockResolvedValueOnce(productDoc)
      .mockReturnValueOnce(
        createQueryMock({
          ...productDoc,
          status: PRODUCT_STATUS.REJECTED,
          isActive: false,
          rejectionReason: 'Missing specs',
          vendorId: { _id: vendorId, storeName: 'TechHub Official' },
        })
      );

    vi.spyOn(Inventory, 'findOneAndUpdate').mockResolvedValue({});
    vi.spyOn(Vendor, 'findById').mockReturnValue(createQueryMock({ _id: vendorId, userId: vendorUserId }));
    const notifySpy = vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const approveRes = await request(app)
      .patch(`/api/v1/admin/products/${productId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);
    expect(productDoc.status).toBe(PRODUCT_STATUS.PUBLISHED);
    expect(productDoc.rejectionReason).toBe('');

    const rejectRes = await request(app)
      .patch(`/api/v1/admin/products/${productId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Missing specs' });

    expect(rejectRes.status).toBe(200);
    expect(productDoc.status).toBe(PRODUCT_STATUS.REJECTED);
    expect(productDoc.isActive).toBe(false);
    expect(productDoc.rejectionReason).toBe('Missing specs');
    expect(notifySpy).toHaveBeenCalledTimes(2);
  });

  it('PATCH /:productId, /inventory/:productId/adjust (delta & set), and DELETE /:productId work cleanly', async () => {
    const adminUser = {
      _id: adminId,
      fullName: 'Admin User',
      role: ROLES.ADMIN,
      isActive: true,
    };

    const productDoc = {
      _id: productId,
      name: 'Smart Watch',
      description: 'Wearable',
      vendorId,
      price: 1999,
      stock: 10,
      status: PRODUCT_STATUS.PUBLISHED,
      isActive: true,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(User, 'findById')
      .mockReturnValueOnce({ populate: vi.fn().mockResolvedValue(adminUser) })
      .mockReturnValueOnce({ populate: vi.fn().mockResolvedValue(adminUser) })
      .mockReturnValueOnce({ populate: vi.fn().mockResolvedValue(adminUser) })
      .mockReturnValueOnce({ populate: vi.fn().mockResolvedValue(adminUser) });

    // 1. Update Product + sync stock change to Inventory & StockMovement
    vi.spyOn(Product, 'findById')
      .mockResolvedValueOnce(productDoc)
      .mockReturnValueOnce(
        createQueryMock({
          ...productDoc,
          name: 'Smart Watch Pro',
          price: 2499,
          stock: 14,
          vendorId: { _id: vendorId, storeName: 'TechHub Official' },
        })
      )
      // 2. Delta adjustment (-4 -> 10)
      .mockResolvedValueOnce(productDoc)
      // 3. Delta resulting in negative (-50 -> 400)
      .mockResolvedValueOnce(productDoc);

    const invUpsertSpy = vi.spyOn(Inventory, 'findOneAndUpdate').mockResolvedValue({ quantity: 10, isOutOfStock: false });
    const movementSpy = vi.spyOn(StockMovement, 'create').mockResolvedValue({});

    const editRes = await request(app)
      .patch(`/api/v1/admin/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Smart Watch Pro', price: 2499, stock: 14 });

    expect(editRes.status).toBe(200);
    expect(productDoc.stock).toBe(14);
    expect(invUpsertSpy).toHaveBeenCalledTimes(1);
    expect(movementSpy).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 4, previousStock: 10, newStock: 14 })
    );

    const deltaRes = await request(app)
      .patch(`/api/v1/admin/inventory/${productId}/adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: -4, mode: 'delta', reason: 'Damaged units' });

    expect(deltaRes.status).toBe(200);
    expect(deltaRes.body.data.stock).toBe(10);

    const badDeltaRes = await request(app)
      .patch(`/api/v1/admin/inventory/${productId}/adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: -50, mode: 'delta' });

    expect(badDeltaRes.status).toBe(400);

    // 4. Delete product cleans up Inventory
    vi.spyOn(Product, 'findByIdAndDelete').mockResolvedValueOnce(productDoc);
    const invDeleteSpy = vi.spyOn(Inventory, 'findOneAndDelete').mockResolvedValue({});

    const delRes = await request(app)
      .delete(`/api/v1/admin/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.status).toBe(200);
    expect(invDeleteSpy).toHaveBeenCalledWith({ productId });
  });
});
