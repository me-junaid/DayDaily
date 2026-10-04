import { z } from 'zod';

export const ExtractedItemSchema = z.object({
  rawQuery: z.string(),
  matchedProductId: z.string().nullable(),
  productName: z.string(),
  quantity: z.number().positive().default(1),
  unit: z.string().optional(),
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export const VoiceExtractionResultSchema = z.object({
  transcript: z.string(),
  detectedLanguage: z.string(),
  items: z.array(ExtractedItemSchema),
  unrecognizedPhrases: z.array(z.string()).default([]),
});

export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;
export type VoiceExtractionResult = z.infer<typeof VoiceExtractionResultSchema>;
