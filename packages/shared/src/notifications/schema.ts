import { z } from 'zod';

export const NotificationChannelSchema = z.enum(['SMS', 'WHATSAPP', 'PUSH']);

export const SendNotificationSchema = z.object({
  recipientPhone: z.string(),
  channel: NotificationChannelSchema,
  templateName: z.string(),
  templateData: z.record(z.string(), z.string()),
});

export type SendNotification = z.infer<typeof SendNotificationSchema>;
