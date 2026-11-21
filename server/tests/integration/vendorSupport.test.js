import { describe, it, expect, vi, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { Order } from '../../src/models/Order.model.js';
import { SupportTicket } from '../../src/models/SupportTicket.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import { adminSupportService } from '../../src/services/admin/support.service.js';
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

describe('Vendor Support Tickets Service & Routes Integration Tests', () => {
  const vendorUserId = '507f1f77bcf86cd799439301';
  const vendorStoreId = '507f1f77bcf86cd799439302';
  const adminUserId = '507f1f77bcf86cd799439303';
  const customerId = '507f1f77bcf86cd799439011';
  const ticketObjectId = '507f1f77bcf86cd799439388';
  const ownedOrderId = '507f1f77bcf86cd799439355';
  const foreignOrderId = '507f1f77bcf86cd799439366';

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
        fullName: isVendor ? 'Mainboard Seller' : 'Customer User',
        role,
        isActive: true,
      }),
    });
  };

  it('enforces authentication (401) and vendor role (403) on /api/v1/vendor/support/tickets', async () => {
    const unauth = await request(app).get('/api/v1/vendor/support/tickets');
    expect(unauth.status).toBe(401);

    mockAuthUser(ROLES.USER);
    const forbidden = await request(app)
      .post('/api/v1/vendor/support/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subject: 'Payout delay', message: 'Check payout' });
    expect(forbidden.status).toBe(403);
  });

  it('GET /api/v1/vendor/support/tickets returns scoped summary, filters cleanly, and strips internalNotes', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: vendorStoreId, userId: vendorUserId, storeName: 'Mainboard' })
    );

    const sampleTickets = [
      {
        _id: ticketObjectId,
        ticketId: 'TCK-778899',
        userId: vendorUserId,
        vendorId: vendorStoreId,
        requesterRole: 'vendor',
        subject: 'Payout cycle inquiry',
        description: 'Need UTR number for last payout',
        category: 'payout',
        priority: 'high',
        status: 'waiting_customer',
        internalNotes: [{ note: 'Private admin-only finance remark' }],
        messages: [],
        createdAt: new Date(),
      },
    ];

    const findSpy = vi
      .spyOn(SupportTicket, 'find')
      .mockReturnValueOnce(createQueryMock(sampleTickets));
    vi.spyOn(SupportTicket, 'countDocuments')
      .mockResolvedValueOnce(1) // filtered total
      .mockResolvedValueOnce(5) // allTotal
      .mockResolvedValueOnce(1) // open
      .mockResolvedValueOnce(1) // pending
      .mockResolvedValueOnce(1) // in_progress
      .mockResolvedValueOnce(1) // waiting_for_customer
      .mockResolvedValueOnce(1) // resolved
      .mockResolvedValueOnce(0); // closed

    const res = await request(app)
      .get('/api/v1/vendor/support/tickets?status=waiting_for_customer&category=payout&priority=high&search=UTR')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tickets).toHaveLength(1);
    expect(res.body.data.tickets[0].status).toBe('waiting_for_customer');
    expect(res.body.data.tickets[0].internalNotes).toBeUndefined();
    expect(res.body.data.tickets[0].messages).toHaveLength(1);
    expect(res.body.data.tickets[0].messages[0].message).toContain('UTR number');
    expect(res.body.data.summary).toEqual(
      expect.objectContaining({
        total: 5,
        open: 1,
        waitingForReply: 1,
        active: 4,
        resolved: 1,
      })
    );
    expect(findSpy).toHaveBeenCalledTimes(1);
  });

  it('POST /api/v1/vendor/support/tickets validates fields, links vendor order, and sends /vendor/support notification', async () => {
    // 1. Rejects short subject (400)
    mockAuthUser(ROLES.VENDOR);
    const badSubject = await request(app)
      .post('/api/v1/vendor/support/tickets')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ subject: 'Hi', message: 'Valid body' });
    expect(badSubject.status).toBe(400);

    // 2. Rejects foreign explicit orderId (403)
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: vendorStoreId, userId: vendorUserId, storeName: 'Mainboard' })
    );
    vi.spyOn(Order, 'findOne').mockReturnValueOnce(
      createQueryMock({
        _id: foreignOrderId,
        orderNumber: 'SS-99999',
        items: [{ vendorId: new mongoose.Types.ObjectId().toString() }],
      })
    );
    const forbiddenOrder = await request(app)
      .post('/api/v1/vendor/support/tickets')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        subject: 'Foreign order dispute',
        message: 'Checking access guard',
        orderId: foreignOrderId,
      });
    expect(forbiddenOrder.status).toBe(403);

    // 3. Valid vendor ticket creation with orderNumber & payout alias
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: vendorStoreId, userId: vendorUserId, storeName: 'Mainboard' })
    );
    vi.spyOn(Order, 'findOne').mockReturnValueOnce(
      createQueryMock({
        _id: ownedOrderId,
        orderNumber: 'SS-10482',
        items: [{ vendorId: vendorStoreId }],
      })
    );

    const createdDoc = {
      _id: ticketObjectId,
      ticketId: 'TCK-555111',
      userId: vendorUserId,
      vendorId: vendorStoreId,
      vendorStoreName: 'Mainboard',
      requesterRole: 'vendor',
      subject: 'Settlement pending for order',
      category: 'payout',
      priority: 'urgent',
      orderId: ownedOrderId,
      orderNumber: 'SS-10482',
      status: 'open',
      messages: [{ sender: vendorUserId, message: 'Please verify settlement' }],
      internalNotes: [{ note: 'Internal flag' }],
      populate: vi.fn().mockResolvedValue(true),
    };
    const createSpy = vi.spyOn(SupportTicket, 'create').mockResolvedValueOnce(createdDoc);
    const notifSpy = vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});
    const adminNotifSpy = vi.spyOn(notificationService, 'notifyAdmins').mockResolvedValue([]);

    const okRes = await request(app)
      .post('/api/v1/vendor/support/tickets')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        subject: '  Settlement pending for order  ',
        category: 'Payouts',
        priority: 'URGENT',
        orderNumber: '#SS-10482',
        message: 'Please verify settlement',
      });

    expect(okRes.status).toBe(201);
    expect(okRes.body.success).toBe(true);
    expect(okRes.body.data.internalNotes).toBeUndefined();
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorId: vendorStoreId,
        vendorStoreName: 'Mainboard',
        requesterRole: 'vendor',
        category: 'payout',
        priority: 'urgent',
        orderId: ownedOrderId,
        orderNumber: 'SS-10482',
      })
    );
    expect(notifSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: vendorUserId,
        link: '/vendor/support',
      })
    );
    expect(adminNotifSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        link: '/admin/support',
      })
    );
  });

  it('POST messages handles waiting_for_customer transition, closed guard, and close/reopen routes', async () => {
    // 1. Closed guard -> 400
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: vendorStoreId, userId: vendorUserId })
    );
    vi.spyOn(SupportTicket, 'findOne').mockResolvedValueOnce({
      _id: ticketObjectId,
      ticketId: 'TCK-closed',
      userId: vendorUserId,
      status: 'closed',
      messages: [],
    });

    const closedReply = await request(app)
      .post(`/api/v1/vendor/support/tickets/${ticketObjectId}/messages`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ message: 'Follow up' });
    expect(closedReply.status).toBe(400);

    // 2. Waiting -> open + notify assigned agent
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: vendorStoreId, userId: vendorUserId })
    );
    const saveMock = vi.fn().mockResolvedValue(true);
    const ticketDoc = {
      _id: ticketObjectId,
      ticketId: 'TCK-555111',
      userId: vendorUserId,
      assignedTo: adminUserId,
      subject: 'Settlement pending',
      status: 'waiting_for_customer',
      messages: [],
      internalNotes: [{ note: 'Secret' }],
      save: saveMock,
      populate: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(SupportTicket, 'findOne').mockResolvedValueOnce(ticketDoc);
    const notifSpy = vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const replyRes = await request(app)
      .post(`/api/v1/vendor/support/tickets/${ticketObjectId}/messages`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ message: 'Uploaded bank statement' });

    expect(replyRes.status).toBe(200);
    expect(ticketDoc.status).toBe('open');
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(replyRes.body.data.internalNotes).toBeUndefined();
    expect(notifSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: adminUserId,
        link: '/admin/support',
      })
    );

    // 3. Close & Reopen
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: vendorStoreId, userId: vendorUserId })
    );
    vi.spyOn(SupportTicket, 'findOneAndUpdate').mockReturnValueOnce(
      createQueryMock({
        _id: ticketObjectId,
        status: 'closed',
        internalNotes: [{ note: 'Secret' }],
      })
    );
    const closeRes = await request(app)
      .patch(`/api/v1/vendor/support/tickets/${ticketObjectId}/close`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.status).toBe('closed');
    expect(closeRes.body.data.internalNotes).toBeUndefined();

    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: vendorStoreId, userId: vendorUserId })
    );
    vi.spyOn(SupportTicket, 'findOneAndUpdate').mockReturnValueOnce(
      createQueryMock({
        _id: ticketObjectId,
        status: 'open',
        resolvedAt: null,
      })
    );
    const reopenRes = await request(app)
      .patch(`/api/v1/vendor/support/tickets/${ticketObjectId}/reopen`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(reopenRes.status).toBe(200);
    expect(reopenRes.body.data.status).toBe('open');
  });

  it('adminSupportService.replyToSupportTicket routes notifications to /vendor/support for vendor tickets', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    vi.spyOn(SupportTicket, 'findOne')
      .mockResolvedValueOnce({
        _id: ticketObjectId,
        ticketId: 'TCK-900',
        userId: vendorUserId,
        vendorId: vendorStoreId,
        requesterRole: 'vendor',
        subject: 'Seller GST verification',
        status: 'open',
        messages: [],
        save: saveMock,
      })
      .mockReturnValueOnce(
        createQueryMock({
          _id: ticketObjectId,
          ticketId: 'TCK-900',
          userId: { _id: vendorUserId, fullName: 'Mainboard Seller', email: 'seller@example.com' },
          vendorId: vendorStoreId,
          requesterRole: 'vendor',
          status: 'in_progress',
          messages: [{ sender: adminUserId, message: 'Verified cleanly' }],
        })
      );
    const notifSpy = vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const res = await adminSupportService.replyToSupportTicket(
      ticketObjectId,
      'Verified cleanly',
      adminUserId
    );

    expect(res.requesterRole).toBe('vendor');
    expect(notifSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: vendorUserId,
        link: '/vendor/support',
      })
    );
  });

  it('auto-heals stale unique indexes (e.g. ticketNumber_1 / userId_1) and ticketId collisions on 11000 during createTicket', async () => {
    // 1. Stale ticketNumber_1 / userId_1 unique index causing 11000 -> dropped & retried
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: vendorStoreId, userId: vendorUserId, storeName: 'Mainboard' })
    );

    const dropIndexMock = vi.fn().mockResolvedValue(true);
    const indexesMock = vi.fn().mockResolvedValue([
      { name: '_id_', key: { _id: 1 }, unique: true },
      { name: 'ticketId_1', key: { ticketId: 1 }, unique: true },
      { name: 'ticketNumber_1', key: { ticketNumber: 1 }, unique: true },
      { name: 'userId_1', key: { userId: 1 }, unique: true },
    ]);
    const updateManyMock = vi.fn().mockResolvedValue({ modifiedCount: 1 });

    vi.spyOn(SupportTicket, 'collection', 'get').mockReturnValue({
      indexes: indexesMock,
      dropIndex: dropIndexMock,
      updateMany: updateManyMock,
    });

    const dupLegacyErr = Object.assign(
      new Error('E11000 duplicate key error collection: test.supporttickets index: ticketNumber_1 dup key: { ticketNumber: null }'),
      { code: 11000, keyPattern: { ticketNumber: 1 }, keyValue: { ticketNumber: null } }
    );
    const createdAfterHeal = {
      _id: ticketObjectId,
      ticketId: 'TCK-HEALED-1',
      userId: vendorUserId,
      vendorId: vendorStoreId,
      requesterRole: 'vendor',
      subject: 'Inventory sync issue',
      category: 'product',
      priority: 'medium',
      status: 'open',
      messages: [{ sender: vendorUserId, message: 'Cannot sync SKU' }],
      populate: vi.fn().mockResolvedValue(true),
    };

    const createSpy = vi
      .spyOn(SupportTicket, 'create')
      .mockRejectedValueOnce(dupLegacyErr)
      .mockResolvedValueOnce(createdAfterHeal);
    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});
    vi.spyOn(notificationService, 'notifyAdmins').mockResolvedValue([]);

    const healRes = await request(app)
      .post('/api/v1/vendor/support/tickets')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        subject: 'Inventory sync issue',
        category: 'product',
        message: 'Cannot sync SKU',
      });

    expect(healRes.status).toBe(201);
    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(dropIndexMock).toHaveBeenCalledWith('ticketNumber_1');
    expect(dropIndexMock).toHaveBeenCalledWith('userId_1');
    expect(dropIndexMock).not.toHaveBeenCalledWith('ticketId_1');
    expect(dropIndexMock).not.toHaveBeenCalledWith('_id_');

    // 2. ticketId collision regenerates a new ticketId and succeeds on retry
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockReturnValueOnce(
      createQueryMock({ _id: vendorStoreId, userId: vendorUserId, storeName: 'Mainboard' })
    );
    vi.spyOn(SupportTicket, 'collection', 'get').mockReturnValue({
      indexes: vi.fn().mockResolvedValue([{ name: 'ticketId_1', key: { ticketId: 1 }, unique: true }]),
      dropIndex: vi.fn(),
    });
    const dupTicketIdErr = Object.assign(
      new Error('E11000 duplicate key error index: ticketId_1 dup key: { ticketId: "TCK-1" }'),
      { code: 11000, keyPattern: { ticketId: 1 }, keyValue: { ticketId: 'TCK-1' } }
    );
    const secondCreateSpy = vi
      .spyOn(SupportTicket, 'create')
      .mockRejectedValueOnce(dupTicketIdErr)
      .mockResolvedValueOnce(createdAfterHeal);

    const retryRes = await request(app)
      .post('/api/v1/vendor/support/tickets')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        subject: 'Retry ticketId test',
        message: 'Testing collision retry',
      });

    expect(retryRes.status).toBe(201);
    expect(secondCreateSpy).toHaveBeenCalledTimes(2);
    expect(secondCreateSpy.mock.calls[0][0].ticketId).not.toBe(
      secondCreateSpy.mock.calls[1][0].ticketId
    );
  });
});
