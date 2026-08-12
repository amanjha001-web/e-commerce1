import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    
    /*                               Receiver                                 */
    

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    
    /*                               Content                                  */
    

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    
    /*                            Notification Type                           */
    

    type: {
      type: String,
      enum: [
        "ORDER",
        "PAYMENT",
        "PRODUCT",
        "COUPON",
        "RETURN",
        "REFUND",
        "SHIPMENT",
        "VENDOR",
        "CHAT",
        "SYSTEM",
        "PROMOTION",
      ],
      default: "SYSTEM",
    },

    
    /*                              Priority                                  */
    

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },

    
    /*                          Related Resource                              */
    

    resourceType: {
      type: String,
      enum: [
        "ORDER",
        "PRODUCT",
        "PAYMENT",
        "COUPON",
        "VENDOR",
        "RETURN",
        "REFUND",
        "CHAT",
        "NONE",
      ],
      default: "NONE",
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    
    /*                             Extra Payload                              */
    

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    
    /*                               Redirect                                 */
    

    actionUrl: {
      type: String,
      default: "",
      trim: true,
    },

    
    /*                              Read Status                               */
    

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    
    /*                           Delivery Channel                             */
    

    sentVia: {
      type: [
        {
          type: String,
          enum: ["APP", "EMAIL", "SMS", "PUSH"],
        },
      ],
      default: ["APP"],
    },

    
    /*                             Delivery Status                            */
    

    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },

    sentAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: "",
      trim: true,
    },

    
    /*                          Schedule / Expiry                             */
    

    scheduledFor: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    
    /*                            Soft Delete                                 */
    

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);


/*                                  Indexes                                   */


notificationSchema.index({
  user: 1,
  isRead: 1,
});

notificationSchema.index({
  status: 1,
});

notificationSchema.index({
  type: 1,
});

notificationSchema.index({
  resourceType: 1,
  resourceId: 1,
});

notificationSchema.index({
  expiresAt: 1,
});

notificationSchema.index({
  scheduledFor: 1,
});

export default mongoose.model("Notification", notificationSchema);
