import { describe, it, expect, vi, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { SupportTicket } from '../../src/models/SupportTicket.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';

const ADMIN_ID = '65f100000000000000000001';
const AGENT_ID = '65f100000000000000000009';
const LEGACY_USER_ID = '65f200000000000000000055';
const TICKET_ID_1 = '65fb00000000000000000001';
const TICKET_ID_2 = '65fb00000000000000000002';

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

describe('Admin Support Tickets Extended Integration Tests', () => {
  const adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
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
      Object.defineProperty(
        mongoose.connection,
        'readyState',
        originalReadyStateDescriptor
      );
    }
  });

  const mockAdminAuth = () => {
    vi.spyOn(User, 'findById').mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({
        _id: ADMIN_ID,
        role: 'admin',
        isActive: true,
        fullName: 'Admin User',
        email: 'admin@shopsphere.com',
      }),
    });
  };

  it('returns active support agents from GET /api/v1/admin/support-tickets/agents', async () => {
    setReadyState(1);
    mockAdminAuth();

    vi.spyOn(User, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: ADMIN_ID,
          fullName: 'Admin User',
          email: 'admin@shopsphere.com',
          role: 'admin',
        },
        {
          _id: AGENT_ID,
          name: 'Priya Support',
          email: 'priya@shopsphere.com',
          role: 'super_admin',
        },
      ])
    );

    const res = await request(app)
      .get('/api/v1/admin/support-tickets/agents')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.agents).toHaveLength(2);
    expect(res.body.data.agents[0]).toEqual(
      expect.objectContaining({
        _id: ADMIN_ID,
        name: 'Admin User',
        role: 'admin',
      })
    );
  });

  it('hydrates legacy user/customerId refs, normalizes waiting_customer, synthesizes root description, and returns summary KPIs', async () => {
    setReadyState(1);
    mockAdminAuth();

    vi.spyOn(SupportTicket, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: TICKET_ID_1,
          ticketId: 'SUP-20260818-796513',
          user: LEGACY_USER_ID, // Legacy field instead of userId
          subject: 'Payment still pending after successful payment',
          description: 'Amount debited via UPI but order still pending.',
          category: 'payment',
          priority: 'urgent',
          status: 'waiting_customer', // Legacy alias
          messages: [],
          internalNotes: [{ note: 'Checked gateway', createdAt: new Date() }],
        },
      ])
    );

    vi.spyOn(SupportTicket, 'countDocuments')
      .mockResolvedValueOnce(1) // filtered total
      .mockResolvedValueOnce(4) // allTotal
      .mockResolvedValueOnce(1) // open
      .mockResolvedValueOnce(0) // pending
      .mockResolvedValueOnce(1) // in_progress
      .mockResolvedValueOnce(1) // waiting_for_customer
      .mockResolvedValueOnce(1) // resolved
      .mockResolvedValueOnce(0) // closed
      .mockResolvedValueOnce(1) // urgentOpen
      .mockResolvedValueOnce(2); // unassigned

    vi.spyOn(User, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: LEGACY_USER_ID,
          fullName: 'Aman Verma',
          email: 'aman.legacy@example.com',
          phone: '9876543210',
        },
      ])
    );

    const res = await request(app)
      .get('/api/v1/admin/support-tickets?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.tickets).toHaveLength(1);
    expect(data.tickets[0]).toEqual(
      expect.objectContaining({
        ticketId: 'SUP-20260818-796513',
        customerName: 'Aman Verma',
        customerEmail: 'aman.legacy@example.com',
        status: 'waiting_for_customer',
        priority: 'urgent',
        messageCount: 1,
        noteCount: 1,
      })
    );
    expect(data.tickets[0].messages[0].message).toContain('Amount debited via UPI');
    expect(data.summary).toEqual(
      expect.objectContaining({
        total: 4,
        open: 1,
        waitingForCustomer: 1,
        activeQueue: 3,
        resolved: 1,
        urgentOpen: 1,
        unassigned: 2,
      })
    );
  });

  it('filters by status, priority, category, assignedTo, and searches matching User names/emails', async () => {
    setReadyState(1);
    mockAdminAuth();

    vi.spyOn(User, 'find').mockReturnValueOnce(
      createQueryMock([{ _id: LEGACY_USER_ID }])
    );
    const findSpy = vi
      .spyOn(SupportTicket, 'find')
      .mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(SupportTicket, 'countDocuments').mockResolvedValue(0);

    const res = await request(app)
      .get(
        '/api/v1/admin/support-tickets?status=waiting_for_customer&priority=urgent&category=payment&assignedTo=unassigned&search=aman'
      )
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const queryUsed = findSpy.mock.calls[0][0];
    expect(Array.isArray(queryUsed.$and)).toBe(true);
    expect(queryUsed.$and).toContainEqual({
      status: { $in: ['waiting_for_customer', 'waiting_customer'] },
    });
    expect(queryUsed.$and).toContainEqual({ priority: 'urgent' });
    expect(queryUsed.$and).toContainEqual({ category: 'payment' });
    expect(queryUsed.$and).toContainEqual({
      $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }],
    });
    expect(
      queryUsed.$and.some(
        (cond) =>
          Array.isArray(cond.$or) &&
          cond.$or.some((sub) => sub.userId && Array.isArray(sub.userId.$in))
      )
    ).toBe(true);
  });

  it('assigns/unassigns tickets with validation, supports reply target status, and deletes tickets', async () => {
    setReadyState(1);

    vi.spyOn(User, 'findById').mockImplementation((id) => {
      if (String(id) === AGENT_ID) {
        return createQueryMock({
          _id: AGENT_ID,
          fullName: 'Priya Support',
          email: 'priya@shopsphere.com',
          role: 'admin',
        });
      }
      return {
        populate: vi.fn().mockResolvedValue({
          _id: ADMIN_ID,
          role: 'admin',
          isActive: true,
          fullName: 'Admin User',
          email: 'admin@shopsphere.com',
        }),
      };
    });

    // 1. Invalid assignee ObjectId -> 400
    const badAssign = await request(app)
      .patch(`/api/v1/admin/support-tickets/${TICKET_ID_1}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedTo: 'bad-id' });
    expect(badAssign.status).toBe(400);

    // 2. Valid assignment
    vi.spyOn(SupportTicket, 'findOneAndUpdate').mockReturnValueOnce(
      createQueryMock({
        _id: TICKET_ID_1,
        ticketId: 'TCK-100',
        userId: { _id: LEGACY_USER_ID, fullName: 'Suman', email: 'suman@example.com' },
        assignedTo: { _id: AGENT_ID, fullName: 'Priya Support', email: 'priya@shopsphere.com' },
        subject: 'Refund inquiry',
        status: 'open',
      })
    );
    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const okAssign = await request(app)
      .patch(`/api/v1/admin/support-tickets/${TICKET_ID_1}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedTo: AGENT_ID });
    expect(okAssign.status).toBe(200);
    expect(okAssign.body.data.assigneeName).toBe('Priya Support');

    // 3. Reply with waiting_for_customer target status
    const saveMock = vi.fn().mockResolvedValue(true);
    vi.spyOn(SupportTicket, 'findOne')
      .mockResolvedValueOnce({
        _id: TICKET_ID_1,
        ticketId: 'TCK-100',
        userId: LEGACY_USER_ID,
        subject: 'Refund inquiry',
        status: 'in_progress',
        messages: [],
        save: saveMock,
      })
      .mockReturnValueOnce(
        createQueryMock({
          _id: TICKET_ID_1,
          ticketId: 'TCK-100',
          userId: { _id: LEGACY_USER_ID, fullName: 'Suman', email: 'suman@example.com' },
          subject: 'Refund inquiry',
          status: 'waiting_for_customer',
          messages: [{ sender: ADMIN_ID, message: 'Please share UTR' }],
        })
      );
    vi.spyOn(User, 'find').mockReturnValueOnce(createQueryMock([]));

    const replyRes = await request(app)
      .post(`/api/v1/admin/support-tickets/${TICKET_ID_1}/reply`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'Please share UTR', status: 'waiting_for_customer' });

    expect(replyRes.status).toBe(200);
    expect(saveMock).toHaveBeenCalled();
    expect(replyRes.body.data.status).toBe('waiting_for_customer');

    // 4. Delete ticket
    vi.spyOn(SupportTicket, 'findOneAndDelete').mockResolvedValueOnce({
      _id: TICKET_ID_2,
    });
    const delRes = await request(app)
      .delete(`/api/v1/admin/support-tickets/${TICKET_ID_2}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
  });
});
