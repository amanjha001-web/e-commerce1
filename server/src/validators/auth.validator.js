import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(3, "Full name is required"),

    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters"),

    email: z.string().email("Invalid email address"),

    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),

    password: z.string().min(6, "Password is required"),
  }),
});
