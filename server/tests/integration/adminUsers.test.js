import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Address } from '../../src/models/Address.model.js';
import { Order } from '../../src/models/Order.model.js';
import { SupportTicket } from '../../src/models/SupportTicket.model.js';
import { VendorRequest } from '../../src/models/VendorRequest.model.js';
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

describe('Admin Users Management Service & Routes Integration Tests', () => {
  const adminId = '507f1f77bcf86cd799439012';
  const targetUserId = '507f1f77bcf86cd799439011';
  const superAdminId = '507f1f77bcf86cd799439099';

  const adminToken = generateAccessToken({ id: adminId, role: ROLES.ADMIN });
  const customerToken = generateAccessToken({ id: targetUserId, role: ROLES.USER });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAuth = (role = ROLES.ADMIN) => {
    const id = role === ROLES.ADMIN ? adminId : targetUserId;
    return {
      _id: id,
      fullName: role === ROLES.ADMIN ? 'Admin User' : 'Aman Test',
      email: role === ROLES.ADMIN ? 'admin@shopsphere.com' : 'aman02@example.com',
      role,
      isActive: true,
    };
  };

  it('should reject unauthenticated requests (401) and non-admin requests (403)', async () => {
    const unauth = await request(app).get('/api/v1/admin/users');
    expect(unauth.status).toBe(401);

    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue(mockAuth(ROLES.USER)),
    });
    const forbidden = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('GET /api/v1/admin/users?status=blocked&role=customer&search=Aman should apply isActive=false, customer role filter, search across fullName, and return summary', async () => {
    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue(mockAuth(ROLES.ADMIN)),
    });

    const findSpy = vi.spyOn(User, 'find').mockReturnValue(
      createQueryMock([
        {
          _id: targetUserId,
          fullName: 'Aman Test',
          username: 'aman02',
          email: 'aman02@example.com',
          role: 'user',
          isActive: false,
          isEmailVerified: true,
        },
      ])
    );

    vi.spyOn(User, 'countDocuments')
      .mockResolvedValueOnce(1) // filtered total
      .mockResolvedValueOnce(24) // totalAllUsers
      .mockResolvedValueOnce(20) // customersCount
      .mockResolvedValueOnce(2) // vendorsCount
      .mockResolvedValueOnce(2) // adminsCount
      .mockResolvedValueOnce(3); // blockedCount

    const res = await request(app)
      .get('/api/v1/admin/users?status=blocked&role=customer&search=Aman')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const appliedFilter = findSpy.mock.calls[0][0];
    expect(appliedFilter.isActive).toBe(false);
    expect(appliedFilter.role).toEqual({ $in: ['user', 'customer'] });
    expect(JSON.stringify(appliedFilter.$or)).toContain('fullName');
    expect(JSON.stringify(appliedFilter.$or)).toContain('phone');

    expect(res.body.data.users).toHaveLength(1);
    expect(res.body.data.users[0].isBlocked).toBe(true);
    expect(res.body.data.users[0].status).toBe('blocked');
    expect(res.body.data.users[0].isVerified).toBe(true);

    expect(res.body.data.summary).toMatchObject({
      totalUsers: 24,
      customersCount: 20,
      vendorsCount: 2,
      blockedCount: 3,
      activeCount: 21,
    });
  });

  it('GET /api/v1/admin/users/:userId should return complete user profile, addresses, orders, spend, tickets, and vendorRequest', async () => {
    vi.spyOn(User, 'findById')
      .mockReturnValueOnce({
        populate: vi.fn().mockResolvedValue(mockAuth(ROLES.ADMIN)),
      })
      .mockReturnValueOnce(
        createQueryMock({
          _id: targetUserId,
          fullName: 'Aman Test',
          name: 'Aman Test',
          username: 'aman02',
          email: 'aman02@example.com',
          phone: '9999998888',
          gender: 'male',
          bio: 'VIP customer',
          role: 'user',
          isActive: true,
          isEmailVerified: true,
          vendorId: null,
        })
      );

    vi.spyOn(Address, 'find').mockReturnValue(
      createQueryMock([
        {
          _id: 'addr1',
          fullName: 'Aman Test',
          city: 'Patna',
          state: 'Bihar',
          postalCode: '800001',
          isDefault: true,
        },
      ])
    );
    vi.spyOn(Order, 'find').mockReturnValue(
      createQueryMock([
        { _id: 'ord1', orderNumber: 'ORD-101', totalAmount: 1299, orderStatus: 'delivered' },
      ])
    );
    vi.spyOn(Order, 'countDocuments').mockResolvedValueOnce(1);
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([{ totalSpent: 1299 }]);
    vi.spyOn(SupportTicket, 'countDocuments').mockResolvedValueOnce(2);
    vi.spyOn(VendorRequest, 'findOne').mockReturnValue(
      createQueryMock({ storeName: 'Aman Store', status: 'pending' })
    );

    const res = await request(app)
      .get(`/api/v1/admin/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const user = res.body.data;
    expect(user.isBlocked).toBe(false);
    expect(user.isVerified).toBe(true);
    expect(user.bio).toBe('VIP customer');
    expect(user.addresses).toHaveLength(1);
    expect(user.recentOrders).toHaveLength(1);
    expect(user.orderStats).toEqual({ totalOrders: 1, totalSpent: 1299 });
    expect(user.ticketCount).toBe(2);
    expect(user.vendorRequest.storeName).toBe('Aman Store');
  });

  it('PATCH /api/v1/admin/users/:userId/toggle-status should toggle active <-> blocked and prevent self-block', async () => {
    const userDoc = {
      _id: targetUserId,
      fullName: 'Aman Test',
      email: 'aman02@example.com',
      role: 'user',
      isActive: true,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(User, 'findById')
      .mockReturnValueOnce({
        populate: vi.fn().mockResolvedValue(mockAuth(ROLES.ADMIN)),
      })
      .mockResolvedValueOnce(userDoc);

    const res = await request(app)
      .patch(`/api/v1/admin/users/${targetUserId}/toggle-status`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(userDoc.isActive).toBe(false);
    expect(userDoc.save).toHaveBeenCalledTimes(1);
    expect(res.body.data.isBlocked).toBe(true);
    expect(res.body.data.status).toBe('blocked');

    // Prevent self-blocking
    vi.spyOn(User, 'findById')
      .mockReturnValueOnce({
        populate: vi.fn().mockResolvedValue(mockAuth(ROLES.ADMIN)),
      })
      .mockResolvedValueOnce({ _id: adminId, role: 'admin', isActive: true });

    const selfBlockRes = await request(app)
      .patch(`/api/v1/admin/users/${adminId}/toggle-status`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(selfBlockRes.status).toBe(400);

    // Prevent non-super-admin from blocking super_admin
    vi.spyOn(User, 'findById')
      .mockReturnValueOnce({
        populate: vi.fn().mockResolvedValue(mockAuth(ROLES.ADMIN)),
      })
      .mockResolvedValueOnce({ _id: superAdminId, role: ROLES.SUPER_ADMIN, isActive: true });

    const superRes = await request(app)
      .patch(`/api/v1/admin/users/${superAdminId}/toggle-status`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(superRes.status).toBe(403);
  });

  it('PATCH /api/v1/admin/users/:userId should sync fullName/name, allow blank username, and map customer role', async () => {
    const editableDoc = {
      _id: targetUserId,
      fullName: 'Old Name',
      name: 'Old Name',
      username: 'olduser',
      email: 'aman02@example.com',
      role: 'user',
      isActive: true,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(User, 'findById')
      .mockReturnValueOnce({
        populate: vi.fn().mockResolvedValue(mockAuth(ROLES.ADMIN)),
      })
      .mockResolvedValueOnce(editableDoc)
      .mockReturnValueOnce(
        createQueryMock({
          ...editableDoc,
          fullName: 'Aman Updated',
          name: 'Aman Updated',
          username: undefined,
          role: 'user',
        })
      );

    vi.spyOn(Address, 'find').mockReturnValue(createQueryMock([]));
    vi.spyOn(Order, 'find').mockReturnValue(createQueryMock([]));
    vi.spyOn(Order, 'countDocuments').mockResolvedValueOnce(0);
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(SupportTicket, 'countDocuments').mockResolvedValueOnce(0);
    vi.spyOn(VendorRequest, 'findOne').mockReturnValue(createQueryMock(null));

    const res = await request(app)
      .patch(`/api/v1/admin/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Aman Updated', username: '', role: 'customer', bio: 'Updated bio' });

    expect(res.status).toBe(200);
    expect(editableDoc.fullName).toBe('Aman Updated');
    expect(editableDoc.name).toBe('Aman Updated');
    expect(editableDoc.username).toBeUndefined();
    expect(editableDoc.role).toBe('user');
    expect(editableDoc.bio).toBe('Updated bio');
    expect(editableDoc.save).toHaveBeenCalledTimes(1);
  });
});
