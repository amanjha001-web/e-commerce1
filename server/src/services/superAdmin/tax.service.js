import { Tax } from '../../models/Tax.model.js';
import { ApiError } from '../../utils/apiError.js';

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const assertValidObjectId = (id, label = 'Tax ID') => {
  if (!id || !OBJECT_ID_REGEX.test(String(id).trim())) {
    throw ApiError.badRequest(`Invalid ${label} format`);
  }
};

export const formatTaxRule = (doc) => {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const code =
    String(raw.code || '').trim().toUpperCase() ||
    `${String(raw.type || 'TAX').toUpperCase()}${Number(raw.rate) || 0}`;

  return {
    ...raw,
    _id: raw._id,
    id: raw._id,
    name: raw.name || 'Tax Rule',
    code,
    type: String(raw.type || 'GST').trim().toUpperCase(),
    description: raw.description || '',
    rate: Number(raw.rate) || 0,
    country: raw.country || 'India',
    state: raw.state || 'ALL',
    isCompound: Boolean(raw.isCompound),
    isActive: raw.isActive !== false,
  };
};

export class SuperAdminTaxService {
  async getAll(params = {}) {
    const filter = {};
    if (params.isActive !== undefined && params.isActive !== '') {
      filter.isActive = String(params.isActive).toLowerCase() === 'true';
    }
    if (params.country && String(params.country).trim()) {
      filter.country = { $regex: String(params.country).trim(), $options: 'i' };
    }

    let query = Tax.find(filter);
    if (typeof query.sort === 'function') {
      query = query.sort({ rate: 1, createdAt: -1 });
    }
    if (typeof query.lean === 'function') {
      query = query.lean();
    }

    const taxes = await query;
    return Array.isArray(taxes) ? taxes.map(formatTaxRule) : [];
  }

  async getById(taxId) {
    assertValidObjectId(taxId);
    const tax = await Tax.findById(taxId);
    if (!tax) throw ApiError.notFound('Tax rule not found');
    return formatTaxRule(tax);
  }

  async create(taxData = {}) {
    const name = String(taxData.name || '').trim();
    if (!name) {
      throw ApiError.badRequest('Tax rule name is required');
    }

    const rate = Number(taxData.rate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      throw ApiError.badRequest('Tax rate must be between 0 and 100');
    }

    const code = String(taxData.code || '').trim().toUpperCase();
    if (code) {
      const existingCode = await Tax.findOne({ code });
      if (existingCode) {
        throw ApiError.conflict(`Tax code '${code}' already exists`);
      }
    }

    const created = await Tax.create({
      name,
      code,
      type: String(taxData.type || 'GST').trim().toUpperCase(),
      description: String(taxData.description || '').trim(),
      rate,
      country: String(taxData.country || 'India').trim() || 'India',
      state: String(taxData.state || 'ALL').trim() || 'ALL',
      isCompound: Boolean(taxData.isCompound),
      isActive: taxData.isActive !== undefined ? Boolean(taxData.isActive) : true,
    });

    return formatTaxRule(created);
  }

  async update(taxId, taxData = {}) {
    assertValidObjectId(taxId);

    const existing = await Tax.findById(taxId);
    if (!existing) throw ApiError.notFound('Tax rule not found');

    const updatePayload = { ...taxData };

    if (updatePayload.name !== undefined) {
      const cleanName = String(updatePayload.name).trim();
      if (!cleanName) throw ApiError.badRequest('Tax rule name cannot be empty');
      updatePayload.name = cleanName;
    }

    if (updatePayload.rate !== undefined) {
      const rate = Number(updatePayload.rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        throw ApiError.badRequest('Tax rate must be between 0 and 100');
      }
      updatePayload.rate = rate;
    }

    if (updatePayload.code !== undefined) {
      const cleanCode = String(updatePayload.code).trim().toUpperCase();
      if (cleanCode) {
        const duplicate = await Tax.findOne({
          code: cleanCode,
          _id: { $ne: taxId },
        });
        if (duplicate) {
          throw ApiError.conflict(`Tax code '${cleanCode}' already exists`);
        }
      }
      updatePayload.code = cleanCode;
    }

    if (updatePayload.type !== undefined) {
      updatePayload.type = String(updatePayload.type).trim().toUpperCase() || 'GST';
    }

    const tax = await Tax.findByIdAndUpdate(taxId, updatePayload, {
      new: true,
      runValidators: true,
    });
    if (!tax) throw ApiError.notFound('Tax rule not found');
    return formatTaxRule(tax);
  }

  async delete(taxId) {
    assertValidObjectId(taxId);
    const tax = await Tax.findByIdAndDelete(taxId);
    if (!tax) throw ApiError.notFound('Tax rule not found');
    return { message: 'Tax rule deleted successfully' };
  }

  async updateStatus(taxId, isActive) {
    assertValidObjectId(taxId);
    const tax = await Tax.findByIdAndUpdate(
      taxId,
      { isActive: Boolean(isActive) },
      { new: true }
    );
    if (!tax) throw ApiError.notFound('Tax rule not found');
    return formatTaxRule(tax);
  }
}

export const superAdminTaxService = new SuperAdminTaxService();
export default superAdminTaxService;
