import mongoose from 'mongoose';
import { SupportTicket } from '../../models/SupportTicket.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import {
  createSupportTicketWithRetry,
  generateSupportTicketCode,
} from '../../utils/supportTicket.utils.js';
import { notificationService } from '../common/notification.service.js';

const VALID_CATEGORIES = new Set([
  'order',
  'payment',
  'product',
  'account',
  'delivery',
  'payout',
  'general',
]);
const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);
const USER_POPULATE_FIELDS = 'fullName name username email phone avatar';
const SENDER_POPULATE_FIELDS = 'fullName name username email avatar role';

const buildUserTicketFilter = (ticketId, userId) => {
  const idConditions = [{ ticketId }];
  if (mongoose.isValidObjectId(ticketId)) {
    idConditions.unshift({ _id: ticketId });
  }
  return {
    $and: [
      { $or: idConditions },
      { $or: [{ userId }, { user: userId }] },
    ],
  };
};

export class SupportService {
  async createTicket(userId, payload = {}) {
    const subject = String(payload.subject || '').trim();
    const message = String(payload.message || payload.description || '').trim();

    if (!subject) {
      throw ApiError.badRequest('Subject is required');
    }
    if (!message) {
      throw ApiError.badRequest('Message is required');
    }

    const rawCategory = String(payload.category || 'general').trim().toLowerCase();
    const category = VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'general';

    const rawPriority = String(payload.priority || 'medium').trim().toLowerCase();
    const priority = VALID_PRIORITIES.has(rawPriority) ? rawPriority : 'medium';

    const ticketId = generateSupportTicketCode();

    const ticket = await createSupportTicketWithRetry({
      ticketId,
      userId,
      subject,
      category,
      priority,
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
        title: `Support Ticket #${resolvedTicketId}`,
        message: `Your support ticket "${subject}" has been created. Our team will respond soon.`,
        type: 'system',
        link: '/support',
        data: { ticketId: ticket._id, ticketCode: resolvedTicketId },
      })
      .catch(() => {});

    notificationService
      .notifyAdmins({
        title: `New Support Ticket #${resolvedTicketId}`,
        message: `Subject: ${subject}`,
        type: 'system',
        link: '/admin/support',
        data: { ticketId: ticket._id, ticketCode: resolvedTicketId },
      })
      .catch(() => {});

    return ticket.populate([
      { path: 'userId', select: USER_POPULATE_FIELDS },
      { path: 'messages.sender', select: SENDER_POPULATE_FIELDS },
    ]);
  }

  async getMyTickets(userId, params = {}) {
    const { page, limit, skip } = parsePagination({
      ...params,
      limit: params.limit || 50,
    });
    const baseFilter = { $or: [{ userId }, { user: userId }] };
    const conditions = [baseFilter];

    if (params.status && params.status !== 'all') {
      conditions.push({ status: String(params.status).toLowerCase() });
    }
    if (params.category && params.category !== 'all') {
      conditions.push({ category: String(params.category).toLowerCase() });
    }
    if (params.search && String(params.search).trim()) {
      const regex = { $regex: String(params.search).trim(), $options: 'i' };
      conditions.push({ $or: [{ ticketId: regex }, { subject: regex }] });
    }

    const filter = conditions.length > 1 ? { $and: conditions } : baseFilter;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('userId', USER_POPULATE_FIELDS)
        .populate('messages.sender', SENDER_POPULATE_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SupportTicket.countDocuments(filter),
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketById(ticketId, userId) {
    const ticket = await SupportTicket.findOne(buildUserTicketFilter(ticketId, userId))
      .populate('userId', USER_POPULATE_FIELDS)
      .populate('messages.sender', SENDER_POPULATE_FIELDS);

    if (!ticket) throw ApiError.notFound('Ticket not found');
    return ticket;
  }

  async addMessage(ticketId, userId, payload = {}) {
    const cleanMessage = String(payload.message || payload.content || '').trim();
    if (!cleanMessage) {
      throw ApiError.badRequest('Message cannot be empty');
    }

    const ticket = await SupportTicket.findOne(buildUserTicketFilter(ticketId, userId));
    if (!ticket) throw ApiError.notFound('Ticket not found');

    if (ticket.status === 'closed') {
      throw ApiError.badRequest('Cannot reply to a closed ticket. Please reopen it first.');
    }

    ticket.messages.push({
      sender: userId,
      message: cleanMessage,
      createdAt: new Date(),
    });
    if (ticket.status === 'waiting_for_customer') {
      ticket.status = 'open';
    }
    await ticket.save();

    notificationService
      .notifyAdmins({
        title: `Customer Reply (#${ticket.ticketId})`,
        message: `New reply on "${ticket.subject}": ${cleanMessage.slice(0, 120)}`,
        type: 'system',
        link: '/admin/support',
        data: { ticketId: ticket._id, ticketCode: ticket.ticketId },
      })
      .catch(() => {});

    return ticket.populate([
      { path: 'userId', select: USER_POPULATE_FIELDS },
      { path: 'messages.sender', select: SENDER_POPULATE_FIELDS },
    ]);
  }

  async closeTicket(ticketId, userId) {
    const ticket = await SupportTicket.findOneAndUpdate(
      buildUserTicketFilter(ticketId, userId),
      { status: 'closed' },
      { new: true }
    )
      .populate('userId', USER_POPULATE_FIELDS)
      .populate('messages.sender', SENDER_POPULATE_FIELDS);

    if (!ticket) throw ApiError.notFound('Ticket not found');
    return ticket;
  }

  async reopenTicket(ticketId, userId) {
    const ticket = await SupportTicket.findOneAndUpdate(
      buildUserTicketFilter(ticketId, userId),
      { status: 'open', resolvedAt: null },
      { new: true }
    )
      .populate('userId', USER_POPULATE_FIELDS)
      .populate('messages.sender', SENDER_POPULATE_FIELDS);

    if (!ticket) throw ApiError.notFound('Ticket not found');
    return ticket;
  }
}

export const supportService = new SupportService();
export default supportService;
