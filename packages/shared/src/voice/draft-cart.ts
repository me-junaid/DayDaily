import { z } from 'zod';
import { ExtractedItemSchema } from './extraction';

export const DraftCartSchema = z.object({
  sessionId: z.string(),
  items: z.array(ExtractedItemSchema),
  totalPaise: z.number().int().nonnegative(),
});

export type DraftCart = z.infer<typeof DraftCartSchema>;
