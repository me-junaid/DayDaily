import { z } from 'zod';
import { OrderStatus } from './states';
import { CartItemSchema } from '../cart/schema';

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  customerPhone: z.string(),
  storeId: z.string(),
  status: z.nativeEnum(OrderStatus),
  items: z.array(CartItemSchema),
  totalAmount: z.number().int().nonnegative(),
  paymentMethod: z.enum(['COD', 'UPI', 'ONLINE']),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
  deliveryAddress: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;
