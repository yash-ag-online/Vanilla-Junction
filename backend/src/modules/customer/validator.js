import * as z from 'zod';

export const generateLoginOtpSchema = z.object({
  phoneNumber: z.object({
    countryCode: z.enum(['+91']),
    number: z.string().min(10).max(10),
  }),
});

export const loginSchema = z.object({
  phoneNumber: z.object({
    countryCode: z.enum(['+91']),
    number: z.string().min(10).max(10),
  }),
  otp: z.string().min(6).max(6),
});

export const updateCustomerSchema = z.object({
  phoneNumber: z
    .object({
      countryCode: z.enum(['+91']),
      number: z.string().min(10).max(10),
    })
    .optional(),
});

export const refreshTokensSchema = z.object({
  refreshToken: z.jwt(),
});
