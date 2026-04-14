import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let _io: Server;

export function initIO(httpServer: HttpServer): Server {
  _io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  return _io;
}

export function getIO(): Server {
  if (!_io) throw new Error('Socket.io not initialized');
  return _io;
}
