import { z } from "zod";

/*                                  Common                                    */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const shipmentStatus = z.enum([
  "PENDING",
  "READY_TO_SHIP",
  "PACKED",
  "PICKED_UP",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RETURNED",
  "CANCELLED",
]);
const courierSchema = z.object({
  name: z.string().trim().min(2).max(100),
  trackingId: z.string().trim().min(2).max(100),
  trackingUrl: z.string().url().optional(),
});

const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
});

/*                             Create Shipment                                */

const createShipment = z.object({
  body: z.object({
    order: objectId,

    vendor: objectId,

    courier: courierSchema.optional(),

    shippingAddress: addressSchema,

    pickupDate: z.coerce.date().optional(),

    estimatedDelivery: z.coerce.date().optional(),
  }),
});

/*                             Update Shipment                                */

const updateShipment = z.object({
  params: z.object({
    shipmentId: objectId,
  }),

  body: z.object({
    courier: courierSchema.partial().optional(),

    shippingAddress: addressSchema.partial().optional(),

    status: shipmentStatus.optional(),

    pickupDate: z.coerce.date().optional(),

    shippedDate: z.coerce.date().optional(),

    deliveredDate: z.coerce.date().optional(),

    estimatedDelivery: z.coerce.date().optional(),
  }),
});

/*                             Update Status                                  */

const updateShipmentStatus = z.object({
  params: z.object({
    shipmentId: objectId,
  }),

  body: z.object({
    status: shipmentStatus,

    message: z.string().trim().max(500).optional(),
  }),
});

/*                                  Params                                    */

const shipmentIdParam = z.object({
  params: z.object({
    shipmentId: objectId,
  }),
});

const orderIdParam = z.object({
  params: z.object({
    orderId: objectId,
  }),
});

/*                                   Query                                    */

const getShipments = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),

    limit: z.coerce.number().min(1).max(100).optional(),

    status: shipmentStatus.optional(),

    vendor: objectId.optional(),

    search: z.string().trim().optional(),

    sort: z.string().optional(),
  }),
});

export default {
  createShipment,
  updateShipment,
  updateShipmentStatus,
  shipmentIdParam,
  orderIdParam,
  getShipments,
};
