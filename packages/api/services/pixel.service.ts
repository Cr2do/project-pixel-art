import { Types } from 'mongoose';
import { Pixel, IPixel } from '../models/pixel';
import { PixelEvent } from '../models/pixelEvent';
import { PixelBoard } from '../models/pixelboard';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../utils/errors';
import { PlacePixelInput } from '../utils/schemas';

export async function placePixel(input: PlacePixelInput & { pixelBoardId: string; userId: string }): Promise<IPixel> {
  const boardId = new Types.ObjectId(input.pixelBoardId);
  const userId = new Types.ObjectId(input.userId);

  const board = await PixelBoard.findById(boardId);
  if (!board) throw new NotFoundError('PixelBoard introuvable');

  if (board.status === 'FINISHED') {
    throw new ForbiddenError('Ce PixelBoard est terminé, aucun pixel ne peut être placé');
  }

  if (input.position_x >= board.width || input.position_y >= board.height) {
    throw new BadRequestError(
      `Position hors limites — le board fait ${board.width}×${board.height} pixels`,
    );
  }

  const lastPixel = await Pixel.findOne({ pixelBoardId: boardId, userId }).sort({ updatedAt: -1 });

  if (lastPixel && board.delay_seconds > 0) {
    const elapsed = (Date.now() - lastPixel.updatedAt.getTime()) / 1000;
    if (elapsed < board.delay_seconds) {
      const remaining = Math.ceil(board.delay_seconds - elapsed);
      throw new ForbiddenError(`Cooldown actif, attendez encore ${remaining} seconde(s)`);
    }
  }

  let pixel: IPixel;

  // Always store an immutable placement event so we can build "most-used" heatmaps.
  // This is independent from the board override policy.
  await PixelEvent.create({
    pixelBoardId: boardId,
    userId,
    position_x: input.position_x,
    position_y: input.position_y,
    color: input.color,
  });

  if (board.allow_override) {
    const updated = await Pixel.findOneAndUpdate(
      { pixelBoardId: boardId, position_x: input.position_x, position_y: input.position_y },
      { userId, color: input.color },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    pixel = updated as unknown as IPixel;
  } else {
    const existing = await Pixel.findOne({
      pixelBoardId: boardId,
      position_x: input.position_x,
      position_y: input.position_y,
    });
    if (existing) throw new ConflictError('Un pixel existe déjà à cette position');

    pixel = await Pixel.create({
      pixelBoardId: boardId,
      userId,
      position_x: input.position_x,
      position_y: input.position_y,
      color: input.color,
    });
  }

  const hasContribution = board.contributions.some((c) => c.userId.toString() === input.userId);
  if (hasContribution) {
    await PixelBoard.updateOne(
      { _id: boardId, 'contributions.userId': userId },
      { $inc: { 'contributions.$.nb_pixels_placed': 1 } },
    );
  } else {
    await PixelBoard.updateOne(
      { _id: boardId },
      { $push: { contributions: { userId, nb_pixels_placed: 1, is_author: false } } },
    );
  }

  return pixel;
}

export async function findByBoard(pixelBoardId: string): Promise<IPixel[]> {
  return Pixel.find({ pixelBoardId: new Types.ObjectId(pixelBoardId) });
}

export async function findByUser(userId: string): Promise<IPixel[]> {
  return Pixel.find({ userId: new Types.ObjectId(userId) });
}
