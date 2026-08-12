import { z } from "zod";

/*                                ObjectId                                    */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

/*                              Common Fields                                 */

const name = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(100, "Name cannot exceed 100 characters.");

const email = z.string().trim().email("Invalid email address.").toLowerCase();

const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Invalid phone number.")
  .optional();

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(50);

const status = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "BLOCKED"]);

/*                              Create User                                   */

const createUser = z.object({
  body: z.object({
    name,
    email,
    phone,
    password,
    role: z.enum(["CUSTOMER", "VENDOR", "ADMIN"]).optional(),
  }),
});

/*                              Update User                                   */

const updateUser = z.object({
  params: z.object({
    userId: objectId,
  }),

  body: z
    .object({
      name: name.optional(),
      email: email.optional(),
      phone,
      avatar: z.string().url().optional(),
      status: status.optional(),
    })
    .strict(),
});

/*                           Change Password                                  */

const changePassword = z.object({
  body: z.object({
    currentPassword: z.string().min(8),

    newPassword: password,

    confirmPassword: z.string().min(8),
  }),
});

/*                            Update Status                                   */

const updateUserStatus = z.object({
  params: z.object({
    userId: objectId,
  }),

  body: z.object({
    status,
  }),
});

/*                               Params                                       */

const userIdParam = z.object({
  params: z.object({
    userId: objectId,
  }),
});

/*                               Query                                        */

const getUsers = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),

    limit: z.coerce.number().min(1).max(100).optional(),

    search: z.string().optional(),

    role: z.enum(["CUSTOMER", "VENDOR", "ADMIN"]).optional(),

    status: status.optional(),

    sort: z.string().optional(),
  }),
});

export default {
  createUser,
  updateUser,
  changePassword,
  updateUserStatus,
  userIdParam,
  getUsers,
};
