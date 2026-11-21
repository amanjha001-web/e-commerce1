import { ShippingZone } from '../../models/ShippingZone.model.js';
import { ApiError } from '../../utils/apiError.js';

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const assertValidObjectId = (id, label = 'Shipping Zone ID') => {
  if (!id || !OBJECT_ID_REGEX.test(String(id).trim())) {
    throw ApiError.badRequest(`Invalid ${label} format`);
  }
};

const parseStringList = (input, fallback = []) => {
  if (input === undefined || input === null) return fallback;
  if (Array.isArray(input)) {
    return input.map((v) => String(v || '').trim()).filter(Boolean);
  }
  return String(input)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

export const formatShippingZone = (doc) => {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const rate = Math.max(0, Number(raw.rate ?? raw.shippingCharge ?? 0) || 0);
  const freeShippingThreshold = Math.max(
    0,
    Number(raw.freeShippingThreshold ?? raw.freeShippingAbove ?? 0) || 0
  );
  const postalCodes = Array.isArray(raw.postalCodes)
    ? raw.postalCodes
    : Array.isArray(raw.pincodes)
      ? raw.pincodes
      : [];

  return {
    ...raw,
    _id: raw._id,
    id: raw._id,
    name: raw.name || 'Standard Zone',
    countries: Array.isArray(raw.countries) && raw.countries.length > 0 ? raw.countries : ['India'],
    states: Array.isArray(raw.states) ? raw.states : [],
    postalCodes,
    pincodes: postalCodes,
    rate,
    shippingCharge: rate,
    freeShippingThreshold,
    freeShippingAbove: freeShippingThreshold,
    estimatedDays: {
      min: Math.max(1, Number(raw.estimatedDays?.min) || 2),
      max: Math.max(1, Number(raw.estimatedDays?.max) || 5),
    },
    isActive: raw.isActive !== false,
  };
};

export class SuperAdminShippingService {
  async getAll(params = {}) {
    const filter = {};
    if (params.isActive !== undefined && params.isActive !== '') {
      filter.isActive = String(params.isActive).toLowerCase() === 'true';
    }

    let query = ShippingZone.find(filter);
    if (typeof query.sort === 'function') {
      query = query.sort({ createdAt: -1 });
    }
    if (typeof query.lean === 'function') {
      query = query.lean();
    }

    const zones = await query;
    return Array.isArray(zones) ? zones.map(formatShippingZone) : [];
  }

  async getById(zoneId) {
    assertValidObjectId(zoneId);
    const zone = await ShippingZone.findById(zoneId);
    if (!zone) throw ApiError.notFound('Shipping zone not found');
    return formatShippingZone(zone);
  }

  async create(zoneData = {}) {
    const name = String(zoneData.name || '').trim();
    if (!name) {
      throw ApiError.badRequest('Shipping zone name is required');
    }

    const rate = Number(zoneData.rate ?? zoneData.shippingCharge ?? zoneData.charge ?? 0);
    if (!Number.isFinite(rate) || rate < 0) {
      throw ApiError.badRequest('Shipping rate must be 0 or greater');
    }

    const freeShippingThreshold = Number(
      zoneData.freeShippingThreshold ?? zoneData.freeShippingAbove ?? 0
    );
    if (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
      throw ApiError.badRequest('Free shipping threshold cannot be negative');
    }

    const countries = parseStringList(zoneData.countries, ['India']);
    const states = parseStringList(zoneData.states, []);
    const postalCodes = parseStringList(zoneData.postalCodes ?? zoneData.pincodes, []);

    const minDays = Math.max(1, Number(zoneData.estimatedDays?.min) || 2);
    const maxDays = Math.max(minDays, Number(zoneData.estimatedDays?.max) || 5);

    const created = await ShippingZone.create({
      name,
      countries: countries.length > 0 ? countries : ['India'],
      states,
      postalCodes,
      rate,
      freeShippingThreshold,
      estimatedDays: { min: minDays, max: maxDays },
      isActive: zoneData.isActive !== undefined ? Boolean(zoneData.isActive) : true,
    });

    return formatShippingZone(created);
  }

  async update(zoneId, zoneData = {}) {
    assertValidObjectId(zoneId);

    const existing = await ShippingZone.findById(zoneId);
    if (!existing) throw ApiError.notFound('Shipping zone not found');

    const updatePayload = {};

    if (zoneData.name !== undefined) {
      const cleanName = String(zoneData.name).trim();
      if (!cleanName) throw ApiError.badRequest('Shipping zone name cannot be empty');
      updatePayload.name = cleanName;
    }

    const incomingRate = zoneData.rate ?? zoneData.shippingCharge ?? zoneData.charge;
    if (incomingRate !== undefined) {
      const rate = Number(incomingRate);
      if (!Number.isFinite(rate) || rate < 0) {
        throw ApiError.badRequest('Shipping rate must be 0 or greater');
      }
      updatePayload.rate = rate;
    }

    const incomingFree = zoneData.freeShippingThreshold ?? zoneData.freeShippingAbove;
    if (incomingFree !== undefined) {
      const threshold = Number(incomingFree);
      if (!Number.isFinite(threshold) || threshold < 0) {
        throw ApiError.badRequest('Free shipping threshold cannot be negative');
      }
      updatePayload.freeShippingThreshold = threshold;
    }

    if (zoneData.countries !== undefined) {
      const countries = parseStringList(zoneData.countries, ['India']);
      updatePayload.countries = countries.length > 0 ? countries : ['India'];
    }
    if (zoneData.states !== undefined) {
      updatePayload.states = parseStringList(zoneData.states, []);
    }
    if (zoneData.postalCodes !== undefined || zoneData.pincodes !== undefined) {
      updatePayload.postalCodes = parseStringList(
        zoneData.postalCodes ?? zoneData.pincodes,
        []
      );
    }
    if (zoneData.estimatedDays !== undefined) {
      const minDays = Math.max(1, Number(zoneData.estimatedDays?.min) || 2);
      const maxDays = Math.max(minDays, Number(zoneData.estimatedDays?.max) || 5);
      updatePayload.estimatedDays = { min: minDays, max: maxDays };
    }
    if (zoneData.isActive !== undefined) {
      updatePayload.isActive = Boolean(zoneData.isActive);
    }

    const zone = await ShippingZone.findByIdAndUpdate(zoneId, updatePayload, {
      new: true,
      runValidators: true,
    });
    if (!zone) throw ApiError.notFound('Shipping zone not found');
    return formatShippingZone(zone);
  }

  async delete(zoneId) {
    assertValidObjectId(zoneId);
    const zone = await ShippingZone.findByIdAndDelete(zoneId);
    if (!zone) throw ApiError.notFound('Shipping zone not found');
    return { message: 'Shipping zone deleted successfully' };
  }

  async updateStatus(zoneId, isActive) {
    assertValidObjectId(zoneId);
    const zone = await ShippingZone.findByIdAndUpdate(
      zoneId,
      { isActive: Boolean(isActive) },
      { new: true }
    );
    if (!zone) throw ApiError.notFound('Shipping zone not found');
    return formatShippingZone(zone);
  }
}

export const superAdminShippingService = new SuperAdminShippingService();
export default superAdminShippingService;
