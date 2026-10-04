import { z } from 'zod';

export const EntityIdSchema = z.string().cuid2().or(z.string().uuid()).or(z.string().min(1));
export type EntityId = z.infer<typeof EntityIdSchema>;
