import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      trim: true,
    },
    carrier: {
      type: String,
      required: true,
      trim: true,
    },
    trackingUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed'],
      default: 'pending',
    },
    shippedAt: {
      type: Date,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Shipment = mongoose.model('Shipment', shipmentSchema);
export default Shipment;
