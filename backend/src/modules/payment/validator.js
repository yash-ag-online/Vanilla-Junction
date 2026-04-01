import * as z from 'zod';

export const paymentVerifySchema = z.object({
  razorpayPaymentId: z.string(),
  razorpayPaymentSignature: z.string(),
});

export const paymentFailSchema = z.object({
  razorpayPaymentId: z.string(),
});
