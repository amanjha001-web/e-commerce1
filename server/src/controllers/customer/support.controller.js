import { supportService } from '../../services/customer/support.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await supportService.createTicket(req.user._id, req.body);
  return ApiResponse.created(res, ticket, 'Support ticket created');
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const result = await supportService.getMyTickets(req.user._id, req.query);
  return ApiResponse.success(res, result, 'Support tickets');
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await supportService.getTicketById(req.params.ticketId, req.user._id);
  return ApiResponse.success(res, ticket, 'Ticket details');
});

export const addMessage = asyncHandler(async (req, res) => {
  const ticket = await supportService.addMessage(req.params.ticketId, req.user._id, req.body);
  return ApiResponse.success(res, ticket, 'Message added to ticket');
});

export const closeTicket = asyncHandler(async (req, res) => {
  const ticket = await supportService.closeTicket(req.params.ticketId, req.user._id);
  return ApiResponse.success(res, ticket, 'Ticket closed');
});

export const reopenTicket = asyncHandler(async (req, res) => {
  const ticket = await supportService.reopenTicket(req.params.ticketId, req.user._id);
  return ApiResponse.success(res, ticket, 'Ticket reopened');
});
