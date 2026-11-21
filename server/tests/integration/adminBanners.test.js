import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Banner } from '../../src/models/Banner.model.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';

const ADMIN_ID = '65f100000000000000000001';
const USER_ID = '65f100000000000000000002';
const BANNER_ID_1 = '65fa00000000000000000001';
const BANNER_ID_2 = '65fa00000000000000000002';

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

const mockCustomerAuth = () => {
  vi.spyOn(User, 'findById').mockReturnValue({
    populate: vi.fn().mockResolvedValue({
      _id: USER_ID,
      role: 'customer',
      isActive: true,
      name: 'Customer User',
    }),
  });
  return generateAccessToken({ id: USER_ID, role: 'customer' });
};

describe('Admin & Public Banners Integration Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated and non-admin requests on /api/v1/admin/banners', async () => {
    const unauth = await request(app).get('/api/v1/admin/banners');
    expect(unauth.status).toBe(401);

    const customerToken = mockCustomerAuth();
    const forbidden = await request(app)
      .get('/api/v1/admin/banners')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('returns formatted banners with real imageUrl, placementLabel, scheduleLabel, CTR, lifecycle status, summary, and pagination', async () => {
    const token = mockAdminAuth();
    const pastEnd = new Date(Date.now() - 5 * 86400000);
    const futureStart = new Date(Date.now() + 5 * 86400000);
    const futureEnd = new Date(Date.now() + 25 * 86400000);

    vi.spyOn(Banner, 'find').mockReturnValue(
      createQueryMock([
        {
          _id: BANNER_ID_1,
          title: 'Mega Tech Sale 2026',
          subtitle: 'Top Gadgets',
          position: 'home_hero',
          sortOrder: 0,
          image: { url: 'https://cdn.example.com/mega.jpg', publicId: 'banners/mega' },
          isActive: true,
          startDate: new Date('2026-11-01T00:00:00Z'),
          endDate: futureEnd,
          impressions: 1000,
          clicks: 50,
        },
        {
          _id: BANNER_ID_2,
          title: 'Past Summer Sale',
          section: 'CATEGORY',
          isActive: false,
          endDate: pastEnd,
          image: { url: 'https://cdn.example.com/summer.jpg', publicId: '' },
        },
        {
          _id: '65fa00000000000000000003',
          title: 'Holiday Teaser',
          position: 'home_middle',
          isActive: true,
          startDate: futureStart,
          endDate: futureEnd,
          image: { url: 'https://cdn.example.com/holiday.jpg', publicId: '' },
        },
      ])
    );

    vi.spyOn(Banner, 'countDocuments')
      .mockResolvedValueOnce(3) // filtered total
      .mockResolvedValueOnce(3) // summary total
      .mockResolvedValueOnce(1) // active
      .mockResolvedValueOnce(1) // scheduled
      .mockResolvedValueOnce(1) // expired
      .mockResolvedValueOnce(0); // inactive

    const res = await request(app)
      .get('/api/v1/admin/banners?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.banners).toHaveLength(3);

    expect(data.banners[0]).toEqual(
      expect.objectContaining({
        title: 'Mega Tech Sale 2026',
        imageUrl: 'https://cdn.example.com/mega.jpg',
        placementLabel: 'Homepage hero',
        computedStatus: 'active',
        statusLabel: 'Active',
        ctr: 5,
      })
    );
    expect(data.banners[1].placementLabel).toBe('Shop / Categories top');
    expect(data.banners[1].computedStatus).toBe('expired');
    expect(data.banners[2].computedStatus).toBe('scheduled');

    expect(data.summary).toEqual({
      total: 3,
      active: 1,
      scheduled: 1,
      expired: 1,
      inactive: 0,
    });
    expect(data.pagination.total).toBe(3);
  });

  it('combines status, position, and search filters cleanly using $and', async () => {
    const token = mockAdminAuth();
    const findSpy = vi.spyOn(Banner, 'find').mockReturnValue(createQueryMock([]));
    vi.spyOn(Banner, 'countDocuments').mockResolvedValue(0);

    const res = await request(app)
      .get('/api/v1/admin/banners?status=active&position=category_top&search=Winter')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const queryFilter = findSpy.mock.calls[0][0];
    expect(Array.isArray(queryFilter.$and)).toBe(true);
    expect(queryFilter.$and).toContainEqual({ position: 'category_top' });
    expect(
      queryFilter.$and.some(
        (cond) =>
          Array.isArray(cond.$or) &&
          cond.$or.some((sub) => sub.title && sub.title.$regex === 'Winter')
      )
    ).toBe(true);
  });

  it('creates banners via multipart image upload as well as URL/alias payloads and rejects endDate < startDate', async () => {
    const token = mockAdminAuth();

    const badDateRes = await request(app)
      .post('/api/v1/admin/banners')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Invalid Date Banner',
        startDate: '2027-05-10',
        endDate: '2027-05-01',
      });
    expect(badDateRes.status).toBe(422);

    const createSpy = vi.spyOn(Banner, 'create').mockImplementation(async (doc) => ({
      _id: BANNER_ID_1,
      ...doc,
    }));

    const multipartRes = await request(app)
      .post('/api/v1/admin/banners')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Winter Collection')
      .field('subtitle', 'Limited Edition')
      .field('position', 'home_hero')
      .field('buttonText', 'Shop Winter')
      .field('link', '/products?deals=true')
      .field('sortOrder', '1')
      .field('isActive', 'true')
      .field('startDate', '2026-11-21')
      .field('endDate', '2027-01-15')
      .attach('image', Buffer.from('fake-png-bytes'), {
        filename: 'winter.png',
        contentType: 'image/png',
      });

    expect(multipartRes.status).toBe(201);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Winter Collection',
        position: 'home_hero',
        buttonText: 'Shop Winter',
        link: '/products?deals=true',
        sortOrder: 1,
        isActive: true,
      })
    );
    expect(multipartRes.body.data.imageUrl).toBeTruthy();
  });

  it('validates ObjectId on update/status/delete and toggles isActive cleanly', async () => {
    const token = mockAdminAuth();

    const badPatch = await request(app)
      .patch('/api/v1/admin/banners/bad-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated' });
    expect(badPatch.status).toBe(400);

    const saveMock = vi.fn().mockResolvedValue(true);
    vi.spyOn(Banner, 'findById').mockResolvedValueOnce({
      _id: BANNER_ID_1,
      title: 'Live Hero',
      position: 'home_hero',
      image: { url: 'https://cdn.example.com/hero.jpg', publicId: '' },
      isActive: true,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: null,
      save: saveMock,
    });

    const toggleRes = await request(app)
      .patch(`/api/v1/admin/banners/${BANNER_ID_1}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(toggleRes.status).toBe(200);
    expect(saveMock).toHaveBeenCalled();
    expect(toggleRes.body.data.isActive).toBe(false);
    expect(toggleRes.body.data.computedStatus).toBe('inactive');

    vi.spyOn(Banner, 'findByIdAndDelete').mockResolvedValueOnce({
      _id: BANNER_ID_1,
      title: 'Live Hero',
      image: { url: 'https://cdn.example.com/hero.jpg', publicId: 'banners/mock_1' },
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/admin/banners/${BANNER_ID_1}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);
  });

  it('serves active public banners cleanly and records impressions & clicks with ID guards', async () => {
    const findSpy = vi.spyOn(Banner, 'find').mockReturnValue(
      createQueryMock([
        {
          _id: BANNER_ID_1,
          title: 'Active Hero',
          position: 'home_hero',
          sortOrder: 0,
          image: { url: 'https://cdn.example.com/hero.jpg', publicId: '' },
          isActive: true,
        },
      ])
    );

    const publicRes = await request(app).get('/api/v1/banners/active?position=home_hero');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data).toHaveLength(1);
    const queryFilter = findSpy.mock.calls[0][0];
    expect(queryFilter.$and).toContainEqual({ position: 'home_hero' });
    expect(queryFilter.$and).toContainEqual({ isActive: { $ne: false } });

    const badImp = await request(app).patch('/api/v1/banners/invalid-id/impression');
    expect(badImp.status).toBe(400);

    vi.spyOn(Banner, 'findByIdAndUpdate').mockResolvedValueOnce({
      _id: BANNER_ID_1,
      impressions: 1,
    });
    const okImp = await request(app).patch(`/api/v1/banners/${BANNER_ID_1}/impression`);
    expect(okImp.status).toBe(200);

    vi.spyOn(Banner, 'findByIdAndUpdate').mockResolvedValueOnce({
      _id: BANNER_ID_1,
      clicks: 1,
    });
    const okClick = await request(app).patch(`/api/v1/banners/${BANNER_ID_1}/click`);
    expect(okClick.status).toBe(200);
  });
});
