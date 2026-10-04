import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

export const notificationQueue = new Queue('notifications', { connection: redis });
export const paymentReconciliationQueue = new Queue('payment-reconciliation', { connection: redis });
export const otpQueue = new Queue('otp', { connection: redis });
