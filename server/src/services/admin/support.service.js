import mongoose from 'mongoose';
import { SupportTicket } from '../../models/SupportTicket.model.js';
import { User } from '../../models/User.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
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
const NOTE_AUTHOR_POPULATE_FIELDS = 'fullName name username email role';

const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatDisplayName = (user, fallback = 'Customer') =>
  user?.fullName || user?.name || user?.username || user?.email || fallback;

export const normalizeSupportStatus = (raw) => {
  const val = String(raw || 'open').trim().toLowerCase().replace(/\s+/g, '_');
  const mapped = STATUS_ALIASES[val] || val;
  return VALID_STATUSES.has(mapped) ? mapped : null;
};

const extractPlainId = (val) => {
  if (!val) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return OBJECT_ID_REGEX.test(trimmed) ? trimmed : null;
  }
  if (typeof val === 'object') {
    if (val._id && typeof val._id === 'object' && typeof val._id.toString === 'function') {
      const s = val._id.toString();
      return OBJECT_ID_REGEX.test(s) ? s : null;
    }
    if (val.email || val.fullName || val.name || val.username) {
      return null; // Already populated
    }
    if (typeof val.toString === 'function') {
      const s = val.toString();
      return OBJECT_ID_REGEX.test(s) ? s : null;
    }
  }
  return null;
};

const buildAdminTicketFilter = (ticketId) => {
  const cleanId = String(ticketId || '').trim();
  const orConditions = [{ ticketId: cleanId }, { ticketNumber: cleanId }];
  if (mongoose.isValidObjectId(cleanId) && OBJECT_ID_REGEX.test(cleanId)) {
    orConditions.unshift({ _id: cleanId });
  }
  return { $or: orConditions };
};

const hydrateLegacyUsersForTickets = async (tickets = []) => {
  if (mongoose.connection?.readyState !== 1) {
    return new Map();
  }
  const missingIds = new Set();

  for (const t of tickets) {
    const raw = typeof t?.toObject === 'function' ? t.toObject() : t;
    if (!raw) continue;

    for (const field of ['userId', 'user', 'customerId', 'customer', 'requester', 'assignedTo']) {
      const unpopulatedId = extractPlainId(raw[field]);
      if (unpopulatedId) {
        missingIds.add(unpopulatedId);
      }
    }
  }

  if (missingIds.size === 0) return new Map();

  try {
    let userQuery = User.find({ _id: { $in: Array.from(missingIds) } });
    if (typeof userQuery?.select === 'function') {
      userQuery = userQuery.select(`${USER_POPULATE_FIELDS} role`);
    }
    if (typeof userQuery?.lean === 'function') {
      userQuery = userQuery.lean();
    }
    const users = await userQuery;
    const map = new Map();
    if (Array.isArray(users)) {
      for (const u of users) {
        if (u?._id) map.set(String(u._id), u);
      }
    }
    return map;
  } catch {
    return new Map();
  }
};

export const formatAdminSupportTicket = (doc, hydratedUsersMap = new Map()) => {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;

  const isUserObj = (v) =>
    Boolean(v) &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    Boolean(v.email || v.fullName || v.name || v.username);

  const nonAdminMsgSender = Array.isArray(raw.messages)
    ? raw.messages.find(
        (m) =>
          isUserObj(m?.sender) &&
          !['admin', 'super_admin'].includes(String(m.sender.role || '').toLowerCase())
      )?.sender
    : null;

  const legacyRefId =
    extractPlainId(raw.userId) ||
    extractPlainId(raw.user) ||
    extractPlainId(raw.customerId) ||
    extractPlainId(raw.customer) ||
    extractPlainId(raw.requester);

  const hydratedUser = legacyRefId ? hydratedUsersMap.get(legacyRefId) : null;

  const userObj =
    (isUserObj(raw.userId) && raw.userId) ||
    (isUserObj(raw.user) && raw.user) ||
    (isUserObj(raw.customerId) && raw.customerId) ||
    (isUserObj(raw.customer) && raw.customer) ||
    (isUserObj(raw.requester) && raw.requester) ||
    (isUserObj(hydratedUser) && hydratedUser) ||
    nonAdminMsgSender ||
    {};

  const customerEmail =
    userObj.email ||
    raw.customerEmail ||
    raw.userEmail ||
    raw.requesterEmail ||
    raw.contactEmail ||
    raw.email ||
    '';

  const customerName =
    userObj.fullName ||
    userObj.name ||
    userObj.username ||
    raw.customerName ||
    raw.userName ||
    raw.requesterName ||
    (customerEmail && customerEmail.includes('@') ? customerEmail.split('@')[0] : '') ||
    'Customer';

  const customerPhone =
    userObj.phone || raw.customerPhone || raw.userPhone || raw.phone || '';

  const assigneeId = extractPlainId(raw.assignedTo);
  const assigneeObj = isUserObj(raw.assignedTo)
    ? raw.assignedTo
    : assigneeId
      ? hydratedUsersMap.get(assigneeId) || null
      : null;

  const normalizedStatus = normalizeSupportStatus(raw.status) || 'open';
  const rawPriority = String(raw.priority || 'medium').trim().toLowerCase();
  const normalizedPriority = VALID_PRIORITIES.has(rawPriority) ? rawPriority : 'medium';
  const rawCategory = String(raw.category || raw.type || 'general').trim().toLowerCase();
  const normalizedCategory = VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'general';

  const existingMessages = Array.isArray(raw.messages) ? raw.messages : [];
  const rootDescription = String(raw.description || raw.message || raw.content || '').trim();
  const messages =
    existingMessages.length > 0
      ? existingMessages
      : rootDescription
        ? [
            {
              _id: `root-${raw._id || 'msg'}`,
              sender: isUserObj(userObj) ? userObj : null,
              message: rootDescription,
              createdAt: raw.createdAt || raw.updatedAt || new Date(),
            },
          ]
        : [];

  return {
    ...raw,
    _id: raw._id,
    id: raw._id,
    ticketId: raw.ticketId || raw.ticketNumber || String(raw._id || ''),
    userId: isUserObj(userObj) ? userObj : raw.userId,
    customerName,
    customerEmail,
    customerPhone,
    assignedTo: assigneeObj || raw.assignedTo || null,
    assigneeName: assigneeObj ? formatDisplayName(assigneeObj, 'Admin') : '',
    assigneeEmail: assigneeObj?.email || '',
    subject: raw.subject || raw.title || 'Support request',
    description: rootDescription,
    category: normalizedCategory,
    priority: normalizedPriority,
    status: normalizedStatus,
    messages,
    messageCount: messages.length,
    internalNotes: Array.isArray(raw.internalNotes) ? raw.internalNotes : [],
    noteCount: Array.isArray(raw.internalNotes) ? raw.internalNotes.length : 0,
    resolution: raw.resolution || '',
    resolvedAt: raw.resolvedAt || null,
  };
};

const runTicketListQuery = (filter, { sort, skip, limit }) => {
  let query = SupportTicket.find(filter);
  if (typeof query.populate === 'function') {
    query = query.populate('userId', USER_POPULATE_FIELDS);
    query = query.populate('assignedTo', ASSIGNEE_POPULATE_FIELDS);
    query = query.populate('messages.sender', SENDER_POPULATE_FIELDS);
    query = query.populate('internalNotes.author', NOTE_AUTHOR_POPULATE_FIELDS);
  }
  if (typeof query.sort === 'function') query = query.sort(sort);
  if (typeof query.skip === 'function') query = query.skip(skip);
  if (typeof query.limit === 'function') query = query.limit(limit);
  if (typeof query.lean === 'function') query = query.lean();
  return query;
};

const runSingleTicketQuery = (filter) => {
  let query = SupportTicket.findOne(filter);
  if (typeof query?.populate === 'function') {
    query = query.populate('userId', USER_POPULATE_FIELDS);
    query = query.populate('assignedTo', ASSIGNEE_POPULATE_FIELDS);
    query = query.populate('messages.sender', SENDER_POPULATE_FIELDS);
    query = query.populate('internalNotes.author', NOTE_AUTHOR_POPULATE_FIELDS);
  }
  if (typeof query?.lean === 'function') query = query.lean();
  return query;
};

export class AdminSupportService {
  async getSupportAgents() {
    let query = User.find({
      role: { $in: ['admin', 'super_admin'] },
      isActive: { $ne: false },
    });
    if (typeof query?.select === 'function') {
      query = query.select('fullName name username email role');
    }
    if (typeof query?.sort === 'function') {
      query = query.sort({ fullName: 1, name: 1, email: 1 });
    }
    if (typeof query?.lean === 'function') {
      query = query.lean();
    }
    const agents = await query;
    return Array.isArray(agents)
      ? agents.map((a) => ({
          _id: a._id,
          name: formatDisplayName(a, 'Admin'),
          email: a.email || '',
          role: a.role || 'admin',
        }))
      : [];
  }

  async getSupportTickets(params = {}) {
    const { page, limit, skip, sort } = parsePagination({
      ...params,
      limit: params.limit || 20,
    });
    const andConditions = [];

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      const statusNorm = normalizeSupportStatus(params.status);
      if (statusNorm === 'waiting_for_customer') {
        andConditions.push({
          status: { $in: ['waiting_for_customer', 'waiting_customer'] },
        });
      } else if (statusNorm) {
        andConditions.push({ status: statusNorm });
      }
    }

    if (params.priority && String(params.priority).toLowerCase() !== 'all') {
      andConditions.push({ priority: String(params.priority).trim().toLowerCase() });
    }

    if (params.category && String(params.category).toLowerCase() !== 'all') {
      andConditions.push({ category: String(params.category).trim().toLowerCase() });
    }

    if (params.assignedTo && String(params.assignedTo).toLowerCase() !== 'all') {
      const assignedParam = String(params.assignedTo).trim();
      if (assignedParam === 'unassigned') {
        andConditions.push({
          $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }],
        });
      } else if (assignedParam === 'assigned') {
        andConditions.push({ assignedTo: { $ne: null } });
      } else if (OBJECT_ID_REGEX.test(assignedParam)) {
        andConditions.push({ assignedTo: assignedParam });
      }
    }

    if (params.search && String(params.search).trim()) {
      const keyword = String(params.search).trim();
      const regex = { $regex: escapeRegex(keyword), $options: 'i' };

      let matchedUserIds = [];
      if (mongoose.connection?.readyState === 1) {
        try {
          let userSearchQuery = User.find({
            $or: [
              { fullName: regex },
              { name: regex },
              { username: regex },
              { email: regex },
            ],
          });
          if (typeof userSearchQuery?.select === 'function') {
            userSearchQuery = userSearchQuery.select('_id');
          }
          if (typeof userSearchQuery?.limit === 'function') {
            userSearchQuery = userSearchQuery.limit(50);
          }
          if (typeof userSearchQuery?.lean === 'function') {
            userSearchQuery = userSearchQuery.lean();
          }
          const matchedUsers = await userSearchQuery;
          if (Array.isArray(matchedUsers)) {
            matchedUserIds = matchedUsers.map((u) => u._id).filter(Boolean);
          }
        } catch {
          matchedUserIds = [];
        }
      }

      const searchOr = [
        { ticketId: regex },
        { ticketNumber: regex },
        { subject: regex },
        { category: regex },
        { orderNumber: regex },
        { customerEmail: regex },
        { userEmail: regex },
        { customerName: regex },
        { userName: regex },
      ];
      if (matchedUserIds.length > 0) {
        searchOr.push(
          { userId: { $in: matchedUserIds } },
          { user: { $in: matchedUserIds } },
          { customerId: { $in: matchedUserIds } }
        );
      }
      andConditions.push({ $or: searchOr });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    // Execute primary query & pagination count first (preserves mockResolvedValueOnce ordering in unit tests)
    const [rawTickets, total] = await Promise.all([
      runTicketListQuery(filter, { sort, skip, limit }),
      SupportTicket.countDocuments(filter),
    ]);

    const safeCount = (cond) =>
      mongoose.connection?.readyState === 1
        ? Promise.resolve(SupportTicket.countDocuments(cond))
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
      urgentOpenCount,
      unassignedCount,
    ] = await Promise.all([
      safeCount({}),
      safeCount({ status: 'open' }),
      safeCount({ status: 'pending' }),
      safeCount({ status: 'in_progress' }),
      safeCount({ status: { $in: ['waiting_for_customer', 'waiting_customer'] } }),
      safeCount({ status: 'resolved' }),
      safeCount({ status: 'closed' }),
      safeCount({
        priority: { $in: ['high', 'urgent'] },
        status: { $nin: ['resolved', 'closed'] },
      }),
      safeCount({
        $and: [
          { $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }] },
          { status: { $nin: ['resolved', 'closed'] } },
        ],
      }),
    ]);

    const rawList = Array.isArray(rawTickets) ? rawTickets : [];
    const hydratedMap = await hydrateLegacyUsersForTickets(rawList);
    const tickets = rawList.map((t) => formatAdminSupportTicket(t, hydratedMap));
    const totalNum = Math.max(0, Number(total) || 0);

    return {
      tickets,
      summary: {
        total: allTotal,
        open: openCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        waitingForCustomer: waitingCount,
        activeQueue: openCount + pendingCount + inProgressCount + waitingCount,
        resolved: resolvedCount,
        closed: closedCount,
        urgentOpen: urgentOpenCount,
        unassigned: unassignedCount,
      },
      pagination: {
        total: totalNum,
        page,
        limit,
        totalPages: Math.ceil(totalNum / limit) || 1,
      },
    };
  }

  async getSupportTicketById(ticketId) {
    const ticket = await runSingleTicketQuery(buildAdminTicketFilter(ticketId));
    if (!ticket) throw ApiError.notFound('Ticket not found');
    const hydratedMap = await hydrateLegacyUsersForTickets([ticket]);
    return formatAdminSupportTicket(ticket, hydratedMap);
  }

  async replyToSupportTicket(ticketId, message, adminId, options = {}) {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) {
      throw ApiError.badRequest('Reply message is required');
    }

    const ticket = await SupportTicket.findOne(buildAdminTicketFilter(ticketId));
    if (!ticket) throw ApiError.notFound('Ticket not found');

    ticket.messages.push({
      sender: adminId,
      message: cleanMessage,
      createdAt: new Date(),
    });

    const requestedStatus = options?.status
      ? normalizeSupportStatus(options.status)
      : null;

    if (requestedStatus && VALID_STATUSES.has(requestedStatus)) {
      ticket.status = requestedStatus;
      if (requestedStatus === 'resolved' || requestedStatus === 'closed') {
        ticket.resolvedAt = new Date();
      }
    } else if (ticket.status === 'open' || ticket.status === 'pending') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    const recipientId = ticket.userId?._id || ticket.userId || ticket.user || ticket.customerId;
    if (recipientId) {
      notificationService
        .createNotification({
          userId: recipientId,
          title: `Support Reply (#${ticket.ticketId})`,
          message: `Support replied to "${ticket.subject}": ${cleanMessage.slice(0, 120)}`,
          type: 'system',
          link: '/support',
          data: { ticketId: ticket._id, ticketCode: ticket.ticketId },
        })
        .catch(() => {});
    }

    return this.getSupportTicketById(ticket._id);
  }

  async updateSupportTicketStatus(ticketId, status, resolution = '') {
    const normalizedStatus = normalizeSupportStatus(status);
    if (!normalizedStatus) {
      throw ApiError.badRequest(`Invalid status '${status}'`);
    }

    const updateDoc = { status: normalizedStatus };
    if (normalizedStatus === 'resolved' || normalizedStatus === 'closed') {
      updateDoc.resolvedAt = new Date();
      if (resolution && String(resolution).trim()) {
        updateDoc.resolution = String(resolution).trim();
      }
    } else if (normalizedStatus === 'open') {
      updateDoc.resolvedAt = null;
    }

    let query = SupportTicket.findOneAndUpdate(
      buildAdminTicketFilter(ticketId),
      updateDoc,
      { new: true, runValidators: true }
    );
    if (typeof query?.populate === 'function') {
      query = query
        .populate('userId', USER_POPULATE_FIELDS)
        .populate('assignedTo', ASSIGNEE_POPULATE_FIELDS)
        .populate('messages.sender', SENDER_POPULATE_FIELDS)
        .populate('internalNotes.author', NOTE_AUTHOR_POPULATE_FIELDS);
    }

    const ticket = await query;
    if (!ticket) throw ApiError.notFound('Ticket not found');

    const recipientId = ticket.userId?._id || ticket.userId;
    if (recipientId) {
      notificationService
        .createNotification({
          userId: recipientId,
          title: `Support Ticket #${ticket.ticketId} Updated`,
          message: `Your support ticket "${ticket.subject}" status is now ${normalizedStatus.replace(/_/g, ' ')}.`,
          type: 'system',
          link: '/support',
          data: { ticketId: ticket._id, ticketCode: ticket.ticketId, status: normalizedStatus },
        })
        .catch(() => {});
    }

    const hydratedMap = await hydrateLegacyUsersForTickets([ticket]);
    return formatAdminSupportTicket(ticket, hydratedMap);
  }

  async updateSupportTicketPriority(ticketId, priority) {
    const normalizedPriority = String(priority || '').trim().toLowerCase();
    if (!VALID_PRIORITIES.has(normalizedPriority)) {
      throw ApiError.badRequest(`Invalid priority '${priority}'`);
    }

    let query = SupportTicket.findOneAndUpdate(
      buildAdminTicketFilter(ticketId),
      { priority: normalizedPriority },
      { new: true, runValidators: true }
    );
    if (typeof query?.populate === 'function') {
      query = query
        .populate('userId', USER_POPULATE_FIELDS)
        .populate('assignedTo', ASSIGNEE_POPULATE_FIELDS)
        .populate('messages.sender', SENDER_POPULATE_FIELDS)
        .populate('internalNotes.author', NOTE_AUTHOR_POPULATE_FIELDS);
    }

    const ticket = await query;
    if (!ticket) throw ApiError.notFound('Ticket not found');

    const hydratedMap = await hydrateLegacyUsersForTickets([ticket]);
    return formatAdminSupportTicket(ticket, hydratedMap);
  }

  async addInternalNote(ticketId, note, adminId) {
    const cleanNote = String(note || '').trim();
    if (!cleanNote) {
      throw ApiError.badRequest('Internal note cannot be empty');
    }

    const ticket = await SupportTicket.findOne(buildAdminTicketFilter(ticketId));
    if (!ticket) throw ApiError.notFound('Ticket not found');

    ticket.internalNotes.push({
      author: adminId,
      note: cleanNote,
      createdAt: new Date(),
    });
    await ticket.save();

    return this.getSupportTicketById(ticket._id);
  }

  async getTicketHistory(ticketId) {
    const ticket = await this.getSupportTicketById(ticketId);
    const history = [
      {
        activity: 'Ticket Created',
        description: `Created by ${formatDisplayName(ticket.userId, ticket.customerName || 'Customer')} (${ticket.category})`,
        createdAt: ticket.createdAt,
      },
      ...(ticket.messages || []).map((m) => ({
        activity: 'Message',
        description: `${formatDisplayName(m.sender, ticket.customerName || 'User')}: ${String(m.message || '').slice(0, 80)}`,
        createdAt: m.createdAt,
      })),
      ...(ticket.internalNotes || []).map((n) => ({
        activity: 'Internal Note',
        description: `${formatDisplayName(n.author, 'Admin')}: ${n.note}`,
        createdAt: n.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { ticketId: ticket._id, history };
  }

  async assignSupportTicket(ticketId, userId, actorId = null) {
    let nextAssignee = null;

    if (userId !== null && userId !== undefined && String(userId).trim() !== '' && String(userId).toLowerCase() !== 'unassigned') {
      const cleanAssigneeId = String(userId).trim();
      if (!OBJECT_ID_REGEX.test(cleanAssigneeId)) {
        throw ApiError.badRequest('Invalid assignee user ID format');
      }
      const assigneeUser = await User.findById(cleanAssigneeId).select('fullName name username email role isActive');
      if (!assigneeUser) {
        throw ApiError.notFound('Assigned admin/staff user not found');
      }
      nextAssignee = assigneeUser._id;
    }

    const ticket = await SupportTicket.findOneAndUpdate(
      buildAdminTicketFilter(ticketId),
      { assignedTo: nextAssignee },
      { new: true }
    )
      .populate('userId', USER_POPULATE_FIELDS)
      .populate('assignedTo', ASSIGNEE_POPULATE_FIELDS)
      .populate('messages.sender', SENDER_POPULATE_FIELDS)
      .populate('internalNotes.author', NOTE_AUTHOR_POPULATE_FIELDS);

    if (!ticket) throw ApiError.notFound('Ticket not found');

    if (nextAssignee && String(nextAssignee) !== String(actorId || '')) {
      notificationService
        .createNotification({
          userId: nextAssignee,
          title: `Ticket Assigned (#${ticket.ticketId})`,
          message: `You were assigned support ticket "${ticket.subject}".`,
          type: 'system',
          link: '/admin/support',
          data: { ticketId: ticket._id, ticketCode: ticket.ticketId },
        })
        .catch(() => {});
    }

    const hydratedMap = await hydrateLegacyUsersForTickets([ticket]);
    return formatAdminSupportTicket(ticket, hydratedMap);
  }

  async deleteTicket(ticketId) {
    const ticket = await SupportTicket.findOneAndDelete(buildAdminTicketFilter(ticketId));
    if (!ticket) throw ApiError.notFound('Ticket not found');
    return { message: 'Ticket deleted successfully' };
  }
}

export const adminSupportService = new AdminSupportService();
export default adminSupportService;
