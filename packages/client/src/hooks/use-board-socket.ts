import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { IHoveredCell } from '@/types';

export interface PixelPlacedEvent {
  boardId: string;
  position_x: number;
  position_y: number;
  color: string;
  userId: string;
  username: string;
}

export interface PixelTooltipInfo {
  cell: IHoveredCell;
  userId: string;
  username: string;
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:8000', {
      transports: ['websocket'],
    });
  }
  return socket;
}

export function useBoardSocket(
  boardId: string,
  onPixelPlaced: (event: PixelPlacedEvent) => void,
) {
  const handlePixelPlaced = useCallback(onPixelPlaced, []);

  useEffect(() => {
    const s = getSocket();

    s.emit('board:join', boardId);
    s.on('pixel:placed', handlePixelPlaced);

    return () => {
      s.off('pixel:placed', handlePixelPlaced);
      s.emit('board:leave', boardId);
    };
  }, [boardId, handlePixelPlaced]);
}
