import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { Product } from '../../src/models/Product.model.js';
import { Inventory } from '../../src/models/Inventory.model.js';
import { Order } from '../../src/models/Order.model.js';
import { VendorEarnings } from '../../src/models/VendorEarnings.model.js';
import { VendorPayout } from '../../src/models/VendorPayout.model.js';
import { vendorStoreService } from '../../src/services/vendor/store.service.js';
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
    distinct: vi.fn(() => Promise.resolve(result)),
    exec: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

describe('Vendor Dashboard Service & Routes Integration Tests', () => {
  const vendorUserId = '507f1f77bcf86cd799439021';
  const otherVendorId = '507f1f77bcf86cd799439099';
  const vendorStoreId = '507f1f77bcf86cd799439022';
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
        fullName: isVendor ? 'testdashboard' : 'Customer',
        email: isVendor ? 'vendor@shopsphere.com' : 'customer@shopsphere.com',
        role,
        isActive: true,
      }),
    });
  };

  it('rejects unauthenticated (401) and non-vendor (403) requests across dashboard route aliases', async () => {
    const unauth = await request(app).get('/api/v1/vendors/dashboard');
    expect(unauth.status).toBe(401);

    mockAuthUser(ROLES.USER);
    const forbidden = await request(app)
      .get('/api/v1/vendor/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('GET /api/v1/vendors/dashboard returns real vendor-scoped metrics, earnings, low stock, salesReport, and filtered recentOrders', async () => {
    mockAuthUser(ROLES.VENDOR);

    const mockStore = {
      _id: vendorStoreId,
      userId: vendorUserId,
      storeName: 'testdashboard',
      status: 'approved',
      isActive: true,
      rating: 4.6,
      numReviews: 14,
      commissionRate: 10,
    };
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce(mockStore);

    vi.spyOn(Product, 'find')
      .mockReturnValueOnce(createQueryMock(['507f1f77bcf86cd799439031'])) // buildVendorScope productIds
      .mockReturnValueOnce(
        createQueryMock([
          {
            _id: '507f1f77bcf86cd799439031',
            name: 'Silk Kurti',
            slug: 'silk-kurti',
            price: 1499,
            stock: 3,
            status: 'published',
          },
        ])
      ); // lowStock products

    vi.spyOn(Inventory, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          quantity: 2,
          productId: {
            _id: '507f1f77bcf86cd799439032',
            name: 'Linen Shirt',
            slug: 'linen-shirt',
            price: 999,
            stock: 2,
            status: 'published',
          },
        },
      ])
    );

    vi.spyOn(Product, 'countDocuments')
      .mockResolvedValueOnce(8) // totalProducts
      .mockResolvedValueOnce(6) // publishedProducts
      .mockResolvedValueOnce(2); // pendingProducts

    vi.spyOn(VendorEarnings, 'findOne').mockResolvedValueOnce({
      vendorId: vendorStoreId,
      totalRevenue: 4500,
      totalCommission: 450,
      netEarnings: 4050,
      availableBalance: 2550,
      pendingBalance: 1500,
      totalWithdrawn: 0,
    });

    vi.spyOn(Order, 'aggregate')
      .mockResolvedValueOnce([
        {
          totalOrders: 3,
          pendingOrders: 1,
          ordersThisWeek: 2,
          ordersPrevWeek: 1,
          ordersThisMonth: 2,
          ordersLastMonth: 1,
          grossSales: 5200,
          earnedSales: 4500,
          salesThisMonth: 3000,
          salesLastMonth: 1500,
          salesThisWeek: 2000,
          salesPrevWeek: 1000,
        },
      ]) // aggregateOrderSummary
      .mockResolvedValueOnce([]) // buildSalesReportForVendor currentRows
      .mockResolvedValueOnce([{ revenue: 1500 }]); // buildSalesReportForVendor prevAgg

    vi.spyOn(Order, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: '507f1f77bcf86cd799439041',
          orderNumber: '#SS-2001',
          userId: { fullName: 'Aman Kumar', email: 'aman@example.com' },
          totalAmount: 5000,
          orderStatus: 'processing',
          createdAt: new Date('2026-11-20T10:00:00Z'),
          items: [
            { vendorId: vendorStoreId, name: 'Silk Kurti', price: 1500, quantity: 2, total: 3000 },
            { vendorId: otherVendorId, name: 'Other Vendor Item', price: 2000, quantity: 1, total: 2000 },
          ],
        },
      ])
    );

    vi.spyOn(VendorPayout, 'aggregate').mockResolvedValueOnce([
      { _id: 'PENDING', total: 1500, count: 1 },
    ]);
    vi.spyOn(VendorPayout, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: 'p1', amount: 1500, status: 'PENDING', createdAt: new Date() })
    );

    const res = await request(app)
      .get('/api/v1/vendors/dashboard')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.store.storeName).toBe('testdashboard');
    expect(data.metrics.totalProducts).toBe(8);
    expect(data.metrics.lowStockCount).toBe(2);
    expect(data.metrics.totalOrders).toBe(3);
    expect(data.metrics.ordersThisWeek).toBe(2);
    expect(data.metrics.grossSales).toBe(5200);
    expect(data.metrics.totalRevenue).toBe(4500);
    expect(data.metrics.salesGrowth).toBe(100);
    expect(data.metrics.pendingPayouts).toBe(1500);
    expect(data.metrics.pendingPayoutCount).toBe(1);
    expect(data.metrics.availableBalance).toBe(2550);

    expect(data.lowStockProducts).toHaveLength(2);
    expect(data.recentOrders).toHaveLength(1);
    // Multi-vendor order total is scoped strictly to this vendor's item (₹3,000, not ₹5,000)
    expect(data.recentOrders[0].vendorOrderTotal).toBe(3000);
    expect(data.recentOrders[0].items).toHaveLength(1);
    expect(data.recentOrders[0].customer.fullName).toBe('Aman Kumar');
    expect(data.salesReport.period).toBe('8w');
    expect(data.salesReport.salesTrend).toHaveLength(8);
  });

  it('GET /api/v1/vendor/stats returns complete backward-compatible and extended stats', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce({
      _id: vendorStoreId,
      userId: vendorUserId,
      rating: 4.5,
    });
    vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Inventory, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Product, 'countDocuments').mockResolvedValueOnce(5);
    vi.spyOn(VendorEarnings, 'findOne').mockResolvedValueOnce({
      vendorId: vendorStoreId,
      totalRevenue: 2000,
      netEarnings: 1800,
      availableBalance: 1800,
    });
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([
      { totalOrders: 4, pendingOrders: 1, ordersThisWeek: 2, grossSales: 2500, earnedSales: 2000 },
    ]);
    vi.spyOn(VendorPayout, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(VendorPayout, 'findOne').mockReturnValueOnce(createQueryMock(null));

    const res = await request(app)
      .get('/api/v1/vendor/stats')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalOrders).toBe(4);
    expect(res.body.data.pendingOrders).toBe(1);
    expect(res.body.data.revenue).toBe(2000);
    expect(res.body.data.grossSales).toBe(2500);
    expect(res.body.data.balance).toBe(1800);
  });

  it('GET /api/v1/vendors/dashboard/sales honors period=7d, period=all, and falls back invalid to 8w', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValue({
      _id: vendorStoreId,
      userId: vendorUserId,
    });
    vi.spyOn(Product, 'find').mockImplementation(() => createQueryMock([]));

    const orderAggSpy = vi
      .spyOn(Order, 'aggregate')
      .mockResolvedValueOnce([{ _id: '2026-08', grossSales: 1499, revenue: 1499, count: 1 }]);

    const allRes = await request(app)
      .get('/api/v1/vendors/dashboard/sales?period=all')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(allRes.status).toBe(200);
    expect(allRes.body.data.period).toBe('all');
    expect(allRes.body.data.salesTrend.length).toBeGreaterThanOrEqual(6);
    const augBucket = allRes.body.data.salesTrend.find((d) => d.date === '2026-08');
    expect(augBucket).toBeDefined();
    expect(augBucket.revenue).toBe(1499);
    expect(augBucket.orders).toBe(1);

    const pipeline = orderAggSpy.mock.calls[0][0];
    expect(JSON.stringify(pipeline)).toContain('$unwind');
    expect(pipeline[4].$group._id.month.$dateToString.timezone).toMatch(/^[+-]\d{2}:\d{2}$/);

    // Invalid period safely falls back to 8w
    orderAggSpy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const fallback = await vendorStoreService.getSalesReport(vendorUserId, 'invalid-period');
    expect(fallback.period).toBe('8w');
    expect(fallback.salesTrend).toHaveLength(8);
  });
});
