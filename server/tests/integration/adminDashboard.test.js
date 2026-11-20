import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Product } from '../../src/models/Product.model.js';
import { Inventory } from '../../src/models/Inventory.model.js';
import { Payment } from '../../src/models/Payment.model.js';
import { VendorEarnings } from '../../src/models/VendorEarnings.model.js';
import { settleCodOrderOnDelivery } from '../../src/utils/orderPayment.utils.js';
import { Order } from '../../src/models/Order.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { VendorRequest } from '../../src/models/VendorRequest.model.js';
import { SupportTicket } from '../../src/models/SupportTicket.model.js';
import { adminDashboardService } from '../../src/services/admin/dashboard.service.js';
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

describe('Admin Dashboard Service & Routes Integration Tests', () => {
  const adminId = '507f1f77bcf86cd799439012';
  const customerId = '507f1f77bcf86cd799439011';
  const adminToken = generateAccessToken({ id: adminId, role: ROLES.ADMIN });
  const customerToken = generateAccessToken({ id: customerId, role: ROLES.USER });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAuthUser = (role = ROLES.ADMIN) => {
    const isAdmin = role === ROLES.ADMIN;
    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: isAdmin ? adminId : customerId,
        fullName: isAdmin ? 'Admin User' : 'Suman',
        email: isAdmin ? 'admin@shopsphere.com' : 'suman@example.com',
        role,
        isActive: true,
      }),
    });
  };

  it('should reject unauthenticated requests (401) and non-admin requests (403)', async () => {
    const unauth = await request(app).get('/api/v1/admin/dashboard');
    expect(unauth.status).toBe(401);

    mockAuthUser(ROLES.USER);
    const forbidden = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('GET /api/v1/admin/dashboard should return complete metrics, lists, and top products', async () => {
    mockAuthUser(ROLES.ADMIN);

    vi.spyOn(User, 'countDocuments')
      .mockResolvedValueOnce(12) // totalUsers
      .mockResolvedValueOnce(6) // usersThisMonth
      .mockResolvedValueOnce(4); // usersLastMonth
    vi.spyOn(Vendor, 'countDocuments')
      .mockResolvedValueOnce(3) // totalVendors
      .mockResolvedValueOnce(1); // pendingVendorAccounts
    vi.spyOn(VendorRequest, 'countDocuments').mockResolvedValueOnce(2); // pendingVendorRequests
    vi.spyOn(Product, 'countDocuments')
      .mockResolvedValueOnce(20) // totalProducts
      .mockResolvedValueOnce(15) // publishedProducts
      .mockResolvedValueOnce(4); // pendingProducts
    vi.spyOn(Order, 'countDocuments')
      .mockResolvedValueOnce(10) // totalOrders
      .mockResolvedValueOnce(5) // ordersThisMonth
      .mockResolvedValueOnce(2) // ordersLastMonth
      .mockResolvedValueOnce(3); // pendingOrders
    vi.spyOn(SupportTicket, 'countDocuments').mockResolvedValueOnce(2);

    vi.spyOn(Payment, 'aggregate').mockResolvedValue([]);
    vi.spyOn(Order, 'aggregate')
      .mockResolvedValueOnce([{ total: 15000 }]) // totalRevenue
      .mockResolvedValueOnce([{ total: 9000 }]) // revenueThisMonth
      .mockResolvedValueOnce([{ total: 6000 }]) // revenueLastMonth
      .mockResolvedValueOnce([{ total: 18500 }]) // grossSales
      .mockResolvedValueOnce([
        {
          _id: '507f1f77bcf86cd799439099',
          name: 'Silk Saree',
          totalSales: 8,
          totalRevenue: 12000,
        },
      ]);

    vi.spyOn(Order, 'find').mockReturnValue(
      createQueryMock([
        {
          _id: '507f1f77bcf86cd799439088',
          orderNumber: 'ORD-1001',
          userId: { fullName: 'Suman', email: 'suman@example.com' },
          totalAmount: 1499,
          orderStatus: 'pending',
        },
      ])
    );
    vi.spyOn(User, 'find').mockReturnValue(
      createQueryMock([
        {
          _id: customerId,
          fullName: 'Suman',
          email: 'suman@example.com',
          role: 'user',
          isActive: true,
        },
        {
          _id: '507f1f77bcf86cd799439077',
          fullName: 'Blocked User',
          email: 'blocked@example.com',
          role: 'user',
          isActive: false,
        },
      ])
    );
    vi.spyOn(Inventory, 'find').mockReturnValue(createQueryMock([]));
    vi.spyOn(Product, 'find')
      .mockReturnValueOnce(
        createQueryMock([
          { _id: '507f1f77bcf86cd799439099', name: 'Low Stock Mug', stock: 3, price: 299 },
        ])
      )
      .mockReturnValueOnce(
        createQueryMock([
          {
            _id: '507f1f77bcf86cd799439099',
            name: 'Silk Saree',
            price: 1500,
            stock: 20,
            category: { name: 'Fashion' },
          },
        ])
      )
      .mockReturnValueOnce(createQueryMock([]));

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const { metrics, recentOrders, recentUsers, lowStockProducts, topProducts } =
      res.body.data;

    expect(metrics.totalUsers).toBe(12);
    expect(metrics.totalVendors).toBe(3);
    expect(metrics.pendingVendors).toBe(2);
    expect(metrics.totalProducts).toBe(20);
    expect(metrics.publishedProducts).toBe(15);
    expect(metrics.pendingProducts).toBe(4);
    expect(metrics.lowStockCount).toBe(1);
    expect(metrics.totalOrders).toBe(10);
    expect(metrics.pendingOrders).toBe(3);
    expect(metrics.totalRevenue).toBe(15000);
    expect(metrics.grossSales).toBe(18500);
    expect(metrics.pendingRevenue).toBe(3500);
    expect(metrics.openTickets).toBe(2);
    expect(metrics.usersGrowth).toBe(50);
    expect(metrics.ordersGrowth).toBe(150);
    expect(metrics.revenueGrowth).toBe(50);

    expect(recentOrders).toHaveLength(1);
    expect(recentUsers).toHaveLength(2);
    expect(recentUsers[0].status).toBe('active');
    expect(recentUsers[1].status).toBe('blocked');
    expect(lowStockProducts).toHaveLength(1);
    expect(topProducts).toHaveLength(1);
    expect(topProducts[0].totalSales).toBe(8);
    expect(topProducts[0].totalRevenue).toBe(12000);
  });

  it('GET /api/v1/admin/dashboard/analytics should honor period and gap-fill days', async () => {
    mockAuthUser(ROLES.ADMIN);

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(today.getDate()).padStart(2, '0')}`;

    vi.spyOn(Payment, 'aggregate').mockResolvedValue([]);
    vi.spyOn(Order, 'aggregate')
      .mockResolvedValueOnce([{ _id: todayKey, orders: 4, orderValue: 5500 }]) // ordersByDay
      .mockResolvedValueOnce([{ _id: todayKey, revenue: 4000 }]) // revenueByDay
      .mockResolvedValueOnce([{ total: 2000 }]); // previousRevenue
    vi.spyOn(Order, 'countDocuments').mockResolvedValueOnce(2); // previousOrders

    const res = await request(app)
      .get('/api/v1/admin/dashboard/analytics?period=30d')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe('30d');
    expect(res.body.data.salesTrend).toHaveLength(30);
    expect(res.body.data.summary.totalOrders).toBe(4);
    expect(res.body.data.summary.totalRevenue).toBe(4000);
    expect(res.body.data.summary.grossSales).toBe(5500);
    expect(res.body.data.summary.pendingRevenue).toBe(1500);
    expect(res.body.data.summary.averageOrderValue).toBe(1000);
    expect(res.body.data.summary.ordersGrowth).toBe(100);
    expect(res.body.data.summary.revenueGrowth).toBe(100);

    // Invalid period falls back safely to 7d
    vi.spyOn(Order, 'aggregate')
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.spyOn(Order, 'countDocuments').mockResolvedValueOnce(0);
    const fallbackAnalytics = await adminDashboardService.getDashboardAnalytics('invalid');
    expect(fallbackAnalytics.period).toBe('7d');
    expect(fallbackAnalytics.salesTrend).toHaveLength(7);
  });

  it('GET /recent-orders, /recent-users, /top-products, and /low-stock endpoints should work', async () => {
    mockAuthUser(ROLES.ADMIN);

    vi.spyOn(Order, 'find').mockReturnValue(createQueryMock([{ _id: 'o1' }]));
    const resOrders = await request(app)
      .get('/api/v1/admin/dashboard/recent-orders?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resOrders.status).toBe(200);
    expect(resOrders.body.data).toHaveLength(1);

    vi.spyOn(User, 'find').mockReturnValue(createQueryMock([{ _id: customerId, isActive: true }]));
    const resUsers = await request(app)
      .get('/api/v1/admin/dashboard/recent-users?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resUsers.status).toBe(200);
    expect(resUsers.body.data[0].status).toBe('active');

    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(Product, 'find').mockReturnValueOnce(
      createQueryMock([
        { _id: 'p-cat', name: 'Catalog Watch', price: 999, stock: 18 },
      ])
    );
    const resTop = await request(app)
      .get('/api/v1/admin/dashboard/top-products?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resTop.status).toBe(200);
    expect(resTop.body.data).toHaveLength(1);
    expect(resTop.body.data[0].name).toBe('Catalog Watch');

    vi.spyOn(Product, 'find').mockReturnValueOnce(
      createQueryMock([{ _id: 'p1', name: 'Product 1', stock: 2 }])
    );
    vi.spyOn(Inventory, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          quantity: 4,
          productId: { _id: 'p2', name: 'Inventory Low Item', stock: 4, price: 499 },
        },
      ])
    );
    const resLow = await request(app)
      .get('/api/v1/admin/dashboard/low-stock?threshold=10')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resLow.status).toBe(200);
    expect(resLow.body.data).toHaveLength(2);
  });

  it('settleCodOrderOnDelivery should mark COD order paid, record Payment, and accrue VendorEarnings once', async () => {
    const codOrder = {
      _id: '507f1f77bcf86cd799439088',
      userId: customerId,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      isPaid: false,
      totalAmount: 1000,
      items: [{ vendorId: '507f1f77bcf86cd799439099', total: 1000 }],
    };

    vi.spyOn(Payment, 'findOne').mockResolvedValueOnce(null);
    const paymentCreateSpy = vi.spyOn(Payment, 'create').mockResolvedValueOnce({});
    const earningsSpy = vi.spyOn(VendorEarnings, 'findOneAndUpdate').mockResolvedValueOnce({});

    const settled = await settleCodOrderOnDelivery(codOrder);
    expect(settled).toBe(true);
    expect(codOrder.isPaid).toBe(true);
    expect(codOrder.paymentStatus).toBe('success');
    expect(paymentCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: 'cod', status: 'success', amount: 1000 })
    );
    expect(earningsSpy).toHaveBeenCalledTimes(1);

    // Calling again on already-paid order is a safe no-op
    const secondCall = await settleCodOrderOnDelivery(codOrder);
    expect(secondCall).toBe(false);
    expect(earningsSpy).toHaveBeenCalledTimes(1);
  });
});
