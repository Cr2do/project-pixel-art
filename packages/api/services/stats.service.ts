import { Types } from 'mongoose';
import { User } from '../models/user';
import { PixelBoard } from '../models/pixelboard';
import { Pixel } from '../models/pixel';

export interface StatsResponse {
  activeBoards: number;
  finishedBoards: number;
  totalPixels: number;
  totalContributors: number;
  totalUsers: number;
}

export async function getStats(): Promise<StatsResponse> {
  const [
    totalUsers,
    activeBoards,
    finishedBoards,
    totalPixels,
    totalContributors,
  ] = await Promise.all([
    User.countDocuments(),
    PixelBoard.countDocuments({ status: 'IN_PROGRESS' }),
    PixelBoard.countDocuments({ status: 'FINISHED' }),
    Pixel.countDocuments(),
    Pixel.distinct('userId').then((ids) => ids.length),
  ]);

  return {
    activeBoards,
    finishedBoards,
    totalPixels,
    totalContributors,
    totalUsers,
  };
}
