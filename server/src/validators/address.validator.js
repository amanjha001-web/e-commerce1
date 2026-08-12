
import { z } from "zod";

import { objectId, phone, booleanField } from "./common.validator.js";

/*                              Base Schema                                   */

const addressBody = {
  type: z
    .enum(["HOME", "WORK", "OTHER"])
    .optional()
    .default("HOME"),

  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),

  phone,

  alternatePhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  addressLine1: z
    .string()
    .trim()
    .min(5, "Address Line 1 is required")
    .max(200),

  addressLine2: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("")),

  landmark: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(100),

  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(100),

  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(100)
    .default("India"),

  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "Invalid PIN Code"),

  coordinates: z
    .object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),

  isDefaultShipping: booleanField
    .optional()
    .default(false),

  isDefaultBilling: booleanField
    .optional()
    .default(false),
};

/*                              Add Address                                   */

export const addAddressSchema = z.object({
  body: z.object(addressBody),
});

/*                             Update Address                                 */

export const updateAddressSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    type: addressBody.type.optional(),

    fullName: addressBody.fullName.optional(),

    phone: phone.optional(),

    alternatePhone: addressBody.alternatePhone,

    addressLine1: addressBody.addressLine1.optional(),

    addressLine2: addressBody.addressLine2,

    landmark: addressBody.landmark,

    city: addressBody.city.optional(),

    state: addressBody.state.optional(),

    country: addressBody.country.optional(),

    pincode: addressBody.pincode.optional(),

    coordinates: addressBody.coordinates,

    isDefaultShipping: addressBody.isDefaultShipping,

    isDefaultBilling: addressBody.isDefaultBilling,
  }),
});

/*                          Set Default Address                               */

export const setDefaultAddressSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                            Delete Address                                  */

export const deleteAddressSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                            Address By Id                                   */

export const addressIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});
