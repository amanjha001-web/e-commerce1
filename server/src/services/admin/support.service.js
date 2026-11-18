import { SupportTicket } from '../../models/SupportTicket.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { notificationService } from '../common/notification.service.js';

export class AdminSupportService {
  async getSupportTickets(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.status) filter.status = params.status;
    if (params.priority) filter.priority = params.priority;
    if (params.category) filter.category = params.category;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('userId', 'name email phone avatar')
        .populate('assignedTo', 'name email')
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
    const ticket = await SupportTicket.findOne({
      $or: [{ _id: ticketId }, { ticketId }],
    })
      .populate('userId', 'name email phone avatar')
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name avatar role');

    if (!ticket) throw ApiError.notFound('Ticket not found');
    return ticket;
  }

  async replyToSupportTicket(ticketId, message, adminId) {
    const ticket = await this.getSupportTicketById(ticketId);

    ticket.messages.push({
      sender: adminId,
      message,
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
        message: `Support replied to "${ticket.subject}": ${String(message).slice(0, 120)}`,
        type: 'system',
        link: '/support',
        data: { ticketId: ticket._id, ticketCode: ticket.ticketId },
      })
      .catch(() => {});

    return ticket;
  }

  async updateSupportTicketStatus(ticketId, status) {
    const ticket = await SupportTicket.findOneAndUpdate(
      { $or: [{ _id: ticketId }, { ticketId }] },
      { status },
      { new: true }
    );
    if (!ticket) throw ApiError.notFound('Ticket not found');

    notificationService
      .createNotification({
        userId: ticket.userId,
        title: `Support Ticket #${ticket.ticketId} Updated`,
        message: `Your support ticket "${ticket.subject}" status is now ${String(status).replace(/_/g, ' ')}.`,
        type: 'system',
        link: '/support',
        data: { ticketId: ticket._id, ticketCode: ticket.ticketId, status },
      })
      .catch(() => {});

    return ticket;
  }

  async assignSupportTicket(ticketId, userId) {
    const ticket = await SupportTicket.findOneAndUpdate(
      { $or: [{ _id: ticketId }, { ticketId }] },
      { assignedTo: userId },
      { new: true }
    );
    if (!ticket) throw ApiError.notFound('Ticket not found');
    return ticket;
  }

  async deleteTicket(ticketId) {
    const ticket = await SupportTicket.findOneAndDelete({
      $or: [{ _id: ticketId }, { ticketId }],
    });
    if (!ticket) throw ApiError.notFound('Ticket not found');
    return { message: 'Ticket deleted successfully' };
  }
}

export const adminSupportService = new AdminSupportService();
export default adminSupportService;
