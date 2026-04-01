import * as z from 'zod';

export const createAdminSchema = z.object({
  phoneNumber: z.object({
    countryCode: z.enum(['+91']),
    number: z.string().min(10).max(10),
  }),
  password: z.string(),
  role: z.enum(['Admin', 'Delivery Person']),
  name: z.string().max(20),
});

export const loginSchema = z.object({
  phoneNumber: z.object({
    countryCode: z.enum(['+91']),
    number: z.string().min(10).max(10),
  }),
  password: z.string(),
});

export const updateAdminSchema = z.object({
  phoneNumber: z
    .object({
      countryCode: z.enum(['+91']),
      number: z.string().min(10).max(10),
    })
    .optional(),
  name: z.string().max(20).optional(),
  password: z.string().optional(),
});

export const refreshTokensSchema = z.object({
  refreshToken: z.jwt(),
});
