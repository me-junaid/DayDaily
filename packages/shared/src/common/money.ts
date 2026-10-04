import { z } from 'zod';

export const MoneySchema = z.object({
  amount: z.number().int().nonnegative(), // Amount in paise
  currency: z.enum(['INR']).default('INR'),
});

export type Money = z.infer<typeof MoneySchema>;
