import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    
    /*                                  User                                      */
    

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    
    /*                               Ticket Info                                  */
    

    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },

    category: {
      type: String,
      enum: [
        "ORDER",
        "PAYMENT",
        "DELIVERY",
        "RETURN",
        "ACCOUNT",
        "PRODUCT",
        "TECHNICAL",
        "OTHER",
      ],
      default: "OTHER",
      index: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "OPEN",
        "IN_PROGRESS",
        "WAITING_FOR_CUSTOMER",
        "RESOLVED",
        "CLOSED",
      ],
      default: "OPEN",
      index: true,
    },

    
    /*                             Assignment                                     */
    

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    
    /*                             Resolution                                     */
    

    resolution: {
      type: String,
      default: null,
      maxlength: 3000,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    
    /*                              Attachments                                   */
    

    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],

    
    /*                              Internal Notes                               */
    

    adminNote: {
      type: String,
      default: null,
      maxlength: 3000,
    },

    
    /*                              Soft Delete                                  */
    

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);


/*                                   Indexes                                  */


supportTicketSchema.index({
  user: 1,
  createdAt: -1,
});

supportTicketSchema.index({
  status: 1,
  priority: 1,
});

supportTicketSchema.index({
  assignedTo: 1,
  status: 1,
});

supportTicketSchema.index({
  category: 1,
  createdAt: -1,
});

export default mongoose.model("SupportTicket", supportTicketSchema);
