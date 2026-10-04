import { z } from 'zod';

export const StoreSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Store name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  address: z.string().min(1, 'Address is required'),
  town: z.string().min(1, 'Town is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a 6-digit Indian PIN code'),
  isOpen: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Store = z.infer<typeof StoreSchema>;

export const CreateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  address: z.string().min(1, 'Address is required'),
  town: z.string().min(1, 'Town is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a 6-digit Indian PIN code'),
  isOpen: z.boolean().default(true),
});

export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;

export const UpdateStoreSchema = CreateStoreSchema.partial();

export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>;

export const StoreQuerySchema = z.object({
  pincode: z.string().optional(),
  town: z.string().optional(),
  query: z.string().optional(),
  isOpen: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type StoreQueryInput = z.infer<typeof StoreQuerySchema>;
