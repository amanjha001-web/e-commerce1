import { vendorSupportService } from '../../services/vendor/support.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getTickets = asyncHandler(async (req, res) => {
  const result = await vendorSupportService.getTickets(req.user._id, req.query);
  return ApiResponse.success(res, result, 'Vendor support tickets retrieved');
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await vendorSupportService.getTicketById(
    req.params.ticketId,
    req.user._id
  );
  return ApiResponse.success(res, ticket, 'Vendor support ticket details');
});

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await vendorSupportService.createTicket(req.user._id, req.body);
  return ApiResponse.created(res, ticket, 'Support ticket created');
});

export const addMessage = asyncHandler(async (req, res) => {
  const ticket = await vendorSupportService.addMessage(
    req.params.ticketId,
    req.user._id,
    req.body
  );
  return ApiResponse.success(res, ticket, 'Reply sent');
});

export const closeTicket = asyncHandler(async (req, res) => {
  const ticket = await vendorSupportService.closeTicket(
    req.params.ticketId,
    req.user._id
  );
  return ApiResponse.success(res, ticket, 'Ticket closed');
});

export const reopenTicket = asyncHandler(async (req, res) => {
  const ticket = await vendorSupportService.reopenTicket(
    req.params.ticketId,
    req.user._id
  );
  return ApiResponse.success(res, ticket, 'Ticket reopened');
});
