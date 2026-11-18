import mongoose from 'mongoose';
import { SupportTicket } from '../../models/SupportTicket.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { notificationService } from '../common/notification.service.js';

const VALID_STATUSES = new Set([
  'open',
  'pending',
  'in_progress',
  'waiting_for_customer',
  'resolved',
  'closed',
]);
const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);
const USER_POPULATE_FIELDS = 'fullName name username email phone avatar';
const ASSIGNEE_POPULATE_FIELDS = 'fullName name username email';
const SENDER_POPULATE_FIELDS = 'fullName name username email avatar role';
const NOTE_AUTHOR_POPULATE_FIELDS = 'fullName name username email role';

const formatDisplayName = (user, fallback = 'User') =>
  user?.fullName || user?.name || user?.username || user?.email || fallback;

const buildAdminTicketFilter = (ticketId) => {
  const orConditions = [{ ticketId }];
  if (mongoose.isValidObjectId(ticketId)) {
    orConditions.unshift({ _id: ticketId });
  }
  return { $or: orConditions };
};

export class AdminSupportService {
  async getSupportTickets(params = {}) {
    const { page, limit, skip, sort } = parsePagination({
      ...params,
      limit: params.limit || 50,
    });
    const filter = {};

    if (params.status && params.status !== 'all') {
      filter.status = String(params.status).toLowerCase();
    }
    if (params.priority && params.priority !== 'all') {
      filter.priority = String(params.priority).toLowerCase();
    }
    if (params.category && params.category !== 'all') {
      filter.category = String(params.category).toLowerCase();
    }
    if (params.search && String(params.search).trim()) {
      const regex = { $regex: String(params.search).trim(), $options: 'i' };
      filter.$or = [{ ticketId: regex }, { subject: regex }];
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('userId', USER_POPULATE_FIELDS)
        .populate('assignedTo', ASSIGNEE_POPULATE_FIELDS)
        .populate('messages.sender', SENDER_POPULATE_FIELDS)
        .populate('internalNotes.author', NOTE_AUTHOR_POPULATE_FIELDS)
        .sort(sort)
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

  async getSupportTicketById(ticketId) {
    const ticket = await SupportTicket.findOne(buildAdminTicketFilter(ticketId))
      .populate('userId', USER_POPULATE_FIELDS)
      .populate('assignedTo', ASSIGNEE_POPULATE_FIELDS)
      .populate('messages.sender', SENDER_POPULATE_FIELDS)
      .populate('internalNotes.author', NOTE_AUTHOR_POPULATE_FIELDS);

    if (!ticket) throw ApiError.notFound('Ticket not found');
    return ticket;
  }

  async replyToSupportTicket(ticketId, message, adminId) {
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
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
    await ticket.save();

    notificationService
      .createNotification({
        userId: ticket.userId?._id || ticket.userId,
        title: `Support Reply (#${ticket.ticketId})`,
        message: `Support replied to "${ticket.subject}": ${cleanMessage.slice(0, 120)}`,
        type: 'system',
        link: '/support',
        data: { ticketId: ticket._id, ticketCode: ticket.ticketId },
      })
      .catch(() => {});

    return this.getSupportTicketById(ticket._id);
  }

  async updateSupportTicketStatus(ticketId, status, resolution = '') {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    if (!VALID_STATUSES.has(normalizedStatus)) {
      throw ApiError.badRequest(`Invalid status '${status}'`);
    }

    const updateDoc = { status: normalizedStatus };
    if (normalizedStatus === 'resolved' || normalizedStatus === 'closed') {
      updateDoc.resolvedAt = new Date();
      if (resolution) {
        updateDoc.resolution = String(resolution).trim();
      }
    } else if (normalizedStatus === 'open') {
      updateDoc.resolvedAt = null;
    }

    const ticket = await SupportTicket.findOneAndUpdate(
      buildAdminTicketFilter(ticketId),
      updateDoc,
      { new: true, runValidators: true }
    )
      .populate('userId', USER_POPULATE_FIELDS)
      .populate('assignedTo', ASSIGNEE_POPULATE_FIELDS)
      .populate('messages.sender', SENDER_POPULATE_FIELDS);

    if (!ticket) throw ApiError.notFound('Ticket not found');

    notificationService
      .createNotification({
        userId: ticket.userId?._id || ticket.userId,
        title: `Support Ticket #${ticket.ticketId} Updated`,
        message: `Your support ticket "${ticket.subject}" status is now ${normalizedStatus.replace(/_/g, ' ')}.`,
        type: 'system',
        link: '/support',
        data: { ticketId: ticket._id, ticketCode: ticket.ticketId, status: normalizedStatus },
      })
      .catch(() => {});

    return ticket;
  }

  async updateSupportTicketPriority(ticketId, priority) {
    const normalizedPriority = String(priority || '').trim().toLowerCase();
    if (!VALID_PRIORITIES.has(normalizedPriority)) {
      throw ApiError.badRequest(`Invalid priority '${priority}'`);
    }

    const ticket = await SupportTicket.findOneAndUpdate(
      buildAdminTicketFilter(ticketId),
      { priority: normalizedPriority },
      { new: true, runValidators: true }
    )
      .populate('userId', USER_POPULATE_FIELDS)
      .populate('assignedTo', ASSIGNEE_POPULATE_FIELDS)
      .populate('messages.sender', SENDER_POPULATE_FIELDS);

    if (!ticket) throw ApiError.notFound('Ticket not found');
    return ticket;
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
        description: `Created by ${formatDisplayName(ticket.userId, 'Customer')} (${ticket.category})`,
        createdAt: ticket.createdAt,
      },
      ...(ticket.messages || []).map((m) => ({
        activity: 'Message',
        description: `${formatDisplayName(m.sender, 'User')}: ${String(m.message || '').slice(0, 80)}`,
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

  async assignSupportTicket(ticketId, userId) {
    const ticket = await SupportTicket.findOneAndUpdate(
      buildAdminTicketFilter(ticketId),
      { assignedTo: userId },
      { new: true }
    )
      .populate('userId', USER_POPULATE_FIELDS)
      .populate('assignedTo', ASSIGNEE_POPULATE_FIELDS);

    if (!ticket) throw ApiError.notFound('Ticket not found');
    return ticket;
  }

  async deleteTicket(ticketId) {
    const ticket = await SupportTicket.findOneAndDelete(buildAdminTicketFilter(ticketId));
    if (!ticket) throw ApiError.notFound('Ticket not found');
    return { message: 'Ticket deleted successfully' };
  }
}

export const adminSupportService = new AdminSupportService();
export default adminSupportService;
