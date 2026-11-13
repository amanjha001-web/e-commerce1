import { adminSupportService } from '../../services/admin/support.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getSupportTickets = asyncHandler(async (req, res) => {
  const result = await adminSupportService.getSupportTickets(req.query);
  return ApiResponse.success(res, result, 'Support tickets list');
});

export const getSupportTicketById = asyncHandler(async (req, res) => {
  const ticket = await adminSupportService.getSupportTicketById(req.params.ticketId);
  return ApiResponse.success(res, ticket, 'Ticket details');
});

export const replyToSupportTicket = asyncHandler(async (req, res) => {
  const message = req.body.message || req.body.reply;
  const ticket = await adminSupportService.replyToSupportTicket(req.params.ticketId, message, req.user._id);
  return ApiResponse.success(res, ticket, 'Reply posted');
});

export const updateSupportTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await adminSupportService.updateSupportTicketStatus(req.params.ticketId, req.body.status);
  return ApiResponse.success(res, ticket, 'Ticket status updated');
});

export const assignSupportTicket = asyncHandler(async (req, res) => {
  const userId = req.body.userId || req.body.assignedTo;
  const ticket = await adminSupportService.assignSupportTicket(req.params.ticketId, userId);
  return ApiResponse.success(res, ticket, 'Ticket assigned');
});

export const deleteTicket = asyncHandler(async (req, res) => {
  const result = await adminSupportService.deleteTicket(req.params.ticketId);
  return ApiResponse.success(res, result, result.message);
});
