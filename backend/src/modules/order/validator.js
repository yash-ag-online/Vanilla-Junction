import * as z from 'zod';

export const orderSchema = z.object({
  phoneNumber: z.object({
    countryCode: z.enum(['+91']),
    number: z.string().min(10).max(10),
  }),
  items: z.array(z.string()),
  address: z.object({
    street: z.object({
      streetNumber: z.string(),
      streetName: z.string(),
      houseNumber: z.string(),
    }),
    city: z.string(),
    state: z.string(),
    zipCode: z.string().min(6).max(6),
  }),
});

export const verifyDeliverySchema = z.object({
  otp: z.string().min(6).max(6),
});
