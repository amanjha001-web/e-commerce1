import SupportTicket from "../models/SupportTicket.model.js";

/*                           Create Support Ticket                            */

const createSupportTicket = async (ticketData, session = null) => {
  const [ticket] = await SupportTicket.create([ticketData], {
    session,
  });

  return ticket;
};

/*                          Find Ticket By Id                                 */

const findTicketById = async (ticketId) => {
  return SupportTicket.findById(ticketId)
    .populate("user", "name email avatar")
    .populate("assignedTo", "name email")
    .populate("resolvedBy", "name email");
};

/*                       Find Ticket By Number                                */

const findTicketByNumber = async (ticketNumber) => {
  return SupportTicket.findOne({
    ticketNumber,
    isDeleted: false,
  });
};

/*                        Find User Tickets                                   */

const findUserTickets = async (userId, filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const tickets = await SupportTicket.find({
    user: userId,
    isDeleted: false,
    ...filter,
  })
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await SupportTicket.countDocuments({
    user: userId,
    isDeleted: false,
    ...filter,
  });

  return {
    tickets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                         Find All Tickets                                   */

const findTickets = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const tickets = await SupportTicket.find({
    isDeleted: false,
    ...filter,
  })
    .populate("user", "name email avatar")
    .populate("assignedTo", "name email")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await SupportTicket.countDocuments({
    isDeleted: false,
    ...filter,
  });

  return {
    tickets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                         Add Ticket Reply                               */

const addReply = async (ticketId, replyData) => {
  return SupportTicket.findByIdAndUpdate(
    ticketId,
    {
      $push: {
        replies: replyData,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

/*                           Update Ticket                                    */

const updateTicket = async (ticketId, updateData, session = null) => {
  return SupportTicket.findByIdAndUpdate(ticketId, updateData, {
    new: true,
    runValidators: true,
    session,
  });
};

/*                         Assign Ticket                                      */

const assignTicket = async (ticketId, assignedTo) => {
  return SupportTicket.findByIdAndUpdate(
    ticketId,
    {
      assignedTo,
      status: "IN_PROGRESS",
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

/*                        Resolve Ticket                                      */

const resolveTicket = async (ticketId, data) => {
  return SupportTicket.findByIdAndUpdate(
    ticketId,
    {
      ...data,
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

/*                         Close Ticket                                       */

const closeTicket = async (ticketId) => {
  return SupportTicket.findByIdAndUpdate(
    ticketId,
    {
      status: "CLOSED",
      closedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                         Soft Delete                                        */

const softDeleteTicket = async (ticketId) => {
  return SupportTicket.findByIdAndUpdate(
    ticketId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                          Count Tickets                                     */

const countTickets = async (filter = {}) => {
  return SupportTicket.countDocuments({
    isDeleted: false,
    ...filter,
  });
};



export default {
  createSupportTicket,
  findTicketById,
  findTicketByNumber,
  findUserTickets,
  findTickets,
  addReply,
  updateTicket,
  assignTicket,
  resolveTicket,
  closeTicket,
  softDeleteTicket,
  countTickets,
};
