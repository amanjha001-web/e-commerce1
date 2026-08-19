import mongoose from "mongoose";

import supportRepository from "../repositories/support.repository.js";

import ApiError from "../utils/ApiError.js";

/*                       Generate Ticket Number                               */

const generateTicketNumber = () => {
  const now = new Date();

  const date = now.toISOString().slice(0, 10).replace(/-/g, "");

  const random = Math.floor(100000 + Math.random() * 900000);

  return `SUP-${date}-${random}`;
};

/*                         Create Ticket                                      */

const createSupportTicket = async (ticketData) => {
  const { user } = ticketData;

  if (!mongoose.Types.ObjectId.isValid(user)) {
    throw new ApiError(400, "Invalid user id.");
  }

  return supportRepository.createSupportTicket({
    ...ticketData,
    ticketNumber: generateTicketNumber(),
  });
};

/*                          Get Ticket By Id                                  */

const getTicketById = async (ticketId) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(400, "Invalid ticket id.");
  }

  const ticket = await supportRepository.findTicketById(ticketId);

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found.");
  }

  return ticket;
};

/*                        Get User Tickets                                    */

const getUserTickets = async (userId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }

  return supportRepository.findUserTickets(userId, {}, query);
};

/*                        Get All Tickets                                     */

const getTickets = async (filter = {}, query = {}) => {
  return supportRepository.findTickets(filter, query);
};

/*                         Update Ticket                                      */

const updateTicket = async (ticketId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(400, "Invalid ticket id.");
  }

  const ticket = await supportRepository.updateTicket(ticketId, updateData);

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found.");
  }

  return ticket;
};

/*                           Add Reply                                    */

const addReply = async (ticketId, userId, message) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(400, "Invalid ticket id.");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }

  const ticket = await supportRepository.addReply(ticketId, {
    user: userId,
    message,
  });

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found.");
  }

  return ticket;
};

/*                          Assign Ticket                                     */

const assignTicket = async (ticketId, assignedTo) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(400, "Invalid ticket id.");
  }

  if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
    throw new ApiError(400, "Invalid assignee id.");
  }

  const ticket = await supportRepository.assignTicket(ticketId, assignedTo);

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found.");
  }

  return ticket;
};

/*                         Resolve Ticket                                     */

const resolveTicket = async (ticketId, resolvedBy, resolution, adminNote) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(400, "Invalid ticket id.");
  }

  if (!mongoose.Types.ObjectId.isValid(resolvedBy)) {
    throw new ApiError(400, "Invalid resolver id.");
  }

  const ticket = await supportRepository.resolveTicket(ticketId, {
    resolvedBy,
    resolution,
    adminNote,
  });

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found.");
  }

  return ticket;
};

/*                          Close Ticket                                      */

const closeTicket = async (ticketId) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(400, "Invalid ticket id.");
  }

  const ticket = await supportRepository.closeTicket(ticketId);

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found.");
  }

  return ticket;
};

/*                        Delete Ticket                                       */

const deleteTicket = async (ticketId) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(400, "Invalid ticket id.");
  }

  const ticket = await supportRepository.softDeleteTicket(ticketId);

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found.");
  }

  return ticket;
};

export default {
  createSupportTicket,
  getTicketById,
  getUserTickets,
  getTickets,
  updateTicket,
  addReply,
  assignTicket,
  resolveTicket,
  closeTicket,
  deleteTicket,
};
