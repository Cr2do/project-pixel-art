import type { Socket } from 'socket.io';

export function registerBoardHandlers(socket: Socket): void {
  socket.on('board:join', (boardId: string) => {
    void socket.join(`board:${boardId}`);
    console.log(`[socket] ${socket.id} joined board:${boardId}`);
  });

  socket.on('board:leave', (boardId: string) => {
    void socket.leave(`board:${boardId}`);
    console.log(`[socket] ${socket.id} left board:${boardId}`);
  });
}
