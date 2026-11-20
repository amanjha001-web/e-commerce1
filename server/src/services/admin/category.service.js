import mongoose from 'mongoose';
import { Category } from '../../models/Category.model.js';
import { Product } from '../../models/Product.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination, slugify } from '../../utils/helpers.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';

const ensureValidObjectId = (id, label = 'Category ID') => {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

const toPlain = (doc) => (doc?.toObject ? doc.toObject() : { ...(doc || {}) });

const buildCategoryPayload = (doc, countMap = new Map(), childCountMap = new Map()) => {
  const raw = toPlain(doc);
  const idKey = String(raw._id || '');
  const counts = countMap.get(idKey) || { productCount: 0, publishedProductCount: 0 };
  const parentObj =
    raw.parent && typeof raw.parent === 'object' ? toPlain(raw.parent) : null;
  const imageUrl =
    (typeof raw.image === 'string' ? raw.image : raw.image?.url) || '';

  return {
    ...raw,
    imageUrl,
    parentName: parentObj?.name || '',
    isActive: raw.isActive !== false,
    productCount: counts.productCount,
    productsCount: counts.productCount,
    publishedProductCount: counts.publishedProductCount,
    subcategoryCount: childCountMap.get(idKey) || 0,
  };
};

const enrichCategories = async (docs = []) => {
  if (!docs || docs.length === 0) return [];
  const categoryIds = docs.map((c) => c._id).filter(Boolean);

  const [productAggRes, childAggRes] = await Promise.allSettled([
    Promise.resolve().then(() =>
      Product.aggregate([
        { $match: { category: { $in: categoryIds } } },
        {
          $group: {
            _id: '$category',
            productCount: { $sum: 1 },
            publishedProductCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'published'] },
                      { $ne: ['$isActive', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
    ),
    Promise.resolve().then(() =>
      Category.aggregate([
        { $match: { parent: { $in: categoryIds } } },
        { $group: { _id: '$parent', count: { $sum: 1 } } },
      ])
    ),
  ]);

  const countMap = new Map();
  if (productAggRes.status === 'fulfilled' && Array.isArray(productAggRes.value)) {
    for (const row of productAggRes.value) {
      if (row?._id) {
        countMap.set(String(row._id), {
          productCount: Number(row.productCount || 0),
          publishedProductCount: Number(row.publishedProductCount || 0),
        });
      }
    }
  }

  const childCountMap = new Map();
  if (childAggRes.status === 'fulfilled' && Array.isArray(childAggRes.value)) {
    for (const row of childAggRes.value) {
      if (row?._id) childCountMap.set(String(row._id), Number(row.count || 0));
    }
  }

  return docs.map((doc) => buildCategoryPayload(doc, countMap, childCountMap));
};

export class AdminCategoryService {
  async getCategories(params = {}) {
    const { page, limit, skip } = parsePagination({ ...params, limit: params.limit || 50 });
    const filter = {};

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      const normalized = String(params.status).trim().toLowerCase();
      if (['archived', 'inactive', 'disabled'].includes(normalized)) {
        filter.isActive = false;
      } else if (normalized === 'active') {
        filter.isActive = { $ne: false };
      }
    }

    if (params.parent !== undefined && params.parent !== '') {
      if (params.parent === 'null' || params.parent === 'root') {
        filter.parent = null;
      } else {
        ensureValidObjectId(params.parent, 'Parent Category ID');
        filter.parent = params.parent;
      }
    }

    if (params.search && String(params.search).trim()) {
      const regex = { $regex: String(params.search).trim(), $options: 'i' };
      filter.$or = [{ name: regex }, { slug: regex }, { description: regex }];
    }

    const [categories, total, totalAll, activeCount, archivedCount, distinctProductCount] =
      await Promise.all([
        Category.find(filter)
          .populate('parent', 'name slug')
          .sort({ sortOrder: 1, name: 1 })
          .skip(skip)
          .limit(limit),
        Category.countDocuments(filter),
        Category.countDocuments({}),
        Category.countDocuments({ isActive: { $ne: false } }),
        Category.countDocuments({ isActive: false }),
        Promise.resolve()
          .then(() => Product.countDocuments({ category: { $ne: null } }))
          .catch(() => 0),
      ]);

    const enriched = await enrichCategories(categories);
    const resolvedTotal =
      Number(totalAll || 0) || Number(activeCount || 0) + Number(archivedCount || 0);

    return {
      categories: enriched,
      summary: {
        total: resolvedTotal,
        active: Number(activeCount || 0),
        archived: Number(archivedCount || 0),
        totalCategorizedProducts: Number(distinctProductCount || 0),
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCategoryById(categoryId) {
    ensureValidObjectId(categoryId, 'Category ID');

    const category = await Category.findById(categoryId).populate('parent', 'name slug');
    if (!category) throw ApiError.notFound('Category not found');

    const enriched = await enrichCategories([category]);
    return enriched[0];
  }

  async createCategory(body = {}, file = null) {
    const cleanName = String(body.name || '').trim();
    if (!cleanName) throw ApiError.badRequest('Category name is required');

    const resolvedSlug = slugify(body.slug ? String(body.slug).trim() : cleanName);
    if (!resolvedSlug) throw ApiError.badRequest('Valid category slug is required');

    const existing = await Promise.resolve()
      .then(() =>
        Category.findOne({
          $or: [
            { slug: resolvedSlug },
            { name: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          ],
        })
          .select('_id')
          .lean()
      )
      .catch(() => null);
    if (existing) {
      throw ApiError.conflict('A category with this name or slug already exists');
    }

    let parentId = null;
    if (
      body.parent &&
      !['null', 'undefined', ''].includes(String(body.parent).trim())
    ) {
      ensureValidObjectId(body.parent, 'Parent Category ID');
      const parentExists = await Category.findById(body.parent).select('_id').lean();
      if (!parentExists) throw ApiError.badRequest('Selected parent category does not exist');
      parentId = body.parent;
    }

    let imageObj = { url: '', publicId: '' };
    if (file?.buffer) {
      try {
        const uploaded = await uploadToCloudinary(file.buffer, 'categories');
        imageObj = { url: uploaded.url, publicId: uploaded.publicId };
      } catch (uploadErr) {
        throw ApiError.badRequest(
          uploadErr?.message || 'Failed to upload category image to media storage'
        );
      }
    } else if (body.imageUrl !== undefined || typeof body.image === 'string') {
      imageObj = { url: String(body.imageUrl ?? body.image ?? '').trim(), publicId: '' };
    } else if (body.image && typeof body.image === 'object') {
      imageObj = {
        url: String(body.image.url || '').trim(),
        publicId: String(body.image.publicId || '').trim(),
      };
    }

    const isActive =
      body.isActive !== undefined
        ? body.isActive === true || String(body.isActive) === 'true'
        : true;
    const sortOrder =
      body.sortOrder !== undefined && body.sortOrder !== ''
        ? Number(body.sortOrder)
        : 0;
    if (Number.isNaN(sortOrder)) {
      throw ApiError.badRequest('Sort order must be a valid number');
    }

    const created = await Category.create({
      name: cleanName,
      slug: resolvedSlug,
      description: String(body.description || '').trim(),
      icon: String(body.icon || '').trim(),
      image: imageObj,
      parent: parentId,
      isActive,
      sortOrder,
    });

    return this.getCategoryById(created._id);
  }

  async updateCategory(categoryId, body = {}, file = null) {
    ensureValidObjectId(categoryId, 'Category ID');

    const category = await Category.findById(categoryId);
    if (!category) throw ApiError.notFound('Category not found');

    if (body.name !== undefined) {
      const cleanName = String(body.name).trim();
      if (!cleanName) throw ApiError.badRequest('Category name cannot be empty');
      category.name = cleanName;
      if (body.slug === undefined || String(body.slug).trim() === '') {
        category.slug = slugify(cleanName);
      }
    }

    if (body.slug !== undefined && String(body.slug).trim() !== '') {
      const cleanSlug = slugify(String(body.slug).trim());
      if (!cleanSlug) throw ApiError.badRequest('Invalid category slug');
      category.slug = cleanSlug;
    }

    const conflict = await Promise.resolve()
      .then(() =>
        Category.findOne({
          _id: { $ne: category._id },
          $or: [
            { slug: category.slug },
            { name: new RegExp(`^${category.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          ],
        })
          .select('_id')
          .lean()
      )
      .catch(() => null);
    if (conflict) {
      throw ApiError.conflict('Another category already uses this name or slug');
    }

    if (body.parent !== undefined) {
      if (
        !body.parent ||
        ['null', 'undefined', ''].includes(String(body.parent).trim())
      ) {
        category.parent = null;
      } else {
        ensureValidObjectId(body.parent, 'Parent Category ID');
        if (String(body.parent) === String(category._id)) {
          throw ApiError.badRequest('A category cannot be its own parent');
        }
        const parentExists = await Category.findById(body.parent).select('_id').lean();
        if (!parentExists) throw ApiError.badRequest('Selected parent category does not exist');
        category.parent = body.parent;
      }
    }

    if (body.description !== undefined) {
      category.description = String(body.description).trim();
    }
    if (body.icon !== undefined) {
      category.icon = String(body.icon).trim();
    }
    if (body.sortOrder !== undefined && body.sortOrder !== '') {
      const sortNum = Number(body.sortOrder);
      if (Number.isNaN(sortNum)) throw ApiError.badRequest('Sort order must be a valid number');
      category.sortOrder = sortNum;
    }
    if (body.isActive !== undefined) {
      category.isActive = body.isActive === true || String(body.isActive) === 'true';
    }

    if (file?.buffer) {
      if (category.image?.publicId) {
        deleteFromCloudinary(category.image.publicId).catch(() => {});
      }
      try {
        const uploaded = await uploadToCloudinary(file.buffer, 'categories');
        category.image = { url: uploaded.url, publicId: uploaded.publicId };
      } catch (uploadErr) {
        throw ApiError.badRequest(
          uploadErr?.message || 'Failed to upload category image to media storage'
        );
      }
    } else if (body.removeImage === true || String(body.removeImage) === 'true') {
      if (category.image?.publicId) {
        deleteFromCloudinary(category.image.publicId).catch(() => {});
      }
      category.image = { url: '', publicId: '' };
    } else if (body.imageUrl !== undefined || typeof body.image === 'string') {
      const url = String(body.imageUrl ?? body.image ?? '').trim();
      category.image = { url, publicId: url === category.image?.url ? category.image?.publicId || '' : '' };
    } else if (body.image && typeof body.image === 'object' && body.image.url !== undefined) {
      category.image = {
        url: String(body.image.url || '').trim(),
        publicId: String(body.image.publicId || '').trim(),
      };
    }

    await category.save({ validateModifiedOnly: true });
    return this.getCategoryById(category._id);
  }

  async updateCategoryStatus(categoryId, isActive) {
    ensureValidObjectId(categoryId, 'Category ID');

    const category = await Category.findById(categoryId);
    if (!category) throw ApiError.notFound('Category not found');

    category.isActive =
      isActive !== undefined ? isActive === true || String(isActive) === 'true' : !category.isActive;
    await category.save({ validateModifiedOnly: true });

    return this.getCategoryById(category._id);
  }

  async deleteCategory(categoryId) {
    ensureValidObjectId(categoryId, 'Category ID');

    const category = await Category.findById(categoryId);
    if (!category) throw ApiError.notFound('Category not found');

    const linkedProducts = await Promise.resolve()
      .then(() => Product.countDocuments({ category: category._id }))
      .catch(() => 0);

    if (linkedProducts > 0) {
      throw ApiError.badRequest(
        `Cannot delete category while ${linkedProducts} product(s) are assigned. Archive it or move those products first.`
      );
    }

    await Promise.resolve()
      .then(() => Category.updateMany({ parent: category._id }, { $set: { parent: null } }))
      .catch(() => {});

    if (category.image?.publicId) {
      deleteFromCloudinary(category.image.publicId).catch(() => {});
    }

    await Category.findByIdAndDelete(category._id);
    return {
      message: 'Category deleted successfully',
      deletedCategoryId: category._id,
    };
  }
}

export const adminCategoryService = new AdminCategoryService();
export default adminCategoryService;
