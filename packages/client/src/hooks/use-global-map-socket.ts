import { useEffect } from 'react';
import { getSocket, type PixelPlacedEvent } from './use-board-socket';

export function useGlobalMapSocket(
  boardIds: string[],
  onPixelPlaced: (event: PixelPlacedEvent) => void,
) {
  useEffect(() => {
    if (boardIds.length === 0) return;

    const s = getSocket();

    boardIds.forEach((id) => s.emit('board:join', id));
    s.on('pixel:placed', onPixelPlaced);

    return () => {
      s.off('pixel:placed', onPixelPlaced);
      boardIds.forEach((id) => s.emit('board:leave', id));
    };
  }, [boardIds, onPixelPlaced]);
}
