import mongoose from 'mongoose';
import { SupportTicket } from '../../models/SupportTicket.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { Order } from '../../models/Order.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import {
  createSupportTicketWithRetry,
  generateSupportTicketCode,
} from '../../utils/supportTicket.utils.js';
import { notificationService } from '../common/notification.service.js';

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const VALID_STATUSES = new Set([
  'open',
  'pending',
  'in_progress',
  'waiting_for_customer',
  'resolved',
  'closed',
]);

const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);

const VALID_CATEGORIES = new Set([
  'order',
  'payment',
  'product',
  'account',
  'delivery',
  'payout',
  'general',
]);

const CATEGORY_ALIASES = {
  orders: 'order',
  payments: 'payment',
  products: 'product',
  accounts: 'account',
  shipping: 'delivery',
  deliveries: 'delivery',
  payouts: 'payout',
};

const STATUS_ALIASES = {
  waiting_customer: 'waiting_for_customer',
  'waiting-for-customer': 'waiting_for_customer',
  'waiting for customer': 'waiting_for_customer',
  'in-progress': 'in_progress',
  'in progress': 'in_progress',
};

const USER_POPULATE_FIELDS = 'fullName name username email phone avatar';
const ASSIGNEE_POPULATE_FIELDS = 'fullName name username email';
const SENDER_POPULATE_FIELDS = 'fullName name username email avatar role';
const ORDER_POPULATE_FIELDS = 'orderNumber orderStatus totalAmount createdAt';
const VENDOR_POPULATE_FIELDS = 'storeName slug email';

const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isModelQueryable = (model, method = 'find') =>
  mongoose.connection?.readyState === 1 || Boolean(model?.[method]?.mock);

const normalizeTicketStatus = (raw) => {
  const cleaned = String(raw || 'open').trim().toLowerCase().replace(/\s+/g, '_');
  const mapped = STATUS_ALIASES[cleaned] || cleaned;
  return VALID_STATUSES.has(mapped) ? mapped : null;
};

const normalizeCategory = (raw) => {
  const cleaned = String(raw || 'general').trim().toLowerCase();
  const mapped = CATEGORY_ALIASES[cleaned] || cleaned;
  return VALID_CATEGORIES.has(mapped) ? mapped : 'general';
};

const normalizePriority = (raw) => {
  const cleaned = String(raw || 'medium').trim().toLowerCase();
  return VALID_PRIORITIES.has(cleaned) ? cleaned : 'medium';
};

const buildVendorOwnershipFilter = (userId, vendorId = null) => {
  const ownerOr = [{ userId }, { user: userId }];
  if (vendorId) {
    ownerOr.push({ vendorId });
  }
  return { $or: ownerOr };
};

const buildVendorTicketFilter = (ticketId, userId, vendorId = null) => {
  const cleanId = String(ticketId || '').trim();
  const idConditions = [{ ticketId: cleanId }, { ticketNumber: cleanId }];
  if (mongoose.isValidObjectId(cleanId) && OBJECT_ID_REGEX.test(cleanId)) {
    idConditions.unshift({ _id: cleanId });
  }

  return {
    $and: [{ $or: idConditions }, buildVendorOwnershipFilter(userId, vendorId)],
  };
};

const populateTicketQuery = (query) => {
  if (typeof query?.populate !== 'function') return query;
  return query
    .populate('userId', USER_POPULATE_FIELDS)
    .populate('assignedTo', ASSIGNEE_POPULATE_FIELDS)
    .populate('messages.sender', SENDER_POPULATE_FIELDS)
    .populate('orderId', ORDER_POPULATE_FIELDS)
    .populate('vendorId', VENDOR_POPULATE_FIELDS);
};

export const sanitizeTicketForVendor = (doc) => {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete raw.internalNotes;

  const normalizedStatus = normalizeTicketStatus(raw.status) || 'open';
  const normalizedCategory = normalizeCategory(raw.category || raw.type);
  const normalizedPriority = normalizePriority(raw.priority);

  const rootDescription = String(raw.description || raw.message || raw.content || '').trim();
  const existingMessages = Array.isArray(raw.messages) ? raw.messages : [];
  const messages =
    existingMessages.length > 0
      ? existingMessages
      : rootDescription
        ? [
            {
              _id: `root-${raw._id || 'msg'}`,
              sender: raw.userId || null,
              message: rootDescription,
              createdAt: raw.createdAt || raw.updatedAt || new Date(),
            },
          ]
        : [];

  const assigneeObj =
    raw.assignedTo && typeof raw.assignedTo === 'object' ? raw.assignedTo : null;
  const assigneeName = assigneeObj
    ? assigneeObj.fullName || assigneeObj.name || assigneeObj.username || assigneeObj.email || 'Support Team'
    : '';

  const linkedOrder =
    raw.orderId && typeof raw.orderId === 'object' ? raw.orderId : null;
  const linkedVendor =
    raw.vendorId && typeof raw.vendorId === 'object' ? raw.vendorId : null;

  return {
    ...raw,
    _id: raw._id,
    id: raw._id,
    ticketId: raw.ticketId || raw.ticketNumber || String(raw._id || ''),
    subject: raw.subject || raw.title || 'Support Request',
    description: rootDescription,
    category: normalizedCategory,
    priority: normalizedPriority,
    status: normalizedStatus,
    requesterRole: raw.requesterRole || 'vendor',
    vendorStoreName: linkedVendor?.storeName || raw.vendorStoreName || '',
    orderNumber:
      raw.orderNumber ||
      linkedOrder?.orderNumber ||
      '',
    assigneeName,
    messages,
    messageCount: messages.length,
    resolution: raw.resolution || '',
    resolvedAt: raw.resolvedAt || null,
  };
};

export class VendorSupportService {
  async resolveVendorContext(userId) {
    if (!userId || !isModelQueryable(Vendor, 'findOne')) {
      return null;
    }

    try {
      let query = Vendor.findOne({ $or: [{ userId }, { user: userId }] });
      if (typeof query?.select === 'function') {
        query = query.select('_id userId storeName slug status');
      }
      if (typeof query?.lean === 'function') {
        query = query.lean();
      }
      return await query;
    } catch {
      return null;
    }
  }

  async resolveOptionalOrderReference(userId, vendor, payload = {}) {
    const rawOrderId = payload.orderId ? String(payload.orderId).trim() : '';
    const rawOrderNumber = payload.orderNumber
      ? String(payload.orderNumber).trim().replace(/^#/, '')
      : '';

    if (!rawOrderId && !rawOrderNumber) {
      return { orderId: undefined, orderNumber: '' };
    }

    if (rawOrderId && !OBJECT_ID_REGEX.test(rawOrderId)) {
      throw ApiError.badRequest('Invalid order ID format');
    }

    if (!isModelQueryable(Order, 'findOne')) {
      return {
        orderId: rawOrderId || undefined,
        orderNumber: rawOrderNumber,
      };
    }

    const orderFilter = rawOrderId
      ? { _id: rawOrderId }
      : { orderNumber: { $regex: `^${escapeRegex(rawOrderNumber)}$`, $options: 'i' } };

    let orderQuery = Order.findOne(orderFilter);
    if (typeof orderQuery?.select === 'function') {
      orderQuery = orderQuery.select('_id orderNumber vendorId vendor items.vendorId items.vendor userId');
    }
    if (typeof orderQuery?.lean === 'function') {
      orderQuery = orderQuery.lean();
    }

    const orderDoc = await orderQuery;

    if (!orderDoc) {
      if (rawOrderId) {
        throw ApiError.notFound('Referenced order not found');
      }
      return { orderId: undefined, orderNumber: rawOrderNumber };
    }

    const vendorRefs = new Set(
      [String(userId), vendor?._id ? String(vendor._id) : ''].filter(Boolean)
    );

    const hasOrderOwnership =
      vendorRefs.has(String(orderDoc.userId || '')) ||
      vendorRefs.has(String(orderDoc.vendorId || '')) ||
      vendorRefs.has(String(orderDoc.vendor || '')) ||
      (Array.isArray(orderDoc.items) &&
        orderDoc.items.some((item) =>
          vendorRefs.has(String(item?.vendorId?._id || item?.vendorId || item?.vendor || ''))
        ));

    if (!hasOrderOwnership) {
      if (rawOrderId) {
        throw ApiError.forbidden('You can only link orders belonging to your store');
      }
      return { orderId: undefined, orderNumber: rawOrderNumber };
    }

    return {
      orderId: orderDoc._id,
      orderNumber: orderDoc.orderNumber || rawOrderNumber,
    };
  }

  async getTickets(userId, params = {}) {
    const { page, limit, skip, sort } = parsePagination({
      ...params,
      limit: params.limit || 10,
    });

    const vendor = await this.resolveVendorContext(userId);
    const baseOwnership = buildVendorOwnershipFilter(userId, vendor?._id);
    const andConditions = [baseOwnership];

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      const normalizedStatus = normalizeTicketStatus(params.status);
      if (normalizedStatus === 'waiting_for_customer') {
        andConditions.push({
          status: { $in: ['waiting_for_customer', 'waiting_customer'] },
        });
      } else if (normalizedStatus) {
        andConditions.push({ status: normalizedStatus });
      }
    }

    if (params.category && String(params.category).toLowerCase() !== 'all') {
      andConditions.push({ category: normalizeCategory(params.category) });
    }

    if (params.priority && String(params.priority).toLowerCase() !== 'all') {
      andConditions.push({ priority: normalizePriority(params.priority) });
    }

    if (params.search && String(params.search).trim()) {
      const regex = {
        $regex: escapeRegex(String(params.search).trim()),
        $options: 'i',
      };
      andConditions.push({
        $or: [
          { ticketId: regex },
          { ticketNumber: regex },
          { subject: regex },
          { orderNumber: regex },
          { description: regex },
          { category: regex },
        ],
      });
    }

    const filter = andConditions.length > 1 ? { $and: andConditions } : baseOwnership;

    const effectiveSort =
      params.sort || params.sortBy ? sort : { updatedAt: -1, createdAt: -1 };

    let findQuery = populateTicketQuery(SupportTicket.find(filter));
    if (typeof findQuery?.sort === 'function') findQuery = findQuery.sort(effectiveSort);
    if (typeof findQuery?.skip === 'function') findQuery = findQuery.skip(skip);
    if (typeof findQuery?.limit === 'function') findQuery = findQuery.limit(limit);

    const [rawTickets, total] = await Promise.all([
      findQuery,
      SupportTicket.countDocuments(filter),
    ]);

    const safeCount = (cond) =>
      isModelQueryable(SupportTicket, 'countDocuments')
        ? Promise.resolve(SupportTicket.countDocuments({ $and: [baseOwnership, cond] }))
            .then((n) => Math.max(0, Number(n) || 0))
            .catch(() => 0)
        : Promise.resolve(0);

    const [
      allTotal,
      openCount,
      pendingCount,
      inProgressCount,
      waitingCount,
      resolvedCount,
      closedCount,
    ] = await Promise.all([
      safeCount({}),
      safeCount({ status: 'open' }),
      safeCount({ status: 'pending' }),
      safeCount({ status: 'in_progress' }),
      safeCount({ status: { $in: ['waiting_for_customer', 'waiting_customer'] } }),
      safeCount({ status: 'resolved' }),
      safeCount({ status: 'closed' }),
    ]);

    const tickets = Array.isArray(rawTickets)
      ? rawTickets.map((doc) => sanitizeTicketForVendor(doc))
      : [];
    const totalNum = Math.max(0, Number(total) || 0);

    return {
      tickets,
      summary: {
        total: allTotal || totalNum,
        open: openCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        waitingForReply: waitingCount,
        active: openCount + pendingCount + inProgressCount + waitingCount,
        resolved: resolvedCount,
        closed: closedCount,
      },
      pagination: {
        total: totalNum,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalNum / limit)),
      },
    };
  }

  async getTicketById(ticketId, userId) {
    const vendor = await this.resolveVendorContext(userId);
    const ticket = await populateTicketQuery(
      SupportTicket.findOne(buildVendorTicketFilter(ticketId, userId, vendor?._id))
    );

    if (!ticket) {
      throw ApiError.notFound('Support ticket not found');
    }

    return sanitizeTicketForVendor(ticket);
  }

  async createTicket(userId, payload = {}) {
    const subject = String(payload.subject || '').trim();
    const message = String(payload.message || payload.description || '').trim();

    if (!subject) {
      throw ApiError.badRequest('Subject is required');
    }
    if (subject.length < 3) {
      throw ApiError.badRequest('Subject must be at least 3 characters');
    }
    if (!message) {
      throw ApiError.badRequest('Message is required');
    }

    const vendor = await this.resolveVendorContext(userId);
    const { orderId, orderNumber } = await this.resolveOptionalOrderReference(
      userId,
      vendor,
      payload
    );

    const category = normalizeCategory(payload.category);
    const priority = normalizePriority(payload.priority);
    const ticketId = generateSupportTicketCode();

    const ticket = await createSupportTicketWithRetry({
      ticketId,
      userId,
      vendorId: vendor?._id,
      vendorStoreName: vendor?.storeName || '',
      requesterRole: 'vendor',
      subject,
      category,
      priority,
      description: message,
      ...(orderId ? { orderId } : {}),
      ...(orderNumber ? { orderNumber } : {}),
      status: 'open',
      messages: [
        {
          sender: userId,
          message,
          createdAt: new Date(),
        },
      ],
    });
    const resolvedTicketId = ticket.ticketId || ticketId;

    notificationService
      .createNotification({
        userId,
        title: `Seller Support Ticket #${resolvedTicketId}`,
        message: `Your support request "${subject}" was submitted. Our seller success team will respond shortly.`,
        type: 'system',
        link: '/vendor/support',
        data: { ticketId: ticket._id, ticketCode: resolvedTicketId, link: '/vendor/support' },
      })
      .catch(() => {});

    const storeLabel = vendor?.storeName ? ` (${vendor.storeName})` : '';
    notificationService
      .notifyAdmins({
        title: `New Seller Support Ticket #${resolvedTicketId}`,
        message: `Seller${storeLabel}: ${subject}`,
        type: 'system',
        link: '/admin/support',
        data: { ticketId: ticket._id, ticketCode: resolvedTicketId, requesterRole: 'vendor' },
      })
      .catch(() => {});

    if (typeof ticket.populate === 'function') {
      await ticket.populate([
        { path: 'userId', select: USER_POPULATE_FIELDS },
        { path: 'assignedTo', select: ASSIGNEE_POPULATE_FIELDS },
        { path: 'messages.sender', select: SENDER_POPULATE_FIELDS },
        { path: 'orderId', select: ORDER_POPULATE_FIELDS },
        { path: 'vendorId', select: VENDOR_POPULATE_FIELDS },
      ]);
    }

    return sanitizeTicketForVendor(ticket);
  }

  async addMessage(ticketId, userId, payload = {}) {
    const cleanMessage = String(payload.message || payload.content || '').trim();
    if (!cleanMessage) {
      throw ApiError.badRequest('Message cannot be empty');
    }

    const vendor = await this.resolveVendorContext(userId);
    const ticket = await SupportTicket.findOne(
      buildVendorTicketFilter(ticketId, userId, vendor?._id)
    );

    if (!ticket) {
      throw ApiError.notFound('Support ticket not found');
    }

    const currentStatus = normalizeTicketStatus(ticket.status) || 'open';
    if (currentStatus === 'closed') {
      throw ApiError.badRequest('Cannot reply to a closed ticket. Please reopen it first.');
    }

    ticket.messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    ticket.messages.push({
      sender: userId,
      message: cleanMessage,
      createdAt: new Date(),
    });

    if (currentStatus === 'waiting_for_customer' || currentStatus === 'resolved') {
      ticket.status = 'open';
      if (currentStatus === 'resolved') {
        ticket.resolvedAt = null;
      }
    }

    await ticket.save();

    if (ticket.assignedTo) {
      notificationService
        .createNotification({
          userId: ticket.assignedTo,
          title: `Seller Reply (#${ticket.ticketId})`,
          message: `New seller reply on "${ticket.subject}": ${cleanMessage.slice(0, 120)}`,
          type: 'system',
          link: '/admin/support',
          data: { ticketId: ticket._id, ticketCode: ticket.ticketId, link: '/admin/support' },
        })
        .catch(() => {});
    } else {
      notificationService
        .notifyAdmins({
          title: `Seller Reply (#${ticket.ticketId})`,
          message: `New seller reply on "${ticket.subject}": ${cleanMessage.slice(0, 120)}`,
          type: 'system',
          link: '/admin/support',
          data: { ticketId: ticket._id, ticketCode: ticket.ticketId, link: '/admin/support' },
        })
        .catch(() => {});
    }

    if (typeof ticket.populate === 'function') {
      await ticket.populate([
        { path: 'userId', select: USER_POPULATE_FIELDS },
        { path: 'assignedTo', select: ASSIGNEE_POPULATE_FIELDS },
        { path: 'messages.sender', select: SENDER_POPULATE_FIELDS },
        { path: 'orderId', select: ORDER_POPULATE_FIELDS },
        { path: 'vendorId', select: VENDOR_POPULATE_FIELDS },
      ]);
    }

    return sanitizeTicketForVendor(ticket);
  }

  async closeTicket(ticketId, userId) {
    const vendor = await this.resolveVendorContext(userId);
    const ticket = await populateTicketQuery(
      SupportTicket.findOneAndUpdate(
        buildVendorTicketFilter(ticketId, userId, vendor?._id),
        { status: 'closed' },
        { new: true }
      )
    );

    if (!ticket) {
      throw ApiError.notFound('Support ticket not found');
    }

    return sanitizeTicketForVendor(ticket);
  }

  async reopenTicket(ticketId, userId) {
    const vendor = await this.resolveVendorContext(userId);
    const ticket = await populateTicketQuery(
      SupportTicket.findOneAndUpdate(
        buildVendorTicketFilter(ticketId, userId, vendor?._id),
        { status: 'open', resolvedAt: null },
        { new: true }
      )
    );

    if (!ticket) {
      throw ApiError.notFound('Support ticket not found');
    }

    return sanitizeTicketForVendor(ticket);
  }
}

export const vendorSupportService = new VendorSupportService();
export default vendorSupportService;
