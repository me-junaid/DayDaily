import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  nameVernacular: z.record(z.string(), z.string()).optional(),
  category: z.string(),
  unit: z.enum(['kg', 'g', 'l', 'ml', 'packet', 'piece', 'dozen']),
  unitQuantity: z.number().positive(),
  price: z.number().int().nonnegative(),
  aliases: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
  inStock: z.boolean().default(true),
});

export type Product = z.infer<typeof ProductSchema>;
