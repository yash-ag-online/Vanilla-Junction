import * as z from 'zod';

export const iceCreamSchema = z.object({
  name: z.string().max(40),
  price: z.number().max(1000).min(0),
  discount: z.number().max(100).min(0).optional(),
  description: z.string().max(500).optional(),
  image: z.union([z.url(), z.string().length(0)]).optional(),
});

export const iceCreamUpdateSchema = z.object({
  name: z.string().max(40).optional(),
  price: z.number().max(1000).min(0).optional(),
  discount: z.number().max(100).min(0).optional(),
  description: z.string().max(500).optional(),
  image: z.union([z.url(), z.string().length(0)]).optional(),
});
