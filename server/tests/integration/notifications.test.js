import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Notification } from '../../src/models/Notification.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';
import { ROLES } from '../../src/constants/roles.constant.js';

describe('Notifications Service & Routes Integration Tests', () => {
  const userId = '507f1f77bcf86cd799439011';
  const notifId = '507f1f77bcf86cd799439099';
  const customerToken = generateAccessToken({ id: userId, role: ROLES.USER });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAuthUser = () => {
    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: userId,
        name: 'Suman',
        email: 'suman@example.com',
        role: ROLES.USER,
        isActive: true,
      }),
    });
  };

  it('should reject unauthenticated requests to /api/v1/notifications and /api/v1/customer/notifications with 401', async () => {
    const resCommon = await request(app).get('/api/v1/notifications');
    const resCustomer = await request(app).get('/api/v1/customer/notifications');

    expect(resCommon.status).toBe(401);
    expect(resCustomer.status).toBe(401);
  });

  it('GET /api/v1/notifications should return notifications list and counts', async () => {
    mockAuthUser();

    const sampleDocs = [
      {
        _id: notifId,
        userId,
        title: 'Order Placed Successfully',
        message: 'Your order #ORD-1234 has been placed.',
        type: 'order',
        link: '/orders/123',
        isRead: false,
      },
    ];

    vi.spyOn(Notification, 'find').mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: vi.fn().mockResolvedValue(sampleDocs),
        }),
      }),
    });
    vi.spyOn(Notification, 'countDocuments')
      .mockResolvedValueOnce(1) // filtered total
      .mockResolvedValueOnce(1) // totalCount
      .mockResolvedValueOnce(1); // unreadCount

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notifications).toHaveLength(1);
    expect(res.body.data.unreadCount).toBe(1);
    expect(res.body.data.totalCount).toBe(1);
    expect(res.body.data.readCount).toBe(0);
  });

  it('GET /api/v1/customer/notifications/unread-count should return unreadCount', async () => {
    mockAuthUser();
    vi.spyOn(Notification, 'countDocuments').mockResolvedValue(3);

    const res = await request(app)
      .get('/api/v1/customer/notifications/unread-count')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBe(3);
  });

  it('PATCH /api/v1/customer/notifications/:id/read and mark-all-read should work properly', async () => {
    mockAuthUser();
    vi.spyOn(Notification, 'findOneAndUpdate').mockResolvedValue({
      _id: notifId,
      userId,
      isRead: true,
    });
    vi.spyOn(Notification, 'updateMany').mockResolvedValue({ modifiedCount: 2 });

    const resSingle = await request(app)
      .patch(`/api/v1/customer/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(resSingle.status).toBe(200);
    expect(resSingle.body.data.isRead).toBe(true);

    const resAll = await request(app)
      .patch('/api/v1/customer/notifications/mark-all-read')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(resAll.status).toBe(200);
    expect(resAll.body.success).toBe(true);
  });

  it('DELETE /api/v1/customer/notifications/clear should clear all notifications', async () => {
    mockAuthUser();
    vi.spyOn(Notification, 'deleteMany').mockResolvedValue({ deletedCount: 2 });
    vi.spyOn(User, 'updateOne').mockResolvedValue({ modifiedCount: 1 });

    const res = await request(app)
      .delete('/api/v1/customer/notifications/clear')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('createNotification should normalize unknown types and preserve link in data', async () => {
    const createSpy = vi.spyOn(Notification, 'create').mockImplementation(async (doc) => doc);

    const missingUserRes = await notificationService.createNotification({
      userId: null,
      title: 'Test',
      message: 'No user',
    });
    expect(missingUserRes).toBeNull();

    const created = await notificationService.createNotification({
      userId,
      title: 'Custom Alert',
      message: 'Details',
      type: 'weird_type',
      link: '/orders/abc',
    });

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(created.type).toBe('system');
    expect(created.link).toBe('/orders/abc');
    expect(created.data.link).toBe('/orders/abc');
  });
});
