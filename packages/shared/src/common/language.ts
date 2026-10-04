import { z } from 'zod';

export const SupportedLanguageSchema = z.enum(['en', 'hi', 'ml', 'ta', 'te', 'kn']);
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;
