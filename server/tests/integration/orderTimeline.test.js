import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { Order } from '../../src/models/Order.model.js';
import { Payment } from '../../src/models/Payment.model.js';
import { VendorEarnings } from '../../src/models/VendorEarnings.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';
import { ROLES } from '../../src/constants/roles.constant.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.constant.js';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../../src/constants/paymentStatus.constant.js';

describe('Order Status & Timeline Synchronization Integration Tests', () => {
  const adminId = '507f1f77bcf86cd799439012';
  const vendorUserId = '507f1f77bcf86cd799439013';
  const vendorProfileId = '507f1f77bcf86cd799439014';
  const customerId = '507f1f77bcf86cd799439011';
  const orderId = '507f1f77bcf86cd799439055';

  const adminToken = generateAccessToken({ id: adminId, role: ROLES.ADMIN });
  const vendorToken = generateAccessToken({ id: vendorUserId, role: ROLES.VENDOR });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAuth = (role, id) => {
    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: id,
        name: role === ROLES.ADMIN ? 'Admin User' : 'Vendor User',
        role,
        isActive: true,
      }),
    });
  };

  it('PATCH /api/v1/admin/orders/:orderId/status normalizes status strings, appends statusHistory, and notifies customer', async () => {
    mockAuth(ROLES.ADMIN, adminId);

    const mockOrder = {
      _id: orderId,
      orderNumber: 'ORD-1001',
      userId: customerId,
      orderStatus: ORDER_STATUS.PENDING,
      statusHistory: [{ status: ORDER_STATUS.PENDING, note: 'Order placed', timestamp: new Date() }],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder);
    const notifySpy = vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const res1 = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Shipped', note: 'Dispatched from hub' });

    expect(res1.status).toBe(200);
    expect(mockOrder.orderStatus).toBe(ORDER_STATUS.SHIPPED);
    expect(mockOrder.statusHistory).toHaveLength(2);
    expect(mockOrder.statusHistory[1]).toMatchObject({
      status: ORDER_STATUS.SHIPPED,
      note: 'Dispatched from hub',
      updatedBy: adminId,
    });

    const res2 = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Out For Delivery' });

    expect(res2.status).toBe(200);
    expect(mockOrder.orderStatus).toBe(ORDER_STATUS.OUT_FOR_DELIVERY);
    expect(mockOrder.statusHistory).toHaveLength(3);
    expect(mockOrder.statusHistory[2].status).toBe(ORDER_STATUS.OUT_FOR_DELIVERY);
    expect(notifySpy).toHaveBeenCalledTimes(2);
  });

  it('PATCH /api/v1/admin/orders/:orderId/status rejects invalid statuses with 400', async () => {
    mockAuth(ROLES.ADMIN, adminId);

    const mockOrder = {
      _id: orderId,
      orderNumber: 'ORD-1001',
      userId: customerId,
      orderStatus: ORDER_STATUS.PENDING,
      statusHistory: [],
      save: vi.fn(),
    };

    vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

    const res = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'NotARealStatus' });

    expect(res.status).toBe(400);
    expect(mockOrder.save).not.toHaveBeenCalled();
    expect(mockOrder.statusHistory).toHaveLength(0);
  });

  it('PATCH /api/v1/admin/orders/:orderId/shipping maps courierPartner/expectedDeliveryDate, sets shipped, and pushes statusHistory', async () => {
    mockAuth(ROLES.ADMIN, adminId);

    const mockOrder = {
      _id: orderId,
      orderNumber: 'ORD-1002',
      userId: customerId,
      orderStatus: ORDER_STATUS.PROCESSING,
      tracking: {},
      statusHistory: [
        { status: ORDER_STATUS.PENDING, note: 'Order placed', timestamp: new Date() },
      ],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder);
    const notifySpy = vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const res = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/shipping`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        trackingNumber: 'TRK-998877',
        courierPartner: 'BlueDart',
        expectedDeliveryDate: '2026-11-25',
      });

    expect(res.status).toBe(200);
    expect(mockOrder.orderStatus).toBe(ORDER_STATUS.SHIPPED);
    expect(mockOrder.tracking).toEqual({
      carrier: 'BlueDart',
      trackingNumber: 'TRK-998877',
      trackingUrl: undefined,
      estimatedDeliveryDate: '2026-11-25',
    });
    expect(mockOrder.statusHistory).toHaveLength(2);
    expect(mockOrder.statusHistory[1]).toMatchObject({
      status: ORDER_STATUS.SHIPPED,
      updatedBy: adminId,
    });
    expect(mockOrder.statusHistory[1].note).toContain('BlueDart');
    expect(mockOrder.statusHistory[1].note).toContain('TRK-998877');
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Order Shipped',
        data: expect.objectContaining({ status: ORDER_STATUS.SHIPPED }),
      })
    );
  });

  it('PATCH /api/v1/vendor/orders/:orderId/status appends timeline entries and settles COD payment on delivered', async () => {
    mockAuth(ROLES.VENDOR, vendorUserId);

    vi.spyOn(Vendor, 'findOne').mockResolvedValue({ _id: vendorProfileId, userId: vendorUserId });

    const mockOrder = {
      _id: orderId,
      orderNumber: 'ORD-1003',
      userId: customerId,
      orderStatus: ORDER_STATUS.SHIPPED,
      paymentMethod: PAYMENT_METHODS.COD,
      paymentStatus: PAYMENT_STATUS.PENDING,
      isPaid: false,
      totalAmount: 1500,
      items: [{ vendorId: vendorProfileId, total: 1500 }],
      statusHistory: [
        { status: ORDER_STATUS.PENDING, note: 'Order placed', timestamp: new Date() },
        { status: ORDER_STATUS.SHIPPED, note: 'Shipped', timestamp: new Date() },
      ],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Order, 'findOne').mockResolvedValue(mockOrder);
    vi.spyOn(Payment, 'findOne').mockResolvedValue(null);
    const paymentCreateSpy = vi.spyOn(Payment, 'create').mockResolvedValue({ _id: 'pay1' });
    const earningsSpy = vi.spyOn(VendorEarnings, 'findOneAndUpdate').mockResolvedValue({});
    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const res = await request(app)
      .patch(`/api/v1/vendor/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: 'Delivered', note: 'Handed to customer' });

    expect(res.status).toBe(200);
    expect(mockOrder.orderStatus).toBe(ORDER_STATUS.DELIVERED);
    expect(mockOrder.isDelivered).toBe(true);
    expect(mockOrder.isPaid).toBe(true);
    expect(mockOrder.statusHistory).toHaveLength(3);
    expect(mockOrder.statusHistory[2]).toMatchObject({
      status: ORDER_STATUS.DELIVERED,
      note: 'Handed to customer',
      updatedBy: vendorUserId,
    });
    expect(paymentCreateSpy).toHaveBeenCalledTimes(1);
    expect(earningsSpy).toHaveBeenCalledTimes(1);
  });
});
