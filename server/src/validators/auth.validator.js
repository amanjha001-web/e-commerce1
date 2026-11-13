import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').max(50).optional(),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().optional(),
    conformPassword: z.string().optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
  })
  .refine((data) => data.fullName || data.name, {
    message: 'Full name is required',
    path: ['fullName'],
  })
  .refine(
    (data) => {
      const confirm = data.confirmPassword ?? data.conformPassword;
      if (confirm !== undefined && confirm !== null && confirm !== '') {
        return data.password === confirm;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const otpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().min(4, 'OTP must be at least 4 digits').max(8),
});

export const googleAuthSchema = z.object({
  token: z.string().optional(),
  idToken: z.string().optional(),
  credential: z.string().optional(),
});
