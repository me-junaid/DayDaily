import { z } from 'zod';
import { PhoneNumberSchema } from '../common/phone';

export const RequestOtpSchema = z.object({
  phone: PhoneNumberSchema,
});

export const VerifyOtpSchema = z.object({
  phone: PhoneNumberSchema,
  otp: z.string().length(6),
});

export const UserSessionSchema = z.object({
  userId: z.string(),
  phone: PhoneNumberSchema,
  role: z.enum(['CUSTOMER', 'STORE_OWNER', 'STORE_STAFF', 'ADMIN']),
  storeId: z.string().optional(),
});

export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type UserSession = z.infer<typeof UserSessionSchema>;
