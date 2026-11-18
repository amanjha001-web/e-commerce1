import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { Conversation } from '../../src/models/Conversation.model.js';
import { Message } from '../../src/models/Message.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import { chatService } from '../../src/services/common/chat.service.js';
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

describe('Chat & Messages Service & Routes Integration Tests', () => {
  const customerId = '507f1f77bcf86cd799439011';
  const supportId = '507f1f77bcf86cd799439022';
  const sellerUserId = '507f1f77bcf86cd799439033';
  const conversationId = '507f1f77bcf86cd799439044';
  const messageId = '507f1f77bcf86cd799439055';

  const customerToken = generateAccessToken({ id: customerId, role: ROLES.USER });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAuthCustomer = () => {
    vi.spyOn(User, 'findById').mockImplementation((id) => {
      if (String(id) === customerId) {
        return {
          populate: vi.fn().mockResolvedValue({
            _id: customerId,
            fullName: 'Suman',
            email: 'suman@example.com',
            role: ROLES.USER,
            isActive: true,
          }),
        };
      }
      return createQueryMock({ _id: id, isActive: true });
    });
  };

  it('should reject unauthenticated requests to chat routes with 401', async () => {
    const resConvs = await request(app).get('/api/v1/chat/conversations');
    const resContacts = await request(app).get('/api/v1/chat/contacts');

    expect(resConvs.status).toBe(401);
    expect(resContacts.status).toBe(401);
  });

  it('GET /api/v1/chat/contacts should return support reps and approved sellers', async () => {
    mockAuthCustomer();

    vi.spyOn(User, 'find').mockReturnValue(
      createQueryMock([
        {
          _id: supportId,
          fullName: 'Support Desk',
          email: 'support@shopsphere.com',
          role: 'admin',
        },
      ])
    );
    vi.spyOn(Vendor, 'find').mockReturnValue(
      createQueryMock([
        {
          _id: '507f1f77bcf86cd799439066',
          storeName: 'Tridev Store',
          userId: { _id: sellerUserId, fullName: 'Tridev', email: 'tridev@gmail.com' },
          logo: { url: '' },
        },
      ])
    );

    const res = await request(app)
      .get('/api/v1/chat/contacts')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].role).toBe('support');
    expect(res.body.data[1].name).toBe('Tridev Store');
    expect(res.body.data[1].role).toBe('vendor');
  });

  it('chatService.createConversation should reject invalid recipient or self-chat and support { type: "support" }', async () => {
    await expect(chatService.createConversation(customerId, {})).rejects.toMatchObject({
      statusCode: 400,
    });

    await expect(
      chatService.createConversation(customerId, { recipientId: customerId })
    ).rejects.toMatchObject({ statusCode: 400 });

    vi.spyOn(User, 'findOne').mockReturnValue(createQueryMock({ _id: supportId }));
    vi.spyOn(User, 'findById').mockReturnValue(
      createQueryMock({ _id: supportId, isActive: true })
    );
    vi.spyOn(Conversation, 'findOne').mockResolvedValue(null);
    const createdConv = {
      _id: conversationId,
      participants: [
        { _id: customerId, fullName: 'Suman' },
        { _id: supportId, fullName: 'Support Desk', role: 'admin' },
      ],
      populate: vi.fn(),
    };
    createdConv.populate.mockResolvedValue(createdConv);
    vi.spyOn(Conversation, 'create').mockResolvedValue(createdConv);

    const conv = await chatService.createConversation(customerId, { type: 'support' });
    expect(conv._id).toBe(conversationId);
    expect(createdConv.populate).toHaveBeenCalledWith(
      'participants',
      expect.stringContaining('fullName')
    );
  });

  it('GET /api/v1/chat/conversations should populate participant fields and unreadCount', async () => {
    mockAuthCustomer();

    const convDoc = {
      _id: conversationId,
      participants: [
        { _id: customerId, fullName: 'Suman' },
        { _id: supportId, fullName: 'Support Desk', role: 'admin' },
      ],
      lastMessage: { _id: messageId, content: 'Hello!' },
      toObject() {
        return {
          _id: this._id,
          participants: this.participants,
          lastMessage: this.lastMessage,
        };
      },
    };
    vi.spyOn(Conversation, 'find').mockReturnValue(createQueryMock([convDoc]));
    vi.spyOn(Message, 'find').mockReturnValue(
      createQueryMock([{ conversationId }])
    );

    const res = await request(app)
      .get('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].unreadCount).toBe(1);
  });

  it('POST /api/v1/chat/conversations/:id/messages should auto-resolve recipient, reject blanks, and notify recipient', async () => {
    mockAuthCustomer();

    const blankRes = await request(app)
      .post(`/api/v1/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ content: '   ' });
    expect(blankRes.status).toBe(400);

    const mockConv = {
      _id: conversationId,
      participants: [customerId, supportId],
      unreadCounts: new Map(),
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(Conversation, 'findOne').mockResolvedValue(mockConv);

    const createdMsg = {
      _id: messageId,
      conversationId,
      sender: { _id: customerId, fullName: 'Suman' },
      recipient: supportId,
      content: 'Order help needed',
      populate: vi.fn().mockResolvedValue(true),
    };
    const msgCreateSpy = vi.spyOn(Message, 'create').mockResolvedValue(createdMsg);
    const notifSpy = vi
      .spyOn(notificationService, 'createNotification')
      .mockResolvedValue({});

    const res = await request(app)
      .post(`/api/v1/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ content: 'Order help needed' });

    expect(res.status).toBe(201);
    expect(msgCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId,
        sender: customerId,
        recipient: supportId,
        content: 'Order help needed',
      })
    );
    expect(mockConv.unreadCounts.get(supportId)).toBe(1);
    expect(notifSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: supportId,
        type: 'chat',
        link: `/chat/${conversationId}`,
      })
    );
  });

  it('DELETE /api/v1/chat/conversations/:id and PATCH .../read should validate ownership and update DB', async () => {
    mockAuthCustomer();

    const mockConv = {
      _id: conversationId,
      participants: [customerId, supportId],
      unreadCounts: new Map([[customerId, 2]]),
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(Conversation, 'findOne').mockResolvedValue(mockConv);
    const updateManySpy = vi
      .spyOn(Message, 'updateMany')
      .mockResolvedValue({ modifiedCount: 2 });

    const readRes = await request(app)
      .patch(`/api/v1/chat/conversations/${conversationId}/read`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(readRes.status).toBe(200);
    expect(updateManySpy).toHaveBeenCalled();
    expect(mockConv.unreadCounts.get(customerId)).toBe(0);

    const deleteMsgsSpy = vi
      .spyOn(Message, 'deleteMany')
      .mockResolvedValue({ deletedCount: 1 });
    const deleteConvSpy = vi
      .spyOn(Conversation, 'deleteOne')
      .mockResolvedValue({ deletedCount: 1 });

    const delRes = await request(app)
      .delete(`/api/v1/chat/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(delRes.status).toBe(200);
    expect(deleteMsgsSpy).toHaveBeenCalledWith({ conversationId });
    expect(deleteConvSpy).toHaveBeenCalledWith({ _id: conversationId });
  });
});
