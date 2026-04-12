import { PixelBoardStatus, type IPixelBoard } from '@/types';

export const STATUS_LABEL: Record<PixelBoardStatus, string> = {
  [PixelBoardStatus.IN_PROGRESS]: 'En cours',
  [PixelBoardStatus.FINISHED]: 'Terminé',
};

export function getUserPixelCount(board: IPixelBoard, userId: string): number {
  const contribution = board.contributions.find((c) => c.userId === userId);
  return contribution?.nb_pixels_placed ?? 0;
}
