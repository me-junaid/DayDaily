import { z } from 'zod';

export const StoreSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  phone: z.string(),
  address: z.string(),
  town: z.string(),
  pincode: z.string(),
  isOpen: z.boolean().default(true),
});

export type Store = z.infer<typeof StoreSchema>;
