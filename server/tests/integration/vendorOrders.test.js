import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { Product } from '../../src/models/Product.model.js';
import { Order } from '../../src/models/Order.model.js';
import { Payment } from '../../src/models/Payment.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';
import { ROLES } from '../../src/constants/roles.constant.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.constant.js';

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

describe('Vendor Orders Management Service & Routes Integration Tests', () => {
  const vendorUserId = '507f1f77bcf86cd799439081';
  const vendorStoreId = '507f1f77bcf86cd799439082';
  const otherVendorId = '507f1f77bcf86cd799439099';
  const customerId = '507f1f77bcf86cd799439011';
  const orderId = '507f1f77bcf86cd799439083';

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

  it('enforces auth (401) and vendor role (403) on /api/v1/vendor/orders', async () => {
    const unauth = await request(app).get('/api/v1/vendor/orders');
    expect(unauth.status).toBe(401);

    mockAuthUser(ROLES.USER);
    const forbidden = await request(app)
      .get('/api/v1/vendor/orders')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('GET /api/v1/vendor/orders supports pagination, status normalization, customer search, summary counts, and vendorOrderTotal', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce({
      _id: vendorStoreId,
      userId: vendorUserId,
    });
    vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(User, 'find').mockReturnValueOnce(createQueryMock([{ _id: customerId }]));

    const findSpy = vi.spyOn(Order, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: orderId,
          orderNumber: '#SS-3001',
          userId: { _id: customerId, fullName: 'Riya Sharma', email: 'riya@example.com', phone: '9876543210' },
          orderStatus: ORDER_STATUS.OUT_FOR_DELIVERY,
          paymentMethod: 'razorpay',
          paymentStatus: 'success',
          isPaid: true,
          totalAmount: 4500,
          createdAt: new Date('2026-11-20T09:00:00Z'),
          items: [
            { vendorId: vendorStoreId, name: 'Silk Stole', price: 1200, quantity: 2, total: 2400 },
            { vendorId: otherVendorId, name: 'Other Item', price: 2100, quantity: 1, total: 2100 },
          ],
        },
      ])
    );
    vi.spyOn(Order, 'countDocuments').mockResolvedValueOnce(18);
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([
      { total: 22, pending: 4, processing: 5, shipped: 6, delivered: 5, cancelled: 2 },
    ]);

    const res = await request(app)
      .get('/api/v1/vendor/orders?page=2&limit=10&status=Out%20For%20Delivery&search=Riya')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].vendorOrderTotal).toBe(2400);
    expect(data.orders[0].items).toHaveLength(1);
    expect(data.orders[0].customer.fullName).toBe('Riya Sharma');
    expect(data.orders[0].customer.email).toBe('riya@example.com');
    expect(data.pagination).toEqual({
      total: 18,
      page: 2,
      limit: 10,
      totalPages: 2,
    });
    expect(data.summary.total).toBe(22);

    const appliedFilter = findSpy.mock.calls[0][0];
    expect(JSON.stringify(appliedFilter)).toContain('out_for_delivery');
  });

  it('GET /api/v1/vendor/orders/:orderId returns vendor-filtered items and hydrated payment details', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce({
      _id: vendorStoreId,
      userId: vendorUserId,
    });
    vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock([]));

    vi.spyOn(Order, 'findOne').mockReturnValueOnce(
      createQueryMock({
        _id: orderId,
        orderNumber: '#SS-3002',
        userId: { _id: customerId, fullName: 'Kabir Das', email: 'kabir@example.com' },
        orderStatus: ORDER_STATUS.PROCESSING,
        paymentMethod: 'upi',
        paymentStatus: 'success',
        totalAmount: 3000,
        items: [
          { vendorId: vendorStoreId, name: 'Linen Shirt', price: 1500, quantity: 1, total: 1500 },
          { vendorId: otherVendorId, name: 'Other Item', price: 1500, quantity: 1, total: 1500 },
        ],
      })
    );
    vi.spyOn(Payment, 'findOne').mockReturnValueOnce(
      createQueryMock({
        paymentMethod: 'upi',
        status: 'success',
        gatewayPaymentId: 'pay_987xyz',
      })
    );

    const res = await request(app)
      .get(`/api/v1/vendor/orders/${orderId}`)
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.vendorOrderTotal).toBe(1500);
    expect(res.body.data.payment.transactionId).toBe('pay_987xyz');
  });

  it('PATCH /api/v1/vendor/orders/:orderId/tracking updates shipment tracking, appends timeline, and notifies customer', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce({
      _id: vendorStoreId,
      userId: vendorUserId,
    });
    vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock([]));

    const mockOrder = {
      _id: orderId,
      orderNumber: '#SS-3003',
      userId: { _id: customerId, fullName: 'Arjun', email: 'arjun@example.com' },
      orderStatus: ORDER_STATUS.SHIPPED,
      items: [{ vendorId: vendorStoreId, name: 'Watch', price: 2499, quantity: 1, total: 2499 }],
      tracking: {},
      statusHistory: [],
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(Order, 'findOne').mockReturnValueOnce(createQueryMock(mockOrder));
    const notifySpy = vi.spyOn(notificationService, 'createNotification').mockResolvedValueOnce({});

    const res = await request(app)
      .patch(`/api/v1/vendor/orders/${orderId}/tracking`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        carrier: 'Delhivery',
        trackingNumber: 'DLV-123456',
        trackingUrl: 'https://track.example.com/DLV-123456',
      });

    expect(res.status).toBe(200);
    expect(mockOrder.tracking.carrier).toBe('Delhivery');
    expect(mockOrder.tracking.trackingNumber).toBe('DLV-123456');
    expect(mockOrder.statusHistory).toHaveLength(1);
    expect(notifySpy).toHaveBeenCalledTimes(1);
  });
});
