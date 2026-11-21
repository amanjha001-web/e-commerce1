import { describe, it, expect, vi, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Order } from '../../src/models/Order.model.js';
import { Payment } from '../../src/models/Payment.model.js';
import { Refund } from '../../src/models/Refund.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { VendorPayout } from '../../src/models/VendorPayout.model.js';
import { VendorEarnings } from '../../src/models/VendorEarnings.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import * as razorpayClient from '../../src/integrations/razorpay/razorpay.client.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';
import { ROLES } from '../../src/constants/roles.constant.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.constant.js';
import { PAYMENT_STATUS } from '../../src/constants/paymentStatus.constant.js';

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

describe('Admin Payments & Vendor Payouts Integration Tests', () => {
  const adminId = '65f100000000000000000001';
  const customerId = '65f100000000000000000002';
  const orderId = '65f300000000000000000011';
  const paymentId = '65f400000000000000000022';
  const vendorId = '65f700000000000000000055';
  const vendorUserId = '65f700000000000000000056';
  const payoutId = '65f800000000000000000066';

  const adminToken = generateAccessToken({ id: adminId, role: ROLES.ADMIN });
  const customerToken = generateAccessToken({ id: customerId, role: ROLES.USER });

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
      Object.defineProperty(mongoose.connection, 'readyState', originalReadyStateDescriptor);
    } else {
      delete mongoose.connection.readyState;
    }
  });

  const mockAuth = (role = ROLES.ADMIN) => {
    vi.spyOn(User, 'findById').mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({
        _id: role === ROLES.ADMIN ? adminId : customerId,
        fullName: role === ROLES.ADMIN ? 'Admin User' : 'Regular Customer',
        email: role === ROLES.ADMIN ? 'admin@shopsphere.com' : 'cust@example.com',
        role,
        isActive: true,
      }),
    });
  };

  it('enforces auth & admin role on /api/v1/admin/payments and /api/v1/admin/vendor-payouts', async () => {
    const unauth = await request(app).get('/api/v1/admin/payments');
    expect(unauth.status).toBe(401);

    mockAuth(ROLES.USER);
    const forbidden = await request(app)
      .get('/api/v1/admin/payments')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);

    mockAuth(ROLES.USER);
    const payoutForbidden = await request(app)
      .get('/api/v1/admin/vendor-payouts')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(payoutForbidden.status).toBe(403);
  });

  it('GET /api/v1/admin/payments resolves populated orderId without #SS-JECT], supports legacy refs, search, summary & pagination', async () => {
    setReadyState(1);
    mockAuth(ROLES.ADMIN);

    const docs = [
      {
        _id: paymentId,
        orderId: { _id: orderId, totalAmount: 550.5 }, // Populated object without orderNumber
        userId: { _id: customerId, fullName: 'Riya Sharma', email: 'riya@example.com' },
        paymentMethod: 'razorpay',
        amount: 550.5,
        status: 'pending',
        createdAt: new Date('2026-11-15T10:00:00Z'),
      },
      {
        _id: '65f400000000000000000023',
        order: '65f300000000000000000099', // Legacy order field
        user: customerId,
        method: 'upi',
        amount: 552,
        status: 'Paid',
        razorpayPaymentId: 'pay_TQ8ah3RqIe565d',
        createdAt: new Date('2026-08-15T10:00:00Z'),
      },
    ];

    const findSpy = vi.spyOn(Payment, 'find').mockReturnValueOnce(createQueryMock(docs));
    vi.spyOn(Payment, 'countDocuments').mockResolvedValueOnce(2);
    vi.spyOn(Payment, 'aggregate').mockResolvedValueOnce([
      { _id: 'paid', count: 1, amount: 552 },
      { _id: 'pending', count: 1, amount: 550.5 },
    ]);
    vi.spyOn(Order, 'find')
      // Search lookup
      .mockReturnValueOnce(createQueryMock([]))
      // Legacy relation order lookup
      .mockReturnValueOnce(
        createQueryMock([
          { _id: '65f300000000000000000099', orderNumber: 'ORD-OLD-552', totalAmount: 552 },
        ])
      );
    vi.spyOn(User, 'find')
      // Search lookup
      .mockReturnValueOnce(createQueryMock([]))
      // Legacy relation user lookup
      .mockReturnValueOnce(
        createQueryMock([{ _id: customerId, fullName: 'Legacy Riya', email: 'riya@old.com' }])
      );

    const res = await request(app)
      .get('/api/v1/admin/payments?search=TQ8ah&page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalled();
    expect(res.body.data.payments).toHaveLength(2);
    // Row 1 uses last 5 chars of ObjectId, NEVER "JECT]"
    expect(res.body.data.payments[0]).toMatchObject({
      orderNumber: `#SS-${orderId.slice(-5).toUpperCase()}`,
      customerName: 'Riya Sharma',
      paymentMethod: 'razorpay',
      status: 'pending',
    });
    expect(res.body.data.payments[0].orderNumber).not.toContain('JECT');
    // Row 2 resolves legacy order, method, user, and normalizes Paid -> success
    expect(res.body.data.payments[1]).toMatchObject({
      orderNumber: 'ORD-OLD-552',
      customerName: 'Legacy Riya',
      paymentMethod: 'upi',
      status: 'success',
      paymentCode: 'pay_TQ8ah3RqIe565d',
    });
    expect(res.body.data.summary).toMatchObject({
      total: 2,
      successCount: 1,
      pendingCount: 1,
      totalCollectedAmount: 552,
    });
  });

  it('GET /:paymentId validates ID, returns refundHistory, and POST /reconcile guards simulated stubs vs live gateway sync', async () => {
    mockAuth(ROLES.ADMIN);
    const badRes = await request(app)
      .get('/api/v1/admin/payments/bad-id')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(badRes.status).toBe(400);

    // Simulated gateway should not mark real pending payment as paid
    mockAuth(ROLES.ADMIN);
    const simPayment = {
      _id: paymentId,
      orderId,
      userId: customerId,
      amount: 999,
      status: PAYMENT_STATUS.PENDING,
      razorpayPaymentId: 'pay_sim_123',
      save: vi.fn(),
    };
    vi.spyOn(Payment, 'findById')
      .mockResolvedValueOnce(simPayment)
      .mockReturnValueOnce(createQueryMock(simPayment));
    vi.spyOn(razorpayClient, 'fetchRazorpayPayment').mockResolvedValueOnce({
      id: 'pay_sim_123',
      status: 'captured',
      isSimulated: true,
    });

    const simRes = await request(app)
      .post('/api/v1/admin/payments/reconcile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ paymentId });

    expect(simRes.status).toBe(200);
    expect(simRes.body.data.reconciled).toBe(false);
    expect(simRes.body.data.simulated).toBe(true);
    expect(simPayment.status).toBe(PAYMENT_STATUS.PENDING);
    expect(simPayment.save).not.toHaveBeenCalled();

    // Live gateway captured updates payment, syncs Order, and accrues earnings
    mockAuth(ROLES.ADMIN);
    const livePayment = {
      _id: paymentId,
      orderId,
      userId: customerId,
      amount: 1000,
      status: PAYMENT_STATUS.PENDING,
      razorpayPaymentId: 'pay_live_999',
      isVerified: false,
      save: vi.fn().mockResolvedValue(true),
    };
    const linkedOrder = {
      _id: orderId,
      orderNumber: 'ORD-LIVE-999',
      userId: customerId,
      orderStatus: ORDER_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      isPaid: false,
      items: [{ vendorId, total: 1000 }],
      statusHistory: [],
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(Payment, 'findById')
      .mockResolvedValueOnce(livePayment)
      .mockReturnValueOnce(createQueryMock({ ...livePayment, status: PAYMENT_STATUS.SUCCESS, isVerified: true }));
    vi.spyOn(razorpayClient, 'fetchRazorpayPayment').mockResolvedValueOnce({
      id: 'pay_live_999',
      status: 'captured',
    });
    vi.spyOn(Order, 'findById').mockResolvedValueOnce(linkedOrder);
    const earningsSpy = vi.spyOn(VendorEarnings, 'findOneAndUpdate').mockResolvedValue({});

    const liveRes = await request(app)
      .post(`/api/v1/admin/payments/${paymentId}/reconcile`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(liveRes.status).toBe(200);
    expect(liveRes.body.data.reconciled).toBe(true);
    expect(liveRes.body.data.updated).toBe(true);
    expect(livePayment.status).toBe(PAYMENT_STATUS.SUCCESS);
    expect(livePayment.isVerified).toBe(true);
    expect(linkedOrder.isPaid).toBe(true);
    expect(linkedOrder.orderStatus).toBe(ORDER_STATUS.CONFIRMED);
    expect(earningsSpy).toHaveBeenCalledTimes(1);
  });

  it('POST /api/v1/admin/payments/:paymentId/refund refunds via linked order including legacy payment.order', async () => {
    mockAuth(ROLES.ADMIN);

    const legacyPaymentDoc = {
      _id: paymentId,
      order: orderId,
      userId: customerId,
      amount: 1200,
      status: PAYMENT_STATUS.SUCCESS,
    };
    const orderDoc = {
      _id: orderId,
      orderNumber: 'ORD-PAY-500',
      userId: customerId,
      paymentMethod: 'cod',
      orderStatus: ORDER_STATUS.DELIVERED,
      paymentStatus: PAYMENT_STATUS.SUCCESS,
      isPaid: true,
      totalAmount: 1200,
      statusHistory: [],
      save: vi.fn().mockResolvedValue(true),
    };
    const paymentSaveDoc = {
      _id: paymentId,
      orderId,
      amount: 1200,
      status: PAYMENT_STATUS.SUCCESS,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Payment, 'findById').mockReturnValueOnce(createQueryMock(legacyPaymentDoc));
    vi.spyOn(Order, 'findById').mockResolvedValueOnce(orderDoc);
    vi.spyOn(Payment, 'findOne').mockReturnValueOnce({
      sort: vi.fn().mockResolvedValueOnce(paymentSaveDoc),
    });
    vi.spyOn(Refund, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(Refund, 'create').mockResolvedValueOnce({
      _id: '65f500000000000000000088',
      orderId,
      paymentId,
      userId: customerId,
      amount: 1200,
      reason: 'Damaged product',
      status: 'processed',
    });
    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const res = await request(app)
      .post(`/api/v1/admin/payments/${paymentId}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 1200, reason: 'Damaged product' });

    expect(res.status).toBe(200);
    expect(orderDoc.paymentStatus).toBe(PAYMENT_STATUS.REFUNDED);
    expect(paymentSaveDoc.status).toBe(PAYMENT_STATUS.REFUNDED);
  });

  it('Vendor Payouts: maps storeName/bankDetails, updates VendorEarnings once, and blocks double transitions', async () => {
    mockAuth(ROLES.ADMIN);

    const payoutRow = {
      _id: payoutId,
      vendorId: {
        _id: vendorId,
        shopName: 'Anew Electronics Stores',
        email: 'aman@vendor.com',
        businessDetails: {
          bankAccount: { bankName: 'SBI', accountNumber: '123456789012', ifscCode: 'SBIN0001234' },
        },
      },
      amount: 3500,
      status: 'PENDING',
      createdAt: new Date('2026-11-10T10:00:00Z'),
    };

    vi.spyOn(VendorPayout, 'find').mockReturnValueOnce(createQueryMock([payoutRow]));
    vi.spyOn(VendorPayout, 'countDocuments').mockResolvedValueOnce(1);

    const listRes = await request(app)
      .get('/api/v1/admin/vendor-payouts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.payouts[0]).toMatchObject({
      vendorName: 'Anew Electronics Stores',
      status: 'PENDING',
      bankDetails: expect.objectContaining({ bankName: 'SBI' }),
    });

    // Reject invalid status
    mockAuth(ROLES.ADMIN);
    vi.spyOn(VendorPayout, 'findById').mockResolvedValueOnce({
      _id: payoutId,
      vendorId,
      amount: 3500,
      status: 'PENDING',
    });
    const invalidRes = await request(app)
      .patch(`/api/v1/admin/vendor-payouts/${payoutId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'BOGUS' });
    expect(invalidRes.status).toBe(400);

    // Mark PENDING -> PAID updates VendorEarnings cleanly
    mockAuth(ROLES.ADMIN);
    const mutablePayout = {
      _id: payoutId,
      vendorId,
      amount: 3500,
      status: 'PENDING',
      save: vi.fn().mockResolvedValue(true),
    };
    const earningsDoc = {
      vendorId,
      availableBalance: 2000,
      pendingBalance: 3500,
      totalWithdrawn: 1000,
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(VendorPayout, 'findById')
      .mockResolvedValueOnce(mutablePayout)
      .mockReturnValueOnce(
        createQueryMock({
          ...mutablePayout,
          status: 'PAID',
          transactionReference: 'UTR123456',
          vendorId: payoutRow.vendorId,
        })
      );
    vi.spyOn(VendorEarnings, 'findOne').mockResolvedValueOnce(earningsDoc);
    vi.spyOn(Vendor, 'findById').mockReturnValueOnce(
      createQueryMock({ _id: vendorId, userId: vendorUserId, storeName: 'Anew Electronics Stores' })
    );
    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const paidRes = await request(app)
      .patch(`/api/v1/admin/vendor-payouts/${payoutId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PAID', transactionReference: 'UTR123456' });

    expect(paidRes.status).toBe(200);
    expect(mutablePayout.status).toBe('PAID');
    expect(mutablePayout.transactionReference).toBe('UTR123456');
    expect(earningsDoc.pendingBalance).toBe(0);
    expect(earningsDoc.totalWithdrawn).toBe(4500);
    expect(paidRes.body.data.vendorName).toBe('Anew Electronics Stores');

    // Prevent changing already PAID payout to REJECTED (prevents double balance credit)
    mockAuth(ROLES.ADMIN);
    vi.spyOn(VendorPayout, 'findById').mockResolvedValueOnce({
      _id: payoutId,
      vendorId,
      amount: 3500,
      status: 'PAID',
    });
    const doubleCreditRes = await request(app)
      .patch(`/api/v1/admin/vendor-payouts/${payoutId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'REJECTED' });

    expect(doubleCreditRes.status).toBe(400);
    expect(doubleCreditRes.body.message).toMatch(/PAID/i);
  });
});
