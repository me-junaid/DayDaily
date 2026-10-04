import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { initSockets } from './sockets';

const app = createApp();
const server = http.createServer(app);

initSockets(server);

server.listen(env.PORT, () => {
  logger.info(`🚀 DayDaily API running at http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
});
