import { z } from 'zod';

export const CorrectionInputSchema = z.object({
  rawPhrase: z.string(),
  correctProductId: z.string(),
});

export type CorrectionInput = z.infer<typeof CorrectionInputSchema>;
