import { z } from "zod";

import {
  email,
  password,
  username,
  fullName,
  objectId,
} from "./common.validator.js";

/*                              Register                                      */

export const registerSchema = z.object({
  body: z
    .object({
      fullName,

      username,

      email,

      password,

      confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Passwords do not match",
        });
      }
    }),
});

/*                                Login                                       */

export const loginSchema = z.object({
  body: z.object({
    email,

    password: z.string().min(1, "Password is required"),
  }),
});

/*                           Refresh Token                                    */

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

/*                           Forgot Password                                  */

export const forgotPasswordSchema = z.object({
  body: z.object({
    email,
  }),
});

/*                            Reset Password                                  */

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Reset token is required"),
  }),

  body: z
    .object({
      password,

      confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Passwords do not match",
        });
      }
    }),
});

/*                           Change Password                                  */

export const changePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: z.string().min(1, "Old password is required"),

      newPassword: password,

      confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Passwords do not match",
        });
      }

      if (data.oldPassword === data.newPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newPassword"],
          message: "New password must be different from old password",
        });
      }
    }),
});

/*                            Update Profile                                  */

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: fullName.optional(),

    username: username.optional(),

    email: email.optional(),
  }),
});

/*                           Verify Email                                     */

export const verifyEmailSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Verification token is required"),
  }),
});

/*                           Resend Verification                              */

export const resendVerificationSchema = z.object({
  body: z.object({
    email,
  }),
});

/*                              User Params                                   */

export const userIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});
