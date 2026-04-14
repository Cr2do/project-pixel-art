import { PixelBoard } from '../models/pixelboard';

export interface MapPixel {
  x: number;
  y: number;
  color: string;
}

export interface MapBoard {
  id: string;
  name: string;
  status: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  pixels: MapPixel[];
}

export interface GlobalMapResponse {
  boards: MapBoard[];
  globalWidth: number;
  globalHeight: number;
}

export async function getGlobalMap(): Promise<GlobalMapResponse> {
  const boards = await PixelBoard.aggregate<MapBoard>([
    {
      $lookup: {
        from: 'pixels',
        localField: '_id',
        foreignField: 'pixelBoardId',
        pipeline: [
          { $project: { _id: 0, x: '$position_x', y: '$position_y', color: 1 } },
        ],
        as: 'pixels',
      },
    },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        status: 1,
        position_x: 1,
        position_y: 1,
        width: 1,
        height: 1,
        pixels: 1,
      },
    },
  ]);

  const globalWidth = boards.reduce((max, b) => Math.max(max, b.position_x + b.width), 0);
  const globalHeight = boards.reduce((max, b) => Math.max(max, b.position_y + b.height), 0);

  return { boards, globalWidth, globalHeight };
}
