import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { SupportTicket } from '../../src/models/SupportTicket.model.js';
import { Notification } from '../../src/models/Notification.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import { supportService } from '../../src/services/customer/support.service.js';
import { adminSupportService } from '../../src/services/admin/support.service.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';
import { ROLES } from '../../src/constants/roles.constant.js';

const createQueryMock = (result) => {
  const query = {
    populate: vi.fn(() => query),
    sort: vi.fn(() => query),
    skip: vi.fn(() => query),
    limit: vi.fn(() => query),
    select: vi.fn(() => query),
    lean: vi.fn(() => query),
    exec: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

describe('Support Tickets Service & Routes Integration Tests', () => {
  const userId = '507f1f77bcf86cd799439011';
  const adminId = '507f1f77bcf86cd799439012';
  const ticketObjectId = '507f1f77bcf86cd799439088';
  const ticketCode = 'TCK-123456';

  const customerToken = generateAccessToken({ id: userId, role: ROLES.USER });
  const adminToken = generateAccessToken({ id: adminId, role: ROLES.ADMIN });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAuthUser = (role = ROLES.USER) => {
    const isAdmin = role === ROLES.ADMIN;
    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: isAdmin ? adminId : userId,
        name: isAdmin ? 'Admin User' : 'Suman',
        email: isAdmin ? 'admin@example.com' : 'suman@example.com',
        role,
        isActive: true,
      }),
    });
  };

  it('should reject unauthenticated requests to customer and admin support endpoints with 401', async () => {
    const resCustomer = await request(app).get('/api/v1/support/tickets');
    const resAdmin = await request(app).get('/api/v1/admin/support-tickets');

    expect(resCustomer.status).toBe(401);
    expect(resAdmin.status).toBe(401);
  });

  it('should forbid customer role from accessing admin support endpoints with 403', async () => {
    mockAuthUser(ROLES.USER);

    const res = await request(app)
      .get('/api/v1/admin/support-tickets')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });

  it('supportService.createTicket should reject blank subject or message with 400', async () => {
    await expect(
      supportService.createTicket(userId, { subject: '   ', message: 'Valid body' })
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      supportService.createTicket(userId, { subject: 'Order issue', message: '   ' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('supportService.createTicket should normalize category and priority to lowercase', async () => {
    const createdTicket = {
      _id: ticketObjectId,
      ticketId: ticketCode,
      userId,
      subject: 'Late delivery',
      category: 'delivery',
      priority: 'high',
      status: 'open',
      messages: [{ sender: userId, senderRole: 'customer', message: 'Package delayed' }],
    };
    createdTicket.populate = vi.fn().mockResolvedValue(createdTicket);

    const createSpy = vi.spyOn(SupportTicket, 'create').mockResolvedValue(createdTicket);
    vi.spyOn(notificationService, 'notifyAdmins').mockResolvedValue([]);
    vi.spyOn(SupportTicket, 'findById').mockReturnValue(createQueryMock(createdTicket));
    vi.spyOn(User, 'find').mockReturnValue(createQueryMock([]));
    vi.spyOn(Notification, 'insertMany').mockResolvedValue([]);
    vi.spyOn(Notification, 'create').mockResolvedValue({});

    const result = await supportService.createTicket(userId, {
      subject: '  Late delivery  ',
      category: 'Delivery',
      priority: 'HIGH',
      message: 'Package delayed',
    });

    expect(createSpy).toHaveBeenCalledTimes(1);
    const createArg = createSpy.mock.calls[0][0];
    expect(createArg.category).toBe('delivery');
    expect(createArg.priority).toBe('high');
    expect(createArg.subject).toBe('Late delivery');
    expect(createdTicket.populate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'userId',
          select: expect.stringContaining('fullName'),
        }),
      ])
    );
    expect(result.ticketId).toBe(ticketCode);
  });

  it('supportService.getTicketById should avoid _id cast errors when queried with non-ObjectId TCK code', async () => {
    const sampleTicket = {
      _id: ticketObjectId,
      ticketId: ticketCode,
      userId,
      subject: 'Coupon issue',
      status: 'open',
      messages: [],
    };

    const findOneSpy = vi
      .spyOn(SupportTicket, 'findOne')
      .mockReturnValue(createQueryMock(sampleTicket));

    const ticket = await supportService.getTicketById(ticketCode, userId);

    expect(ticket.ticketId).toBe(ticketCode);
    const filter = findOneSpy.mock.calls[0][0];
    const serializedFilter = JSON.stringify(filter);
    expect(serializedFilter).not.toContain('"_id"');
    expect(serializedFilter).toContain(ticketCode);
  });

  it('POST /api/v1/support/tickets/:ticketId/messages should transition waiting_for_customer to open', async () => {
    mockAuthUser(ROLES.USER);

    const mockTicketDoc = {
      _id: ticketObjectId,
      ticketId: ticketCode,
      userId,
      subject: 'Coupon issue',
      status: 'waiting_for_customer',
      messages: [],
      save: vi.fn().mockResolvedValue(true),
      populate: vi.fn(),
    };
    mockTicketDoc.populate.mockResolvedValue({
      ...mockTicketDoc,
      status: 'open',
      messages: [{ sender: userId, senderRole: 'customer', message: 'Replied back' }],
    });

    vi.spyOn(SupportTicket, 'findOne').mockReturnValue(createQueryMock(mockTicketDoc));
    vi.spyOn(notificationService, 'notifyAdmins').mockResolvedValue([]);
    vi.spyOn(User, 'find').mockReturnValue(createQueryMock([]));
    vi.spyOn(Notification, 'insertMany').mockResolvedValue([]);
    vi.spyOn(Notification, 'create').mockResolvedValue({});

    const res = await request(app)
      .post(`/api/v1/support/tickets/${ticketCode}/messages`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ message: 'Replied back' });

    expect(res.status).toBe(200);
    expect(mockTicketDoc.status).toBe('open');
    expect(mockTicketDoc.save).toHaveBeenCalledTimes(1);
    expect(res.body.data.messages).toHaveLength(1);
  });

  it('admin routes should update priority, add internal note, close with empty body, and return history', async () => {
    mockAuthUser(ROLES.ADMIN);

    const updatedTicket = {
      _id: ticketObjectId,
      ticketId: ticketCode,
      userId,
      subject: 'Payout delay',
      status: 'closed',
      priority: 'urgent',
      internalNotes: [{ author: adminId, note: 'Checked with finance' }],
      messages: [{ sender: adminId, senderRole: 'admin', message: 'Checking now' }],
      save: vi.fn().mockResolvedValue(true),
    };

    const findOneAndUpdateSpy = vi
      .spyOn(SupportTicket, 'findOneAndUpdate')
      .mockReturnValue(createQueryMock(updatedTicket));
    vi.spyOn(SupportTicket, 'findOne').mockReturnValue(createQueryMock(updatedTicket));
    vi.spyOn(SupportTicket, 'findById').mockReturnValue(createQueryMock(updatedTicket));
    vi.spyOn(Notification, 'create').mockResolvedValue({});

    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const resPriority = await request(app)
      .patch(`/api/v1/admin/support-tickets/${ticketCode}/priority`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ priority: 'URGENT' });

    expect(resPriority.status).toBe(200);
    expect(findOneAndUpdateSpy).toHaveBeenCalled();
    const priorityUpdateArg = findOneAndUpdateSpy.mock.calls[0][1];
    expect(priorityUpdateArg.priority).toBe('urgent');

    const resNote = await request(app)
      .post(`/api/v1/admin/support-tickets/${ticketCode}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Escalated internally' });

    expect(resNote.status).toBe(200);
    expect(updatedTicket.internalNotes.some((n) => n.note === 'Escalated internally')).toBe(true);

    const resClose = await request(app)
      .patch(`/api/v1/admin/support-tickets/${ticketCode}/close`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resClose.status).toBe(200);

    const resHistory = await request(app)
      .get(`/api/v1/admin/support-tickets/${ticketCode}/history`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resHistory.status).toBe(200);
    expect(resHistory.body.data).toHaveProperty('history');
    expect(Array.isArray(resHistory.body.data.history)).toBe(true);
  });

  it('supportService.getMyTickets and adminSupportService.getSupportTickets should populate fullName, name, username, and email for userId', async () => {
    const customerQuery = createQueryMock([]);
    vi.spyOn(SupportTicket, 'find').mockReturnValueOnce(customerQuery);
    vi.spyOn(SupportTicket, 'countDocuments').mockResolvedValueOnce(0);

    await supportService.getMyTickets(userId);
    expect(customerQuery.populate).toHaveBeenCalledWith(
      'userId',
      expect.stringContaining('fullName')
    );
    expect(customerQuery.populate).toHaveBeenCalledWith(
      'userId',
      expect.stringContaining('username')
    );

    const adminQuery = createQueryMock([]);
    vi.spyOn(SupportTicket, 'find').mockReturnValueOnce(adminQuery);
    vi.spyOn(SupportTicket, 'countDocuments').mockResolvedValueOnce(0);

    await adminSupportService.getSupportTickets();
    expect(adminQuery.populate).toHaveBeenCalledWith(
      'userId',
      expect.stringContaining('fullName')
    );
    expect(adminQuery.populate).toHaveBeenCalledWith(
      'userId',
      expect.stringContaining('username')
    );
  });

  it('adminSupportService.updateSupportTicketPriority should reject invalid priority values with 400', async () => {
    await expect(
      adminSupportService.updateSupportTicketPriority(ticketCode, 'invalid_tier')
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
