import { z } from 'zod';

export const ClarificationQuestionSchema = z.object({
  itemId: z.string(),
  questionText: z.string(),
  options: z.array(z.object({
    productId: z.string(),
    label: z.string(),
    price: z.number().int(),
  })),
});

export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;
