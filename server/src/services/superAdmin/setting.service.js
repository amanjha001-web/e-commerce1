import mongoose from 'mongoose';
import { AuditLog } from '../../models/AuditLog.model.js';
import { ApiError } from '../../utils/apiError.js';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSetting =
  mongoose.models.SystemSetting || mongoose.model('SystemSetting', settingSchema);

export const DEFAULT_SYSTEM_SETTINGS = {
  STORE_NAME: 'ShopSphere',
  SITE_DESCRIPTION: 'Curated essentials, elevated everyday style, and multi-vendor marketplace.',
  SUPPORT_EMAIL: 'support@shopsphere.com',
  CONTACT_NUMBER: '+91 98765 43210',
  CURRENCY: 'INR (₹)',
  TIMEZONE: 'Asia/Kolkata',
  LANGUAGE: 'en',
  SHIPPING_THRESHOLD: 999,
  DEFAULT_SHIPPING_FEE: 50,
  DEFAULT_TAX_RATE: 18,
  MAINTENANCE_MODE: false,
  ALLOW_REGISTRATION: true,
  ALLOW_VENDOR_REGISTRATION: true,
  AUTO_APPROVE_VENDORS: false,
  AUTO_APPROVE_PRODUCTS: false,
  EMAIL_NOTIFICATIONS: true,
  NEW_ORDER_ALERT: true,
  VENDOR_REQUEST_ALERT: true,
  SUPPORT_TICKET_ALERT: true,
  LOW_STOCK_ALERT: true,
  TWO_FACTOR_REQUIRED: false,
  LOGIN_ALERTS: true,
  SESSION_TIMEOUT_MINUTES: 30,
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8,
  THEME_NAME: 'Burgundy Luxury',
  PRIMARY_COLOR: '#881337',
  ACCENT_COLOR: '#B68D40',
};

export const PUBLIC_SETTING_KEYS = [
  'STORE_NAME',
  'SITE_DESCRIPTION',
  'SUPPORT_EMAIL',
  'CONTACT_NUMBER',
  'CURRENCY',
  'TIMEZONE',
  'LANGUAGE',
  'SHIPPING_THRESHOLD',
  'DEFAULT_SHIPPING_FEE',
  'DEFAULT_TAX_RATE',
  'MAINTENANCE_MODE',
  'ALLOW_REGISTRATION',
  'ALLOW_VENDOR_REGISTRATION',
  'THEME_NAME',
  'PRIMARY_COLOR',
  'ACCENT_COLOR',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateAndCoerceSetting = (rawKey, rawValue) => {
  const key = String(rawKey || '').trim().toUpperCase();
  if (!key) {
    throw ApiError.badRequest('Setting key cannot be empty');
  }

  let value = rawValue;

  if (key === 'SUPPORT_EMAIL' && value !== '' && value !== null && value !== undefined) {
    const emailStr = String(value).trim();
    if (!EMAIL_REGEX.test(emailStr)) {
      throw ApiError.badRequest('Please enter a valid support email address');
    }
    value = emailStr;
  } else if (key === 'SHIPPING_THRESHOLD' || key === 'DEFAULT_SHIPPING_FEE') {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      throw ApiError.badRequest(`${key.replace(/_/g, ' ')} must be 0 or greater`);
    }
    value = num;
  } else if (key === 'DEFAULT_TAX_RATE') {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0 || num > 100) {
      throw ApiError.badRequest('Default tax rate must be between 0 and 100');
    }
    value = num;
  } else if (key === 'SESSION_TIMEOUT_MINUTES') {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 5 || num > 1440) {
      throw ApiError.badRequest('Session timeout must be between 5 and 1440 minutes');
    }
    value = Math.trunc(num);
  } else if (key === 'MAX_LOGIN_ATTEMPTS') {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 1 || num > 20) {
      throw ApiError.badRequest('Max login attempts must be between 1 and 20');
    }
    value = Math.trunc(num);
  } else if (key === 'PASSWORD_MIN_LENGTH') {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 6 || num > 32) {
      throw ApiError.badRequest('Minimum password length must be between 6 and 32');
    }
    value = Math.trunc(num);
  } else if (
    typeof DEFAULT_SYSTEM_SETTINGS[key] === 'boolean' &&
    typeof value === 'string'
  ) {
    value = value.toLowerCase() === 'true';
  }

  return { key, value };
};

const valuesDiffer = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

export class SettingService {
  async getSettings() {
    const list =
      mongoose.connection?.readyState === 1 || SystemSetting.find?.mock
        ? await SystemSetting.find()
        : [];
    const settingsObj = { ...DEFAULT_SYSTEM_SETTINGS };
    if (Array.isArray(list)) {
      list.forEach((s) => {
        if (s?.key) {
          settingsObj[String(s.key).trim().toUpperCase()] = s.value;
        }
      });
    }
    return settingsObj;
  }

  async getPublicSettings() {
    const all = await this.getSettings();
    const publicObj = {};
    for (const key of PUBLIC_SETTING_KEYS) {
      publicObj[key] = all[key];
    }
    return publicObj;
  }

  async getSettingByKey(key) {
    const cleanKey = String(key || '').trim().toUpperCase();
    const setting = await SystemSetting.findOne({ key: cleanKey });
    if (setting) return setting.value;
    return Object.prototype.hasOwnProperty.call(DEFAULT_SYSTEM_SETTINGS, cleanKey)
      ? DEFAULT_SYSTEM_SETTINGS[cleanKey]
      : null;
  }

  async getSettingsHistory(params = {}) {
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    if (mongoose.connection?.readyState !== 1 && !AuditLog.find?.mock) {
      return { history: [], total: 0 };
    }

    let query = AuditLog.find({ resource: 'SETTING' });
    if (typeof query.populate === 'function') {
      query = query.populate('userId', 'fullName name email role');
    }
    if (typeof query.sort === 'function') {
      query = query.sort({ createdAt: -1 });
    }
    if (typeof query.limit === 'function') {
      query = query.limit(limit);
    }
    if (typeof query.lean === 'function') {
      query = query.lean();
    }

    const logs = await query;
    const list = Array.isArray(logs) ? logs : [];
    const history = list.map((log) => ({
      _id: log._id,
      key: log.details?.key || log.resourceId || 'SETTING',
      oldValue: log.changes?.before ?? null,
      newValue: log.changes?.after ?? null,
      action: log.action || 'SETTING_UPDATED',
      changedBy:
        log.userId?.fullName ||
        log.userId?.name ||
        log.userId?.email ||
        'Admin',
      createdAt: log.createdAt,
    }));

    return { history, total: history.length };
  }

  async updateSetting(rawKey, rawValue, actor = {}) {
    const { key, value } = validateAndCoerceSetting(rawKey, rawValue);
    const existing = await SystemSetting.findOne({ key });
    const previousValue = existing
      ? existing.value
      : DEFAULT_SYSTEM_SETTINGS[key] ?? null;

    const updated = await SystemSetting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );

    if (valuesDiffer(previousValue, value)) {
      await AuditLog.create({
        userId: actor.userId || undefined,
        action: existing ? 'SETTING_UPDATED' : 'SETTING_CREATED',
        resource: 'SETTING',
        resourceId: key,
        ipAddress: actor.ipAddress || '',
        userAgent: actor.userAgent || '',
        changes: { before: previousValue, after: value },
        details: { key },
      }).catch(() => {});
    }

    return updated;
  }

  async updateMultipleSettings(settingsData = {}, actor = {}) {
    if (!settingsData || typeof settingsData !== 'object' || Array.isArray(settingsData)) {
      throw ApiError.badRequest('Settings payload must be an object of key-value pairs');
    }

    const entries = Object.entries(settingsData).map(([rawKey, rawValue]) =>
      validateAndCoerceSetting(rawKey, rawValue)
    );

    if (entries.length === 0) {
      return this.getSettings();
    }

    const keys = entries.map((e) => e.key);
    const existingList = await SystemSetting.find({ key: { $in: keys } }).catch(() => []);
    const existingMap = new Map(
      (Array.isArray(existingList) ? existingList : []).map((doc) => [doc.key, doc.value])
    );

    const operations = entries.map(({ key, value }) => ({
      updateOne: {
        filter: { key },
        update: { value },
        upsert: true,
      },
    }));

    await SystemSetting.bulkWrite(operations);

    const auditDocs = entries
      .map(({ key, value }) => {
        const hasStored = existingMap.has(key);
        const before = hasStored
          ? existingMap.get(key)
          : DEFAULT_SYSTEM_SETTINGS[key] ?? null;
        if (!valuesDiffer(before, value)) return null;
        return {
          userId: actor.userId || undefined,
          action: hasStored ? 'SETTING_UPDATED' : 'SETTING_CREATED',
          resource: 'SETTING',
          resourceId: key,
          ipAddress: actor.ipAddress || '',
          userAgent: actor.userAgent || '',
          changes: { before, after: value },
          details: { key },
        };
      })
      .filter(Boolean);

    if (auditDocs.length > 0) {
      await AuditLog.insertMany(auditDocs).catch(() => {});
    }

    return this.getSettings();
  }
}

export const settingService = new SettingService();
export default settingService;
