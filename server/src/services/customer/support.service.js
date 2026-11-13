import { SupportTicket } from '../../models/SupportTicket.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

export class SupportService {
  async createTicket(userId, { subject, category, priority, message }) {
    const ticketId = `TCK-${Date.now().toString().slice(-6)}`;
    const ticket = await SupportTicket.create({
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
    return ticket;
  }

  async getMyTickets(userId, params = {}) {
    const { page, limit, skip } = parsePagination(params);
    const filter = { userId };

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
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
    const ticket = await SupportTicket.findOne({
      $or: [{ _id: ticketId }, { ticketId }],
      userId,
    }).populate('messages.sender', 'name avatar role');

    if (!ticket) throw ApiError.notFound('Ticket not found');
    return ticket;
  }

  async addMessage(ticketId, userId, { message }) {
    const ticket = await SupportTicket.findOne({
      $or: [{ _id: ticketId }, { ticketId }],
      userId,
    });
    if (!ticket) throw ApiError.notFound('Ticket not found');

    if (ticket.status === 'closed') {
      throw ApiError.badRequest('Cannot reply to a closed ticket. Please reopen it first.');
    }

    ticket.messages.push({
      sender: userId,
      message,
      createdAt: new Date(),
    });
    await ticket.save();

    return ticket.populate('messages.sender', 'name avatar role');
  }

  async closeTicket(ticketId, userId) {
    const ticket = await SupportTicket.findOneAndUpdate(
      { $or: [{ _id: ticketId }, { ticketId }], userId },
      { status: 'closed' },
      { new: true }
    );
    if (!ticket) throw ApiError.notFound('Ticket not found');
    return ticket;
  }

  async reopenTicket(ticketId, userId) {
    const ticket = await SupportTicket.findOneAndUpdate(
      { $or: [{ _id: ticketId }, { ticketId }], userId },
      { status: 'open' },
      { new: true }
    );
    if (!ticket) throw ApiError.notFound('Ticket not found');
    return ticket;
  }
}

export const supportService = new SupportService();
export default supportService;
