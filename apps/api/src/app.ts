import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { authRouter } from './modules/auth/auth.routes';
import { catalogRouter } from './modules/catalog/catalog.routes';
import { ordersRouter } from './modules/orders/orders.routes';
import { voiceRouter } from './modules/voice/voice.routes';
import { paymentsRouter } from './modules/payments/payments.routes';
import { whatsappRouter } from './modules/whatsapp/whatsapp.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestId);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Module routes
  app.use('/api/auth', authRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/voice', voiceRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/whatsapp', whatsappRouter);

  app.use(errorHandler);

  return app;
}
