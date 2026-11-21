import crypto from 'crypto';
import mongoose from 'mongoose';
import { SupportTicket } from '../models/SupportTicket.model.js';

const UNSETTABLE_LEGACY_FIELDS = new Set([
  'ticketNumber',
  'ticketCode',
  'code',
  'slug',
  'ticket',
]);

const isCollectionInteractive = (collection, methodName) =>
  mongoose.connection?.readyState === 1 || Boolean(collection?.[methodName]?.mock);

export const generateSupportTicketCode = () =>
  `TCK-${Date.now().toString(36).toUpperCase().slice(-5)}-${crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;

export const isDuplicateKeyError = (err) => {
  const code = err?.code ?? err?.errorResponse?.code;
  return (
    code === 11000 ||
    code === 11001 ||
    String(err?.message || '').includes('E11000')
  );
};

export const getSupportTicketDuplicateFields = (err) => {
  const fields = new Set([
    ...Object.keys(err?.keyPattern || {}),
    ...Object.keys(err?.keyValue || {}),
    ...Object.keys(err?.errorResponse?.keyPattern || {}),
    ...Object.keys(err?.errorResponse?.keyValue || {}),
  ]);

  const msg = String(err?.message || '');
  const indexMatch = msg.match(/index:\s*([a-zA-Z0-9_.-]+)/i);
  if (indexMatch?.[1]) {
    const cleanField = indexMatch[1].replace(/_-?\d+$/, '');
    if (cleanField && cleanField !== '$*') {
      fields.add(cleanField);
    }
  }

  const dupKeyMatch = msg.match(/dup key:\s*\{\s*([a-zA-Z0-9_.-]+)\s*:/i);
  if (dupKeyMatch?.[1]) {
    fields.add(dupKeyMatch[1]);
  }

  return Array.from(fields);
};

const isCanonicalTicketIdIndex = (idx) => {
  if (!idx || idx.name === '_id_') return true;
  if (!idx.key || typeof idx.key !== 'object') return false;
  const keys = Object.keys(idx.key);
  return keys.length === 1 && keys[0] === 'ticketId';
};

export const dropStaleSupportTicketUniqueIndexes = async (
  collection = SupportTicket.collection
) => {
  if (
    !collection ||
    typeof collection.indexes !== 'function' ||
    !isCollectionInteractive(collection, 'indexes')
  ) {
    return false;
  }

  let dropped = false;
  try {
    const indexes = await collection.indexes();
    for (const idx of indexes || []) {
      if (!idx?.unique || isCanonicalTicketIdIndex(idx)) continue;
      if (typeof collection.dropIndex === 'function') {
        await collection.dropIndex(idx.name);
        dropped = true;
      }
    }
  } catch {
    // Safe non-blocking fallback if collection metadata cannot be modified
  }
  return dropped;
};

export const createSupportTicketWithRetry = async (ticketPayload = {}) => {
  let currentTicketId = ticketPayload.ticketId || generateSupportTicketCode();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await SupportTicket.create({
        ...ticketPayload,
        ticketId: currentTicketId,
      });
    } catch (err) {
      if (!isDuplicateKeyError(err) || attempt === 3) {
        throw err;
      }

      const dupFields = getSupportTicketDuplicateFields(err);
      const collection = SupportTicket.collection;

      if (isCollectionInteractive(collection, 'updateMany')) {
        for (const field of dupFields) {
          if (UNSETTABLE_LEGACY_FIELDS.has(field)) {
            try {
              await collection.updateMany(
                { $or: [{ [field]: null }, { [field]: '' }] },
                { $unset: { [field]: '' } }
              );
            } catch {
              // Ignore cleanup errors and proceed to index healing
            }
          }
        }
      }

      const dropped = await dropStaleSupportTicketUniqueIndexes(collection);
      if (dropped) {
        continue;
      }

      if (
        dupFields.some((f) => f.toLowerCase() === 'ticketid') ||
        String(err?.message || '').toLowerCase().includes('ticketid')
      ) {
        currentTicketId = generateSupportTicketCode();
        continue;
      }

      throw err;
    }
  }

  return SupportTicket.create({
    ...ticketPayload,
    ticketId: currentTicketId,
  });
};
