import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Order } from '../../src/models/Order.model.js';
import { Payment } from '../../src/models/Payment.model.js';
import { Refund } from '../../src/models/Refund.model.js';
import { ReturnRequest } from '../../src/models/ReturnRequest.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.constant.js';
import { PAYMENT_STATUS } from '../../src/constants/paymentStatus.constant.js';

const ADMIN_ID = '65f100000000000000000001';
const USER_ID = '65f100000000000000000002';
const ORDER_ID = '65f300000000000000000011';
const PAYMENT_ID = '65f400000000000000000022';
const REFUND_ID = '65f500000000000000000033';
const RETURN_ID = '65f600000000000000000044';

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

describe('Admin Refunds & Returns Management API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires authentication and admin role on /api/v1/admin/refunds', async () => {
    const unauthRes = await request(app).get('/api/v1/admin/refunds');
    expect(unauthRes.status).toBe(401);

    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: USER_ID,
        role: 'user',
        isActive: true,
        name: 'Regular Customer',
      }),
    });
    const userToken = generateAccessToken({ id: USER_ID, role: 'user' });

    const forbiddenRes = await request(app)
      .get('/api/v1/admin/refunds')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbiddenRes.status).toBe(403);
  });

  it('lists formatted refunds on /api/v1/admin/refunds and /api/v1/admin/orders/refunds with filters', async () => {
    const token = mockAdminAuth();
    const refundDoc = {
      _id: REFUND_ID,
      orderId: {
        _id: ORDER_ID,
        orderNumber: 'ORD-5001',
        totalAmount: 1499,
        orderStatus: ORDER_STATUS.DELIVERED,
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        paymentMethod: 'razorpay',
        isPaid: true,
      },
      userId: {
        _id: USER_ID,
        fullName: 'Riya Sharma',
        email: 'riya@example.com',
        phone: '9876543210',
      },
      paymentId: {
        _id: PAYMENT_ID,
        paymentMethod: 'razorpay',
        status: PAYMENT_STATUS.SUCCESS,
      },
      amount: 1499,
      reason: 'Damaged packaging',
      status: 'pending',
      createdAt: new Date('2026-11-20T08:00:00Z'),
    };

    const findSpy = vi
      .spyOn(Refund, 'find')
      .mockReturnValue(createQueryMock([refundDoc]));
    vi.spyOn(Refund, 'countDocuments').mockResolvedValue(1);

    const res = await request(app)
      .get('/api/v1/admin/refunds?status=pending&search=Damaged&page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: { $in: ['pending', 'requested'] },
        $or: expect.any(Array),
      })
    );
    expect(res.body.data.refunds).toHaveLength(1);
    expect(res.body.data.refunds[0]).toMatchObject({
      _id: REFUND_ID,
      orderNumber: 'ORD-5001',
      customerName: 'Riya Sharma',
      customerEmail: 'riya@example.com',
      amount: 1499,
      status: 'pending',
    });
    expect(res.body.data.summary.pending).toBe(1);
    expect(res.body.data.pagination).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const aliasRes = await request(app)
      .get('/api/v1/admin/orders/refunds')
      .set('Authorization', `Bearer ${token}`);
    expect(aliasRes.status).toBe(200);
    expect(aliasRes.body.data.refunds).toHaveLength(1);
  });

  it('creates manual refund by orderNumber via POST /api/v1/admin/refunds', async () => {
    const token = mockAdminAuth();

    vi.spyOn(Order, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: ORDER_ID, orderNumber: 'ORD-5001' })
    );
    const orderDoc = {
      _id: ORDER_ID,
      orderNumber: 'ORD-5001',
      userId: USER_ID,
      paymentMethod: 'cod',
      orderStatus: ORDER_STATUS.DELIVERED,
      paymentStatus: PAYMENT_STATUS.SUCCESS,
      isPaid: true,
      totalAmount: 1499,
      statusHistory: [],
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(Order, 'findById').mockResolvedValueOnce(orderDoc);
    const paymentDoc = {
      _id: PAYMENT_ID,
      orderId: ORDER_ID,
      amount: 1499,
      status: PAYMENT_STATUS.SUCCESS,
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(Payment, 'findOne').mockReturnValueOnce({
      sort: vi.fn().mockResolvedValueOnce(paymentDoc),
    });
    vi.spyOn(Refund, 'aggregate').mockResolvedValueOnce([]);
    const createdRefund = {
      _id: REFUND_ID,
      orderId: ORDER_ID,
      paymentId: PAYMENT_ID,
      userId: USER_ID,
      amount: 1499,
      reason: 'Wrong item sent',
      status: 'processed',
    };
    vi.spyOn(Refund, 'create').mockResolvedValueOnce(createdRefund);
    vi.spyOn(Refund, 'findById').mockReturnValueOnce(createQueryMock(createdRefund));
    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const res = await request(app)
      .post('/api/v1/admin/refunds')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: '#ORD-5001', reason: 'Wrong item sent' });

    expect(res.status).toBe(201);
    expect(orderDoc.orderStatus).toBe(ORDER_STATUS.REFUNDED);
    expect(orderDoc.paymentStatus).toBe(PAYMENT_STATUS.REFUNDED);
    expect(paymentDoc.status).toBe(PAYMENT_STATUS.REFUNDED);
    expect(res.body.data.isFullRefund).toBe(true);
  });

  it('approves and rejects refund requests cleanly while guarding against processed refunds', async () => {
    const token = mockAdminAuth();

    const pendingRefund = {
      _id: REFUND_ID,
      orderId: ORDER_ID,
      paymentId: PAYMENT_ID,
      userId: USER_ID,
      amount: 1200,
      reason: 'Defective piece',
      status: 'pending',
      save: vi.fn().mockResolvedValue(true),
    };
    const orderDoc = {
      _id: ORDER_ID,
      orderNumber: 'ORD-5002',
      userId: USER_ID,
      paymentMethod: 'cod',
      orderStatus: ORDER_STATUS.DELIVERED,
      paymentStatus: PAYMENT_STATUS.SUCCESS,
      isPaid: true,
      totalAmount: 1200,
      statusHistory: [],
      save: vi.fn().mockResolvedValue(true),
    };
    const paymentDoc = {
      _id: PAYMENT_ID,
      orderId: ORDER_ID,
      amount: 1200,
      status: PAYMENT_STATUS.SUCCESS,
      save: vi.fn().mockResolvedValue(true),
    };

    const refundFindByIdSpy = vi
      .spyOn(Refund, 'findById')
      .mockReturnValueOnce(createQueryMock(pendingRefund))
      .mockReturnValueOnce(createQueryMock(pendingRefund))
      .mockReturnValueOnce(createQueryMock({ ...pendingRefund, status: 'processed' }));
    const orderFindByIdSpy = vi
      .spyOn(Order, 'findById')
      .mockResolvedValueOnce(orderDoc);
    vi.spyOn(Payment, 'findOne').mockReturnValueOnce({
      sort: vi.fn().mockResolvedValueOnce(paymentDoc),
    });
    vi.spyOn(Refund, 'aggregate').mockResolvedValueOnce([]);
    const notifySpy = vi
      .spyOn(notificationService, 'createNotification')
      .mockResolvedValue({});

    const approveRes = await request(app)
      .patch(`/api/v1/admin/refunds/${REFUND_ID}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ adminNotes: 'Verified photo proof' });

    expect(approveRes.status).toBe(200);
    expect(pendingRefund.status).toBe('processed');
    expect(pendingRefund.adminNotes).toBe('Verified photo proof');
    expect(orderDoc.orderStatus).toBe(ORDER_STATUS.REFUNDED);
    expect(orderDoc.paymentStatus).toBe(PAYMENT_STATUS.REFUNDED);

    // Processed refund cannot be rejected afterwards
    refundFindByIdSpy.mockReturnValueOnce(
      createQueryMock({ _id: REFUND_ID, status: 'processed' })
    );
    const badRejectRes = await request(app)
      .patch(`/api/v1/admin/refunds/${REFUND_ID}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Too late' });
    expect(badRejectRes.status).toBe(400);

    // Rejecting a pending refund updates Refund status, Order statusHistory, and notifies customer
    const rejectableRefund = {
      _id: REFUND_ID,
      orderId: ORDER_ID,
      userId: USER_ID,
      amount: 500,
      status: 'pending',
      save: vi.fn().mockResolvedValue(true),
    };
    const activeOrder = {
      _id: ORDER_ID,
      orderNumber: 'ORD-5003',
      orderStatus: ORDER_STATUS.DELIVERED,
      statusHistory: [],
      save: vi.fn().mockResolvedValue(true),
    };
    refundFindByIdSpy
      .mockReturnValueOnce(createQueryMock(rejectableRefund))
      .mockReturnValueOnce(
        createQueryMock({
          ...rejectableRefund,
          status: 'rejected',
          rejectionReason: 'Outside 7-day window',
        })
      );
    orderFindByIdSpy.mockResolvedValueOnce(activeOrder);

    const rejectRes = await request(app)
      .patch(`/api/v1/admin/refunds/${REFUND_ID}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Outside 7-day window' });

    expect(rejectRes.status).toBe(200);
    expect(rejectableRefund.status).toBe('rejected');
    expect(rejectableRefund.rejectionReason).toBe('Outside 7-day window');
    expect(activeOrder.statusHistory).toHaveLength(1);
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Refund Request Rejected' })
    );
  });

  it('lists, approves, and rejects customer return requests under /api/v1/admin/refunds/returns', async () => {
    const token = mockAdminAuth();

    const returnDoc = {
      _id: RETURN_ID,
      orderId: {
        _id: ORDER_ID,
        orderNumber: 'ORD-6001',
        totalAmount: 999,
        orderStatus: ORDER_STATUS.RETURN_REQUESTED,
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        paymentMethod: 'cod',
        isPaid: true,
      },
      userId: {
        _id: USER_ID,
        fullName: 'Kabir Das',
        email: 'kabir@example.com',
      },
      reason: 'Size mismatch',
      status: 'pending',
    };

    vi.spyOn(ReturnRequest, 'find').mockReturnValueOnce(createQueryMock([returnDoc]));
    vi.spyOn(ReturnRequest, 'countDocuments').mockResolvedValueOnce(1);

    const listRes = await request(app)
      .get('/api/v1/admin/refunds/returns?status=pending')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.returns).toHaveLength(1);
    expect(listRes.body.data.returns[0]).toMatchObject({
      _id: RETURN_ID,
      orderNumber: 'ORD-6001',
      customerName: 'Kabir Das',
      amount: 999,
      status: 'pending',
    });

    const mutableReturn = {
      _id: RETURN_ID,
      orderId: ORDER_ID,
      userId: USER_ID,
      reason: 'Size mismatch',
      status: 'pending',
      save: vi.fn().mockResolvedValue(true),
    };
    const orderDoc = {
      _id: ORDER_ID,
      orderNumber: 'ORD-6001',
      userId: USER_ID,
      orderStatus: ORDER_STATUS.RETURN_REQUESTED,
      returnRequest: { status: 'requested' },
      statusHistory: [],
      save: vi.fn().mockResolvedValue(true),
    };

    const retFindByIdSpy = vi
      .spyOn(ReturnRequest, 'findById')
      .mockReturnValueOnce(createQueryMock(mutableReturn))
      .mockReturnValueOnce(createQueryMock({ ...mutableReturn, status: 'approved' }));
    const orderFindByIdSpy = vi
      .spyOn(Order, 'findById')
      .mockResolvedValueOnce(orderDoc);
    const retUpdateManySpy = vi
      .spyOn(ReturnRequest, 'updateMany')
      .mockResolvedValue({ modifiedCount: 1 });
    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const approveRes = await request(app)
      .patch(`/api/v1/admin/refunds/returns/${RETURN_ID}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ adminNotes: 'Pickup scheduled' });

    expect(approveRes.status).toBe(200);
    expect(mutableReturn.status).toBe('approved');
    expect(orderDoc.orderStatus).toBe(ORDER_STATUS.RETURN_APPROVED);
    expect(retUpdateManySpy).toHaveBeenCalled();

    const rejectableReturn = {
      _id: RETURN_ID,
      orderId: ORDER_ID,
      userId: USER_ID,
      reason: 'Changed mind',
      status: 'pending',
      save: vi.fn().mockResolvedValue(true),
    };
    retFindByIdSpy
      .mockReturnValueOnce(createQueryMock(rejectableReturn))
      .mockReturnValueOnce(createQueryMock({ ...rejectableReturn, status: 'rejected' }));
    orderFindByIdSpy.mockResolvedValueOnce({ ...orderDoc, save: vi.fn().mockResolvedValue(true) });

    const rejectRes = await request(app)
      .patch(`/api/v1/admin/refunds/returns/${RETURN_ID}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Tag removed' });

    expect(rejectRes.status).toBe(200);
    expect(rejectableReturn.status).toBe('rejected');
    expect(rejectableReturn.adminNotes).toBe('Tag removed');
  });
});
