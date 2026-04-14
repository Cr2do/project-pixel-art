import type { Server } from 'socket.io';
import { registerBoardHandlers } from './handlers/board.handler';

export function setupSocket(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);

    registerBoardHandlers(socket);

    socket.on('disconnect', () => {
      console.log(`[socket] Client disconnected: ${socket.id}`);
    });
  });
}
