import { Server, Socket } from 'socket.io';

export function registerOrderEvents(io: Server, socket: Socket) {
  socket.on('join_store_room', (storeId: string) => {
    socket.join(`store:${storeId}`);
  });
}
