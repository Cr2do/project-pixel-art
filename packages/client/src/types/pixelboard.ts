export interface IBoardContribution {
  userId: string;
  nb_pixels_placed: number;
  is_author: boolean;
}

export enum PixelBoardStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export interface IPixelBoard {
  id: string;
  name: string;
  width: number;
  height: number;
  position_x: number;
  position_y: number;
  status: PixelBoardStatus;
  allow_override: boolean;
  delay_seconds: number;
  endAt?: string;
  contributions: IBoardContribution[];
  createdAt: string;
  updatedAt: string;
}
