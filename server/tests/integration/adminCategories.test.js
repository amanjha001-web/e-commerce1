import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Category } from '../../src/models/Category.model.js';
import { Product } from '../../src/models/Product.model.js';
import { cloudinary } from '../../src/config/cloudinary.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';

const ADMIN_ID = '65f100000000000000000001';
const USER_ID = '65f100000000000000000002';
const CAT_ID_1 = '65f200000000000000000001';
const PARENT_ID = '65f200000000000000000009';

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

describe('Admin Categories API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires authentication and admin role on /api/v1/admin/categories', async () => {
    const unauthRes = await request(app).get('/api/v1/admin/categories');
    expect(unauthRes.status).toBe(401);

    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: USER_ID,
        role: 'customer',
        isActive: true,
        name: 'Regular Customer',
      }),
    });
    const customerToken = generateAccessToken({ id: USER_ID, role: 'customer' });

    const forbiddenRes = await request(app)
      .get('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbiddenRes.status).toBe(403);
  });

  it('lists filtered categories with aggregated product/subcategory counts, summary, and pagination', async () => {
    const token = mockAdminAuth();
    const categoryDoc = {
      _id: CAT_ID_1,
      name: 'Audio Gear',
      slug: 'audio-gear',
      description: 'Headphones and speakers',
      icon: '🎧',
      image: { url: 'https://example.com/audio.png', publicId: '' },
      parent: { _id: PARENT_ID, name: 'Electronics', slug: 'electronics' },
      isActive: true,
      sortOrder: 1,
    };

    const findSpy = vi.spyOn(Category, 'find').mockReturnValue(createQueryMock([categoryDoc]));
    vi.spyOn(Category, 'countDocuments')
      .mockResolvedValueOnce(1) // filtered total
      .mockResolvedValueOnce(4) // totalAll
      .mockResolvedValueOnce(3) // activeCount
      .mockResolvedValueOnce(1); // archivedCount
    vi.spyOn(Product, 'countDocuments').mockResolvedValueOnce(12);
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([
      { _id: CAT_ID_1, productCount: 5, publishedProductCount: 4 },
    ]);
    vi.spyOn(Category, 'aggregate').mockResolvedValueOnce([
      { _id: CAT_ID_1, count: 2 },
    ]);

    const res = await request(app)
      .get('/api/v1/admin/categories?status=active&search=audio&page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: { $ne: false },
        $or: expect.any(Array),
      })
    );
    expect(res.body.data.categories).toHaveLength(1);
    expect(res.body.data.categories[0]).toMatchObject({
      _id: CAT_ID_1,
      name: 'Audio Gear',
      slug: 'audio-gear',
      parentName: 'Electronics',
      productCount: 5,
      publishedProductCount: 4,
      subcategoryCount: 2,
      imageUrl: 'https://example.com/audio.png',
    });
    expect(res.body.data.summary).toEqual({
      total: 4,
      active: 3,
      archived: 1,
      totalCategorizedProducts: 12,
    });
    expect(res.body.data.pagination).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('validates missing name (400), rejects duplicates (409), and creates a category (201)', async () => {
    const token = mockAdminAuth();

    const missingRes = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ' });
    expect(missingRes.status).toBe(400);

    const findOneSpy = vi
      .spyOn(Category, 'findOne')
      .mockReturnValueOnce(createQueryMock({ _id: CAT_ID_1 }));

    const conflictRes = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Audio Gear' });
    expect(conflictRes.status).toBe(409);

    findOneSpy.mockReturnValueOnce(createQueryMock(null));
    const createdDoc = {
      _id: CAT_ID_1,
      name: 'Smart Audio',
      slug: 'smart-audio',
      description: 'Wireless speakers',
      icon: '🔊',
      image: { url: 'https://example.com/smart-audio.png', publicId: '' },
      parent: { _id: PARENT_ID, name: 'Electronics', slug: 'electronics' },
      isActive: true,
      sortOrder: 3,
    };

    vi.spyOn(Category, 'findById')
      .mockReturnValueOnce(createQueryMock({ _id: PARENT_ID }))
      .mockReturnValueOnce(createQueryMock(createdDoc));
    const createSpy = vi.spyOn(Category, 'create').mockResolvedValueOnce(createdDoc);
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(Category, 'aggregate').mockResolvedValueOnce([]);

    const createRes = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Smart Audio',
        description: 'Wireless speakers',
        parent: PARENT_ID,
        icon: '🔊',
        imageUrl: 'https://example.com/smart-audio.png',
        sortOrder: 3,
      });

    expect(createRes.status).toBe(201);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Smart Audio',
        slug: 'smart-audio',
        parent: PARENT_ID,
        icon: '🔊',
        sortOrder: 3,
        image: { url: 'https://example.com/smart-audio.png', publicId: '' },
      })
    );
    expect(createRes.body.data).toMatchObject({
      _id: CAT_ID_1,
      name: 'Smart Audio',
      slug: 'smart-audio',
      parentName: 'Electronics',
    });
  });

  it('rejects self-parent on update (400), persists updates (200), and toggles status', async () => {
    const token = mockAdminAuth();

    const categoryDoc = {
      _id: CAT_ID_1,
      name: 'Audio Gear',
      slug: 'audio-gear',
      description: 'Old description',
      icon: '🎧',
      image: { url: '', publicId: '' },
      parent: null,
      isActive: true,
      sortOrder: 1,
      save: vi.fn().mockResolvedValue(true),
    };

    const findByIdSpy = vi
      .spyOn(Category, 'findById')
      .mockReturnValueOnce(createQueryMock(categoryDoc));
    const findOneSpy = vi
      .spyOn(Category, 'findOne')
      .mockReturnValueOnce(createQueryMock(null));

    const selfParentRes = await request(app)
      .patch(`/api/v1/admin/categories/${CAT_ID_1}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parent: CAT_ID_1 });

    expect(selfParentRes.status).toBe(400);
    expect(selfParentRes.body.message).toMatch(/own parent/i);

    const updatedDoc = {
      ...categoryDoc,
      name: 'Smart Home',
      slug: 'smart-home',
      icon: '🏠',
      sortOrder: 5,
    };
    findByIdSpy
      .mockReturnValueOnce(createQueryMock(categoryDoc))
      .mockReturnValueOnce(createQueryMock(updatedDoc));
    findOneSpy.mockReturnValueOnce(createQueryMock(null));
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(Category, 'aggregate').mockResolvedValueOnce([]);

    const updateRes = await request(app)
      .patch(`/api/v1/admin/categories/${CAT_ID_1}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Smart Home', icon: '🏠', sortOrder: 5 });

    expect(updateRes.status).toBe(200);
    expect(categoryDoc.save).toHaveBeenCalledWith({ validateModifiedOnly: true });
    expect(updateRes.body.data).toMatchObject({
      _id: CAT_ID_1,
      name: 'Smart Home',
      slug: 'smart-home',
      icon: '🏠',
      sortOrder: 5,
    });

    const toggleSourceDoc = {
      ...updatedDoc,
      isActive: true,
      save: vi.fn().mockResolvedValue(true),
    };
    findByIdSpy
      .mockReturnValueOnce(createQueryMock(toggleSourceDoc))
      .mockReturnValueOnce(createQueryMock({ ...toggleSourceDoc, isActive: false }));
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(Category, 'aggregate').mockResolvedValueOnce([]);

    const statusRes = await request(app)
      .patch(`/api/v1/admin/categories/${CAT_ID_1}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(statusRes.status).toBe(200);
    expect(toggleSourceDoc.isActive).toBe(false);
    expect(toggleSourceDoc.save).toHaveBeenCalledWith({ validateModifiedOnly: true });
    expect(statusRes.body.data.isActive).toBe(false);
  });

  it('blocks deletion when products are assigned (400) and unlinks child categories when empty (200)', async () => {
    const token = mockAdminAuth();

    const findByIdSpy = vi
      .spyOn(Category, 'findById')
      .mockReturnValueOnce(
        createQueryMock({ _id: CAT_ID_1, name: 'Audio Gear', image: { publicId: '' } })
      );
    const productCountSpy = vi.spyOn(Product, 'countDocuments').mockResolvedValueOnce(3);
    const deleteSpy = vi.spyOn(Category, 'findByIdAndDelete').mockResolvedValue(null);

    const blockedRes = await request(app)
      .delete(`/api/v1/admin/categories/${CAT_ID_1}`)
      .set('Authorization', `Bearer ${token}`);

    expect(blockedRes.status).toBe(400);
    expect(blockedRes.body.message).toContain('3 product(s)');
    expect(deleteSpy).not.toHaveBeenCalled();

    findByIdSpy.mockReturnValueOnce(
      createQueryMock({ _id: CAT_ID_1, name: 'Audio Gear', image: { publicId: '' } })
    );
    productCountSpy.mockResolvedValueOnce(0);
    const updateManySpy = vi
      .spyOn(Category, 'updateMany')
      .mockResolvedValueOnce({ modifiedCount: 2 });
    deleteSpy.mockResolvedValueOnce({ _id: CAT_ID_1 });

    const deleteRes = await request(app)
      .delete(`/api/v1/admin/categories/${CAT_ID_1}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(updateManySpy).toHaveBeenCalledWith(
      { parent: CAT_ID_1 },
      { $set: { parent: null } }
    );
    expect(deleteSpy).toHaveBeenCalledWith(CAT_ID_1);
    expect(deleteRes.body.data.deletedCategoryId).toBe(CAT_ID_1);
  });

  it('uploads category image via multipart FormData and rejects oversized files with 400', async () => {
    const token = mockAdminAuth();

    vi.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation((_opts, cb) => ({
      end: () =>
        cb(null, {
          secure_url: 'https://res.cloudinary.com/demo/image/upload/categories/sample.png',
          public_id: 'categories/sample',
        }),
    }));

    vi.spyOn(Category, 'findOne').mockReturnValueOnce(createQueryMock(null));
    const createdDoc = {
      _id: CAT_ID_1,
      name: 'Photo Upload',
      slug: 'photo-upload',
      description: 'With uploaded image',
      icon: '',
      image: {
        url: 'https://res.cloudinary.com/demo/image/upload/categories/sample.png',
        publicId: 'categories/sample',
      },
      parent: null,
      isActive: true,
      sortOrder: 0,
    };
    const createSpy = vi.spyOn(Category, 'create').mockImplementationOnce(async (payload) => ({
      ...createdDoc,
      image: payload.image,
    }));
    vi.spyOn(Category, 'findById').mockReturnValueOnce(createQueryMock(createdDoc));
    vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([]);
    vi.spyOn(Category, 'aggregate').mockResolvedValueOnce([]);

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );

    const uploadRes = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Photo Upload')
      .field('description', 'With uploaded image')
      .field('parent', '')
      .field('sortOrder', '0')
      .field('isActive', 'true')
      .attach('image', pngBuffer, { filename: 'cat.png', contentType: 'image/png' });

    expect(uploadRes.status).toBe(201);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Photo Upload',
        slug: 'photo-upload',
        parent: null,
        image: expect.objectContaining({
          url: expect.stringContaining('https://'),
          publicId: expect.stringMatching(/^categories\//),
        }),
      })
    );
    expect(uploadRes.body.data.imageUrl).toContain('https://');

    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, 0);
    const oversizedRes = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Too Large')
      .attach('image', oversizedBuffer, { filename: 'huge.png', contentType: 'image/png' });

    expect(oversizedRes.status).toBe(400);
    expect(oversizedRes.body.message).toMatch(/5MB|large/i);
  });
});
