import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import supportService from "../services/support.service.js";

/*                        Create Support Ticket                               */

const createSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await supportService.createSupportTicket({
    ...req.body,
    user: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, ticket, "Support ticket created successfully."));
});

/*                        Get Ticket By Id                                    */

const getTicketById = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  const ticket = await supportService.getTicketById(ticketId);

  return res.json(
    new ApiResponse(200, ticket, "Support ticket fetched successfully."),
  );
});

/*                        Get My Tickets                                      */

const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await supportService.getUserTickets(req.user._id, req.query);

  return res.json(
    new ApiResponse(200, tickets, "Support tickets fetched successfully."),
  );
});

/*                        Get All Tickets                                     */

const getAllTickets = asyncHandler(async (req, res) => {
  const tickets = await supportService.getTickets(req.query, req.query);

  return res.json(
    new ApiResponse(200, tickets, "Support tickets fetched successfully."),
  );
});

/*                        Update Ticket                                       */

const updateTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  const ticket = await supportService.updateTicket(ticketId, req.body);

  return res.json(
    new ApiResponse(200, ticket, "Support ticket updated successfully."),
  );
});

/*                           Add Reply                                    */

const addReply = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;

  const ticket = await supportService.addReply(
    ticketId,
    req.user._id,
    message,
  );

  return res.json(
    new ApiResponse(
      200,
      ticket,
      "Reply added successfully.",
    ),
  );
});

/*                        Assign Ticket                                       */

const assignTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  const { assignedTo } = req.body;

  const ticket = await supportService.assignTicket(ticketId, assignedTo);

  return res.json(
    new ApiResponse(200, ticket, "Support ticket assigned successfully."),
  );
});

/*                        Resolve Ticket                                      */

const resolveTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  const { resolution, adminNote } = req.body;

  const ticket = await supportService.resolveTicket(
    ticketId,
    req.user._id,
    resolution,
    adminNote,
  );

  return res.json(
    new ApiResponse(200, ticket, "Support ticket resolved successfully."),
  );
});

/*                         Close Ticket                                       */

const closeTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  const ticket = await supportService.closeTicket(ticketId);

  return res.json(
    new ApiResponse(200, ticket, "Support ticket closed successfully."),
  );
});

/*                        Delete Ticket                                       */

const deleteTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  const ticket = await supportService.deleteTicket(ticketId);

  return res.json(
    new ApiResponse(200, ticket, "Support ticket deleted successfully."),
  );
});

export default {
  createSupportTicket,
  getTicketById,
  getMyTickets,
  getAllTickets,
  updateTicket,
  addReply,
  assignTicket,
  resolveTicket,
  closeTicket,
  deleteTicket,
};
