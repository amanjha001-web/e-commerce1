import { z } from "zod";
import mongoose from "mongoose";

/*                              ObjectId                                      */

export const objectId = z
  .string()
  .trim()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid Object ID",
  });

/*                                Name                                        */

export const name = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name cannot exceed 100 characters");
export const fullName = name;

/*                                Email                                       */

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address");

/*                               Username                                     */

export const username = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username cannot exceed 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, {
    message: "Username can only contain letters, numbers and underscore",
  });

/*                               Password                                     */

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100)
  .regex(/[A-Z]/, "Password must contain one uppercase letter")
  .regex(/[a-z]/, "Password must contain one lowercase letter")
  .regex(/[0-9]/, "Password must contain one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain one special character",
  );

/*                                Phone                                       */

export const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Invalid phone number");

/*                                 URL                                        */

export const website = z.string().trim().url("Invalid website URL");

/*                                 Slug                                       */

export const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

/*                             Positive Number                                */

export const positiveNumber = z.coerce
  .number()
  .positive("Value must be greater than zero");

  //positive integer

  export const positiveInteger = z.coerce
    .number()
    .int("Must be an integer")
    .min(1, "Value must be at least 1");

/*                              Money                                         */

export const money = z.coerce.number().min(0, "Amount cannot be negative");

/*                              Percentage                                    */

export const percentage = z.coerce.number().min(0).max(100);

/*                                Rating                                      */

export const rating = z.coerce.number().min(1).max(5);

/*                                Boolean                                     */

export const booleanField = z.coerce.boolean();

/*                                 Date                                       */

export const date = z.string().datetime();

/*                              Sort Order                                    */

export const sortOrder = z.enum(["asc", "desc"]);

/*                                Search                                      */

export const keyword = z.string().trim().max(100).optional();

/*                              Pagination                                    */

export const page = z.coerce.number().int().min(1);

export const limit = z.coerce.number().int().min(1).max(100);
