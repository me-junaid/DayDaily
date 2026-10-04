import { z } from 'zod';

export const PhoneNumberSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number');
export type PhoneNumber = z.infer<typeof PhoneNumberSchema>;
