import { Types } from 'mongoose';
import { PixelBoard } from '../models/pixelboard';
import { PixelEvent } from '../models/pixelEvent';
import { NotFoundError } from '../utils/errors';

export interface HeatmapPoint {
  x: number;
  y: number;
  count: number;
}

export interface BoardHeatmapResponse {
  board: {
    id: string;
    width: number;
    height: number;
  };
  points: HeatmapPoint[];
  maxCount: number;
}

export async function getPixelBoardHeatmap(
  pixelBoardId: string,
  params?: { from?: string; to?: string },
): Promise<BoardHeatmapResponse> {
  const boardId = new Types.ObjectId(pixelBoardId);

  const board = await PixelBoard.findById(boardId).select({ width: 1, height: 1 });
  if (!board) throw new NotFoundError('PixelBoard introuvable');

  const match: Record<string, unknown> = { pixelBoardId: boardId };

  if (params?.from || params?.to) {
    const createdAt: Record<string, Date> = {};
    if (params.from) createdAt.$gte = new Date(params.from);
    if (params.to) createdAt.$lte = new Date(params.to);
    match.createdAt = createdAt;
  }

  const agg = await PixelEvent.aggregate<HeatmapPoint>([
    { $match: match },
    {
      $group: {
        _id: { x: '$position_x', y: '$position_y' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        x: '$_id.x',
        y: '$_id.y',
        count: 1,
      },
    },
  ]);

  const maxCount = agg.reduce((max, p) => (p.count > max ? p.count : max), 0);

  return {
    board: { id: board.id, width: board.width, height: board.height },
    points: agg,
    maxCount,
  };
}

