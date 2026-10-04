import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { registerOrderEvents } from './order.events';

export function initSockets(server: HttpServer) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    registerOrderEvents(io, socket);
  });

  return io;
}
