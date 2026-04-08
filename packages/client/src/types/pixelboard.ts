export interface IBoardContribution {
  userId: string;
  nb_pixels_placed: number;
  is_author: boolean;
}

export type PixelBoardStatus = 'IN_PROGRESS' | 'FINISHED';

export interface IPixelBoard {
  _id: string;
  name: string;
  width: number;
  height: number;
  position_x: number;
  position_y: number;
  status: PixelBoardStatus;
  allow_override: boolean;
  delay_seconds: number;
  contributions: IBoardContribution[];
  createdAt: string;
  updatedAt: string;
}
