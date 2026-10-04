import { z } from 'zod';

export const PaymentMethodSchema = z.enum(['COD', 'UPI_QR', 'RAZORPAY']);
export const PaymentStatusSchema = z.enum(['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED']);

export const PaymentTransactionSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  amountPaise: z.number().int().positive(),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  providerTransactionId: z.string().optional(),
  createdAt: z.string(),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentTransaction = z.infer<typeof PaymentTransactionSchema>;
